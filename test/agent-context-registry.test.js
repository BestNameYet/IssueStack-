'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const context=require('../src/agent-context-registry.js');
const pub=require('../src/issue8-context-publisher.js');
const runtime=require('../src/issue8-context-runtime.js');
const root=path.resolve(__dirname,'..');
const config=context.loadConfig(path.join(root,'config/agent-context-registry.json'));
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'config/agent-context-fixtures.json'),'utf8'));
const COMMIT='0123456789abcdef0123456789abcdef01234567';

test('configuration is versioned, safe, and configurable',()=>{
  assert.equal(config.issue_number,8);
  assert.ok(config.max_context_chars>=100);
  const limited=JSON.parse(JSON.stringify(config));
  limited.max_context_chars=250;
  limited.max_freshness_hours=1;
  assert.equal(context.validateConfig(limited),limited);
  limited.benchmark.weights.accuracy=5;
  assert.throws(()=>context.validateConfig(limited),/sum to 1/);
  const unsafe=JSON.parse(JSON.stringify(config));
  unsafe.included_roots=['../secrets'];
  assert.throws(()=>context.validateConfig(unsafe),/Unsafe root/);
});
test('workflow events and source exports are parsed conservatively',()=>{
  assert.deepEqual(context.parseWorkflowEvents('name: Test\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\njobs:\n  test: {}'),['push','workflow_dispatch']);
  assert.deepEqual(context.parseWorkflowEvents('on: [push, pull_request]\n'),['pull_request','push']);
  const source=context.parseSource('src/test.js',"const x=require('./child'); module.exports={go,stop};");
  assert.deepEqual(source.imports,['./child']);
  assert.deepEqual(source.exports,['go','stop']);
  assert.match(source.limitations[0],/Regex-based/);
});
test('graph source hashes, canonical links and dependencies are complete',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'issue8-'));
  try{
    fs.mkdirSync(path.join(tmp,'src'));
    fs.writeFileSync(path.join(tmp,'src','a.js'),"const b=require('./b'); module.exports={run};\n");
    fs.writeFileSync(path.join(tmp,'src','b.js'),"module.exports={stop};\n");
    fs.writeFileSync(path.join(tmp,'src','secret-audio.js'),"throw Error('private');\n");
    const c={...config,included_roots:['src'],excluded_patterns:['secret-audio']};
    const graph=context.sourceGraph(tmp,c,'BestNameYet/IssueStack-',COMMIT);
    assert.equal(graph.sources.length,2);
    assert.equal(graph.coverage.excluded,1);
    assert.ok(graph.edges.some(e=>e.from==='file:src/a.js'&&e.to==='file:src/b.js'));
    assert.ok(graph.nodes.find(n=>n.id==='issue:8'));
    assert.ok(graph.sources.every(s=>s.sha256.length===64&&s.url.includes(COMMIT)));
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('dated runtime evidence is not confused with current health',()=>{
 const snap=context.runtimeSnapshot({observedAt:'2026-10-27T20:00:00Z',maxFreshnessHours:1,
 runs:[{id:1,path:'a.yml',name:'A',status:'completed',conclusion:'success',updated_at:'2026-10-27T19:59:00Z',html_url:'https://github.com/x/y/actions/runs/1'},
 {id:2,path:'b.yml',name:'B',status:'completed',conclusion:'failure',updated_at:'2026-10-26T16:00:00Z',html_url:'https://github.com/x/y/actions/runs/2'}]});
 assert.equal(snap.workflows[0].assessment,'last_run_success');
 assert.equal(snap.workflows[1].assessment,'stale');
 assert.equal(snap.workflows[1].conclusion,'failure');
});
test('retrieval obeys context budget and preserves source identity',()=>{
 const record=context.buildRegistry({root,repo:'BestNameYet/IssueStack-',commit:COMMIT,config,observedAt:'2026-10-27T20:00:00Z'});
 assert.equal(record.schema,'issuestack.agent-context.registry.v1');
 assert.ok(record.sources.length>5);
 assert.ok(record.edges.every(e=>record.nodes.some(n=>n.id===e.from)&&record.nodes.some(n=>n.id===e.to)));
 assert.ok(record.coverage.excluded>0);
 const result=context.retrieve(record,'issue intake',config.max_context_chars);
 assert.ok(JSON.stringify(result).length<=config.max_context_chars);
 assert.ok(result.sources.every(v=>v.path&&v.sha256));
});
test('context scoring identifies correct, incorrect and unanswerable claims',()=>{
 const answers=fixtures.fixtures.map(f=>({id:f.id,answer:f.expected,tokens:300,retrievals:2,confidence:0.9}));
 const good=context.scoreBenchmark(fixtures,answers,config);
 assert.equal(good.accuracy,1); assert.equal(good.unsupported_rate,0);
 assert.equal(good.meets_thresholds,true);
 const altered=answers.map(a=>({...a}));
 altered.find(x=>x.id==='Q08').answer='guessed latest workflow';
 const bad=context.scoreBenchmark(fixtures,altered,config);
 assert.ok(bad.accuracy<good.accuracy);
 assert.ok(bad.unsupported_rate>0);
 const comparison=context.compareBenchmarks(bad,good,config);
 assert.ok(comparison.delta.accuracy>0);
});
test('publication is disabled without separate explicit review authorization',async()=>{
 const record=context.buildRegistry({root,repo:'BestNameYet/IssueStack-',commit:COMMIT,config,observedAt:'2026-10-27T20:00:00Z'});
 const pages=pub.pagePayloads(record);
 assert.ok(pages.some(p=>p.id==='runtime'));
 assert.ok(pages.some(p=>p.id==='source-index')===false);
 assert.ok(pages.some(p=>p.id.startsWith('sources-')));
 assert.ok(pub.pageBody('toc',{x:1}).startsWith('<!-- ISSUESTACK_CONTEXT_PAGE:toc -->'));
 await assert.rejects(pub.publish({github:{},owner:'BestNameYet',repo:'IssueStack-',config,record,reviewReceipt:'0'.repeat(64)}),/disabled/);
});
test('runtime observer verifies nonce and does not claim implementation success',async()=>{
 const j={'nonce[string]':'issuestack-agent-context-registry-issue8-20261027-v1',
 'execution[object<Execution>]':{'status[string]':'running','started_at[string|null]':'2026-10-27T20:01:31Z'},
 'completion[object<Completion>]':{'success[boolean|null]':null,'remaining_requirement_ids[array<Reference>]':[{'id[string]':'R1'}]}};
 const github={rest:{actions:{listWorkflowRunsForRepo:async()=>({data:{workflow_runs:[]}})},issues:{getComment:async()=>({data:{body:JSON.stringify(j),updated_at:'2026-10-27T20:01:31Z'}})}}};
 const observed=await runtime.observe({github,owner:'BestNameYet',repo:'IssueStack-',config,now:'2026-10-27T20:03:00Z'});
 assert.equal(observed.job.status,'running');assert.equal(observed.job.outstanding,1);assert.equal(observed.job.success,null);
});
