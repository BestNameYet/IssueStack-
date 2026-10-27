'use strict';
/**
 * Read-only source and evidence registry for IssueStack.
 * No GitHub mutation is performed here. Source summaries are not authority.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const toPosix = value => value.split(path.sep).join('/');
const unique = values => [...new Set(values)].sort();
const iso = value => { const d = new Date(value); if (!Number.isFinite(d.getTime())) throw Error('Invalid timestamp'); return d.toISOString(); };
const validPath = p => typeof p === 'string' && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..') && !p.includes('\0');
const sourceUrl = (repo, commit, filename) => 'https://github.com/' + repo + '/blob/' + commit + '/' + filename.split('/').map(encodeURIComponent).join('/');
const EVIDENCE = {
  intake:'https://github.com/BestNameYet/IssueStack-/blob/main/src/issue-1-intake.js',
  pad:'https://github.com/BestNameYet/IssueStack-/blob/main/src/issue-3-scratchpads.js',
  ui:'https://github.com/BestNameYet/IssueStack-/issues/6#issuecomment-6426756411',
  procedures:'https://github.com/BestNameYet/IssueStack-/issues/13'
};

function validateConfig(config) {
  if (!config || config.schema !== 'issuestack.agent-context.config.v1') throw Error('Unsupported config');
  if (!Number.isInteger(config.issue_number) || config.issue_number !== 8) throw Error('Unsafe issue target');
  for (const k of ['included_roots','excluded_patterns','extensions','related_repositories']) {
    if (!Array.isArray(config[k]) || !config[k].every(v => typeof v === 'string')) throw Error('Invalid '+k);
  }
  if (config.included_roots.some(p => !validPath(p))) throw Error('Unsafe root');
  if (config.max_file_bytes < 1 || config.max_file_bytes > 1000000) throw Error('Invalid max_file_bytes');
  if (config.max_context_chars < 100 || config.max_context_chars > 1000000) throw Error('Invalid context budget');
  if (config.max_freshness_hours < 1 || config.max_freshness_hours > 8760) throw Error('Invalid freshness');
  if (!config.publish || typeof config.publish.enabled !== 'boolean' || config.publish.issue_number !== 8) throw Error('Invalid publish config');
  const weights=config.benchmark && config.benchmark.weights;
  if (!weights || Object.values(weights).some(v => typeof v !== 'number' || !Number.isFinite(v) || v<0) || Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)>1e-9) throw Error('Benchmark weights must sum to 1');
  config.excluded_patterns.forEach(v => new RegExp(v,'i'));
  return config;
}
function loadConfig(file) { return validateConfig(JSON.parse(fs.readFileSync(file,'utf8'))); }

function discover(root, config) {
  const files=[], exclusions={count:0,rejected:0};
  function visit(relative) {
    if (!validPath(relative)) throw Error('Unsafe traversal');
    const absolute=path.join(root,relative);
    const stats=fs.lstatSync(absolute);
    if (stats.isSymbolicLink()) { exclusions.rejected++; return; }
    const normalized=toPosix(relative);
    if (config.excluded_patterns.some(p=>new RegExp(p,'i').test(normalized))) { exclusions.count++; return; }
    if (stats.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) visit(path.join(relative,name));
    } else if (stats.isFile() && config.extensions.includes(path.extname(normalized))) {
      if (stats.size>config.max_file_bytes) {exclusions.rejected++;return;}
      files.push({path:normalized,absolute});
    }
  }
  for (const rootName of config.included_roots) {
    const full=path.join(root,rootName);
    if(fs.existsSync(full)) visit(rootName);
  }
  return {files:files.sort((a,b)=>a.path.localeCompare(b.path)),excluded:exclusions.count,rejected:exclusions.rejected};
}
function parseWorkflowEvents(text) {
  const lines=text.split(/\r?\n/),start=lines.findIndex(l=>/^on:\s*(?:#.*)?$/.test(l));
  if(start<0) {
    const match=text.match(/^on:\s*\[([^\]]+)\]/m);
    return match?unique(match[1].split(',').map(s=>s.trim().replace(/^['"]|['"]$/g,''))):[];
  }
  const events=[];
  for(let i=start+1;i<lines.length;i++){
    const l=lines[i];
    if(l.trim() && !/^\s|^#/.test(l)) break;
    const m=l.match(/^  ([a-z][\w-]*):\s*(?:#.*)?$/i);
    if(m) events.push(m[1]);
    const inline=l.match(/^  -\s*([a-z][\w-]*)\s*$/);
    if(inline) events.push(inline[1]);
  }
  return unique(events);
}
function parseSource(relative, content) {
  const imports=[],exports=[],limitations=[];
  if(relative.endsWith('.js')){
    for(const m of content.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) imports.push(m[1]);
    for(const m of content.matchAll(/\bmodule\.exports\s*=\s*\{([^}]*)\}/gs))
      exports.push(...m[1].split(',').map(v=>v.split(':')[0].trim()).filter(v=>/^[A-Za-z_$][\w$]*$/.test(v)));
    for(const m of content.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)) exports.push(m[1]);
    if(/\bimport\s*\(/.test(content)||/\brequire\s*\(\s*[^'"\s]/.test(content))limitations.push('Dynamic imports not resolved');
    limitations.push('Regex-based module scan; not a JavaScript AST or proof of behavior');
  }
  if(relative.endsWith('.yml')||relative.endsWith('.yaml')) limitations.push('Workflow event parser is partial; read YAML for authoritative triggers');
  if(relative.endsWith('.json')) limitations.push('JSON structure indexed as a source file, not semantically validated here');
  return {imports:unique(imports),exports:unique(exports),events:/\.ya?ml$/.test(relative)?parseWorkflowEvents(content):[],limitations};
}
function sourceGraph(root,config,repo,commit) {
  const found=discover(root,config),nodes=[],edges=[],sources=[];
  for(const item of found.files){
    const buffer=fs.readFileSync(item.absolute),contents=buffer.toString('utf8');
    const analysis=parseSource(item.path,contents);
    const url=sourceUrl(repo,commit,item.path),id='file:'+item.path;
    sources.push({path:item.path,sha256:sha(buffer),bytes:buffer.length,commit,url,...analysis});
    nodes.push({id,kind:/\.ya?ml$/.test(item.path)?'workflow':path.extname(item.path)==='.js'?'module':'configuration',evidence:[url],verification:'verified_static'});
    for(const target of analysis.imports){
      if(!target.startsWith('.')) continue;
      const base=path.posix.normalize(path.posix.join(path.posix.dirname(item.path),target));
      const resolved=path.posix.extname(base)?base:base+'.js';
      edges.push({from:id,to:'file:'+resolved,relation:'requires',evidence:[url],verification:'verified_static'});
    }
  }
  const fileIds=new Set(nodes.map(n=>n.id));
  const extraNodes=new Map();
  for(const edge of edges)if(!fileIds.has(edge.to))extraNodes.set(edge.to,{id:edge.to,kind:'unresolved_dependency',evidence:edge.evidence,verification:'unknown'});
  nodes.push(...extraNodes.values());
  for(const number of [1,2,3,5,6,7,8,13])nodes.push({id:'issue:'+number,kind:'github_issue',evidence:['https://github.com/'+repo+'/issues/'+number],verification:'documented'});
  // Explicitly documentary edges; these do not assert observed runtime success.
  edges.push(
    {from:'issue:1',to:'issue:2',relation:'validated_task_transfer',evidence:[EVIDENCE.intake],verification:'documented'},
    {from:'issue:2',to:'issue:3',relation:'job_scratchpad_mapping',evidence:[EVIDENCE.pad],verification:'documented'},
    {from:'issue:5',to:'issue:7',relation:'paired_second_pass',evidence:[EVIDENCE.ui],verification:'documented'},
    {from:'issue:1',to:'issue:13',relation:'declared_procedure_route',evidence:[EVIDENCE.procedures],verification:'documented'},
    {from:'issue:6',to:'issue:8',relation:'instructions_govern_registry',evidence:['https://github.com/'+repo+'/issues/6'],verification:'documented'}
  );
  const finalNodes=nodes.sort((a,b)=>a.id.localeCompare(b.id));
  const present=new Set(finalNodes.map(n=>n.id));
  for(const e of edges)if(!present.has(e.from)||!present.has(e.to))throw Error('Dangling graph edge '+e.from+' to '+e.to);
  return {nodes:finalNodes,edges:edges.sort((a,b)=>(a.from+a.to+a.relation).localeCompare(b.from+b.to+b.relation)),sources,coverage:{included:sources.length,excluded:found.excluded,rejected:found.rejected,analyzer:'static-patterns-v1'}};
}
function runtimeSnapshot({observedAt,runs,job,maxFreshnessHours}) {
  const at=iso(observedAt), maxAge=maxFreshnessHours*3600000;
  const workflows=(runs||[]).map(run=>{
    const runAt=run.updated_at||run.created_at, stale=!runAt || Date.parse(at)-Date.parse(runAt)>maxAge;
    return {id:run.id,path:run.path,name:run.name,status:run.status,conclusion:run.conclusion||null,run_at:runAt||null,
      evidence:run.html_url||null,stale,verification:'verified_runtime',
      assessment:stale?'stale':run.status==='completed'?('last_run_'+(run.conclusion||'unknown')):'in_progress'};
  }).sort((a,b)=>String(a.path).localeCompare(String(b.path)));
  return {observed_at:at,workflows,job:job||{status:'unknown',verification:'unknown'}};
}
function buildRegistry({root,repo,commit,config,observedAt,runs=[],job=null}) {
  validateConfig(config);
  if(!/^[0-9a-f]{40}$/.test(commit))throw Error('Source commit must be full SHA');
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw Error('Invalid repository');
  const src=sourceGraph(root,config,repo,commit);
  const raw=JSON.stringify(config);
  return {schema:'issuestack.agent-context.registry.v1',generated_at:iso(observedAt),repository:repo,source_commit:commit,
    config_sha256:sha(raw),
    pages:[
      {id:'architecture',title:'Component and dependency graph',purpose:'source and documented control-flow evidence'},
      {id:'source-index',title:'Canonical source intelligence',purpose:'file hashes, references and safe static interfaces'},
      {id:'runtime',title:'Observed operational state',purpose:'workflow and job receipts with freshness'},
      {id:'decisions',title:'Design rationale and lineage',purpose:'documented decisions, explicit unknowns'},
      {id:'invariants',title:'Invariants and failure memory',purpose:'verifiable rules and counterexamples'},
      {id:'retrieval',title:'Bounded agent retrieval',purpose:'task-specific references and context budgets'},
      {id:'evaluation',title:'Contextualization evaluation',purpose:'reproducible comparative scoring and thresholds'}
    ],...src,runtime:runtimeSnapshot({observedAt,runs,job,maxFreshnessHours:config.max_freshness_hours}),
    uncertainties:['Static scans do not prove execution or effectiveness','Runtime status is only a dated observation',
      'Cross-repository lineage requires independent evidence','Unscanned and excluded files are not represented','Agent model benchmark requires actual separate cohort outputs']};
}
function retrieve(registry,query,maxChars) {
  if(!Number.isInteger(maxChars)||maxChars<100)throw Error('Invalid budget');
  const terms=String(query).toLowerCase().split(/[^a-z0-9_-]+/).filter(t=>t.length>2);
  const scored=registry.sources.map(s=>({...s,score:terms.reduce((n,t)=>n+(s.path.toLowerCase().includes(t)?3:0)+(s.exports.some(e=>e.toLowerCase().includes(t))?2:0),0)}));
  scored.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
  const result={schema:'issuestack.agent-context.retrieve.v1',commit:registry.source_commit,query,
    warning:'Read current AGENTS.md and applicable Issue #6 instruction pages before operations; reconfirm runtime evidence.',
    sources:[],truncated:false};
  for(const item of scored) {
    if(item.score===0)continue;
    const entry={path:item.path,url:item.url,sha256:item.sha256,exports:item.exports,events:item.events,score:item.score};
    const tentative=JSON.stringify({...result,sources:[...result.sources,entry]});
    if(tentative.length>maxChars){result.truncated=true;break;}
    result.sources.push(entry);
  }
  return result;
}
function scoreBenchmark(fixtures,answers,config) {
  validateConfig(config);
  const map=new Map(answers.map(a=>[a.id,a]));
  const rows=fixtures.fixtures.map(f=>{
    const a=map.get(f.id);
    const unknown=f.expected===null;
    const correct=unknown?a?.answer===null:a?.answer===f.expected;
    const unsupported=!!a && (unknown?a.answer!==null:!!a.unsupported);
    return {id:f.id,correct:!!correct,unsupported:!!unsupported,answered:!!a,tokens:a?.tokens??null,retrievals:a?.retrievals??null,confidence:a?.confidence??null};
  });
  const count=rows.length||1,mean=field=>rows.reduce((sum,r)=>sum+(Number.isFinite(r[field])?r[field]:0),0)/count;
  const accuracy=rows.filter(r=>r.correct).length/count,unsupported=rows.filter(r=>r.unsupported).length/count;
  return {schema:'issuestack.agent-context.benchmark.v1',accuracy,unsupported_rate:unsupported,mean_tokens:mean('tokens'),mean_retrievals:mean('retrievals'),
    calibration_error:rows.reduce((sum,r)=>sum+(Number.isFinite(r.confidence)?Math.abs(r.confidence-(r.correct?1:0)):1),0)/count,
    meets_thresholds:accuracy>=config.benchmark.min_accuracy&&unsupported<=config.benchmark.max_unsupported,details:rows};
}
function compareBenchmarks(a,b,config){
  const w=validateConfig(config).benchmark.weights,delta={
    accuracy:b.accuracy-a.accuracy,unsupported:a.unsupported_rate-b.unsupported_rate,
    retrieval:a.mean_retrievals-b.mean_retrievals,tokens:a.mean_tokens-b.mean_tokens,
    calibration:a.calibration_error-b.calibration_error};
  // Numeric deltas are reported separately: retrieval/tokens are not normalized into score.
  return {delta,weighted_accuracy_safety:w.accuracy*delta.accuracy+w.unsupported*delta.unsupported+w.calibration*delta.calibration,
    weights:w,limits:'Retrieval/token costs are unnormalized; do not interpret combined metrics as one calibrated probability.'};
}
module.exports={sha,validateConfig,loadConfig,discover,parseWorkflowEvents,parseSource,sourceGraph,runtimeSnapshot,buildRegistry,retrieve,scoreBenchmark,compareBenchmarks};
if(require.main===module){
  const args=process.argv.slice(2),get=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
  const root=path.resolve(get('--root','.')),config=loadConfig(path.join(root,get('--config','config/agent-context-registry.json')));
  const commit=get('--commit',process.env.GITHUB_SHA),repo=get('--repo',process.env.GITHUB_REPOSITORY||'BestNameYet/IssueStack-');
  const record=buildRegistry({root,config,repo,commit,observedAt:process.env.CONTEXT_OBSERVED_AT||new Date().toISOString()});
  const output=get('--output',null),body=JSON.stringify(record,null,2)+'\n';
  if(output)fs.writeFileSync(output,body);else process.stdout.write(body);
}