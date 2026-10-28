'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const reg=require('../src/agent-context-registry.js');
const pub=require('../src/issue8-context-publisher.js');
const reconcile=require('../src/issue8-context-reconciler.js');
const bench=require('../src/issue8-context-benchmark.js');
const root=path.resolve(__dirname,'..');
const config=reg.loadConfig(path.join(root,'config/agent-context-registry.json'));
const publicFixtures=JSON.parse(fs.readFileSync(path.join(root,'config/agent-context-fixtures.json'),'utf8'));
const heldout=JSON.parse(fs.readFileSync(path.join(root,'config/agent-context-heldout.json'),'utf8'));
const HEAD='0123456789abcdef0123456789abcdef01234567';
function fixtures(){
 const base={schema:'issuestack.agent-context.page.v1',repository:'BestNameYet/IssueStack-',source_commit:HEAD,
   generated_at:'2026-10-27T20:00:00Z',config_sha256:'a'.repeat(64)};
 const pages=[
   {id:'architecture',contents:{...base,kind:'architecture',nodes:[],edges:[]}},
   {id:'runtime',contents:{...base,kind:'runtime',data:{observed_at:'2026-10-27T20:00:00Z',workflows:[],job:{status:'unknown'}}}}
 ];
 const comments=pages.map((p,i)=>({id:100+i,body:pub.pageBody(p.id,p.contents)}));
 const toc={schema:'issuestack.agent-context.toc.v1',commit:HEAD,
   pages:pages.map((p,i)=>({page_id:p.id,comment_id:100+i,
     url:'https://github.com/BestNameYet/IssueStack-/issues/8#issuecomment-'+(100+i),
     sha256:reg.sha(comments[i].body)}))};
 comments.push({id:103,body:pub.pageBody('toc',toc)});
 return {pages,comments};
}
test('TOC verification is exact; fresh published data is usable with limits',()=>{
 const {comments}=fixtures();
 const report=reconcile.audit(comments,{now:'2026-10-27T21:00:00Z',maxFreshnessHours:2});
 assert.equal(report.ok,true);assert.equal(report.stale,false);assert.equal(report.page_count,2);
 assert.equal(report.toc_comment_id,103);assert.equal(report.source_commit,HEAD);
});
test('Unapproved drift does not write and avoids benign timestamp churn',()=>{
 const {comments,pages}=fixtures();
 const desired=pages.map(p=>({...p,contents:{...p.contents,generated_at:'2026-10-27T21:00:00Z'}}));
 const report=reconcile.plan({comments,desiredPages:desired,sourceCommit:HEAD,config,now:'2026-10-27T21:00:00Z'});
 assert.equal(report.needs_review,false);
 assert.ok(report.changes.every(v=>v.action==='no_op'));assert.equal(report.mode,'read_only');assert.equal(report.publication_allowed,false);
 const modified=desired.map(p=>({...p,contents:{...p.contents}}));
 modified[0].contents.nodes=[{id:'new',evidence:['verified']}];
 const changed=reconcile.plan({comments,desiredPages:modified,sourceCommit:HEAD,config,now:'2026-10-27T21:00:00Z'});
 assert.equal(changed.needs_review,true);
 assert.ok(changed.changes.some(v=>v.action==='update'&&v.page_id==='architecture'));
 assert.equal(changed.publication_allowed,false);
});
test('corrupt, duplicate and missing pages refuse silent success',()=>{
 const {comments}=fixtures();
 comments[0].body=comments[0].body.replace('"nodes": []','"nodes": ["tampered"]');
 const audit=reconcile.audit(comments,{now:'2026-10-27T21:00:00Z'});
 assert.equal(audit.ok,false);assert.ok(audit.problems.some(p=>p.includes('checksum')));
 const dup=fixtures().comments;dup.push({...dup[0],id:999});
 const found=reconcile.audit(dup,{now:'2026-10-27T21:00:00Z'});
 assert.equal(found.ok,false);assert.ok(found.problems.some(p=>p.includes('Duplicate')));
 const absent=fixtures().comments;absent.splice(0,1);
 assert.ok(reconcile.audit(absent,{now:'2026-10-27T21:00:00Z'}).problems.some(p=>p.includes('checksum')));
});
test('stale runtime and source drift are surfaced independently',()=>{
 const {comments,pages}=fixtures();
 const old=reconcile.audit(comments,{now:'2026-10-31T00:00:00Z',maxFreshnessHours:48});
 assert.equal(old.stale,true);assert.ok(old.warnings.some(x=>x.includes('stale')));
 const plan=reconcile.plan({comments,desiredPages:pages,sourceCommit:'f'.repeat(40),config,now:'2026-10-31T00:00:00Z'});
 assert.equal(plan.needs_review,true);assert.equal(plan.source_drift,true);
 const runtime=plan.changes.find(x=>x.page_id==='runtime');assert.equal(runtime.action,'update');
});
test('read-only GitHub interface accepts paginated comments and rejects untrusted response',async()=>{
 const a=fixtures().comments;
 const github={paginate:async(fn,args)=>{assert.equal(args.issue_number,8);return a;},rest:{issues:{listComments:()=>{}}}};
 assert.deepEqual(await reconcile.readIssue8(github,{owner:'BestNameYet',repo:'IssueStack-'}),a);
 await assert.rejects(reconcile.readIssue8({},{}),/read-only/i);
});
test('seeded protocol excludes ground-truth answers and is reproducible',()=>{
 const a=bench.buildProtocol({fixtures:publicFixtures,heldout,seed:101});
 const b=bench.buildProtocol({fixtures:publicFixtures,heldout,seed:101});
 assert.deepEqual(a,b);
 assert.equal(a.conditions[0].registry_allowed,false);
 assert.equal(a.conditions[1].registry_allowed,true);
 assert.equal(a.prompts.adversarial.length,10);
 assert.equal(a.prompts.public.length,10);
 assert.ok(a.prompts.public.every(f=>Object.keys(f).sort().join(',')==='id,question'));
 assert.ok(!JSON.stringify(a.prompts).includes('expected'));
 assert.notDeepEqual(a.prompts.adversarial,bench.buildProtocol({fixtures:publicFixtures,heldout,seed:102}).prompts.adversarial);
});
test('extended evaluator rejects missing actual-cohort evidence and verifies both fixture groups',()=>{
 const fixturesAll=[...publicFixtures.fixtures,...heldout.fixtures];
 const mk=(cohort,run_id)=>({run_id,cohort,source_commit:HEAD,seed:20261027,
   model:'ExternalModel',timestamp:'2026-10-27T23:00:00Z',provenance:'independent-run-evidence://'+run_id,
   answers:fixturesAll.map(f=>({id:f.id,answer:f.expected,confidence:0.8,tokens:120,retrievals:3}))});
 const a=mk('baseline','baseline-101'),b=mk('registry','registry-101');
 const result=bench.evaluateExtended({config,fixtures:publicFixtures,heldout,baseline:a,registryAnswers:b});
 assert.equal(result.public.baseline.accuracy,1);
 assert.equal(result.adversarial.registry.accuracy,1);
 assert.equal(result.complete_runs,true);
 assert.throws(()=>bench.evaluateExtended({config,fixtures:publicFixtures,heldout,baseline:a,registryAnswers:a}),/identity|distinct/);
 const noMeasurements=mk('registry','registry-102');delete noMeasurements.answers[0].tokens;
 assert.throws(()=>bench.evaluateExtended({config,fixtures:publicFixtures,heldout,baseline:a,registryAnswers:noMeasurements}),/missing token/i);
});

test('publisher writes hash-complete TOC links accepted by reconciler; tampering is detected',async()=>{
 const receipt='a'.repeat(64),when='2026-10-27T20:00:00Z',comments=new Map();
 let nextId=100;
 const github={
  paginate:async()=>[...comments.values()],
  rest:{issues:{
   listComments:async()=>({data:[...comments.values()]}),
   getComment:async({comment_id})=>({data:comments.get(comment_id)}),
   createComment:async({body})=>{
    const record={id:nextId++,body};comments.set(record.id,record);
    return {data:record};
   },
   updateComment:async({comment_id,body})=>{
    const record={id:comment_id,body};comments.set(comment_id,record);
    return {data:record};
   }
  }}
 };
 const registry={
  repository:'BestNameYet/IssueStack-',source_commit:HEAD,generated_at:when,
  config_sha256:'f'.repeat(64),nodes:[],edges:[],coverage:{included:0},
  sources:[],runtime:{observed_at:when,workflows:[]},uncertainties:[]
 };
 const allowed={...config,publish:{...config.publish,enabled:true}};
 const previous=process.env.CONTEXT_APPROVED_REVIEW_SHA;
 process.env.CONTEXT_APPROVED_REVIEW_SHA=receipt;
 try{
  const published=await pub.publish({github,owner:'BestNameYet',repo:'IssueStack-',config:allowed,record:registry,reviewReceipt:receipt});
  const tocComment=comments.get(published.toc_comment_id);
  const toc=JSON.parse(tocComment.body.slice('<!-- ISSUESTACK_CONTEXT_PAGE:toc -->\n'.length));
  assert.equal(toc.pages.length,7);
  for(const link of toc.pages)assert.equal(link.sha256,reg.sha(comments.get(link.comment_id).body));
  const integrity=reconcile.audit([...comments.values()],{now:'2026-10-27T21:00:00Z'});
  assert.equal(integrity.ok,true,JSON.stringify(integrity.problems));
  const tampered=published.pages[0].comment_id;
  comments.set(tampered,{...comments.get(tampered),body:comments.get(tampered).body+'\nTAMPER'});
  assert.throws(()=>reconcile.audit([...comments.values()],{now:'2026-10-27T21:00:00Z'}),/Invalid registry JSON/);
 }finally{
  if(previous===undefined)delete process.env.CONTEXT_APPROVED_REVIEW_SHA;
  else process.env.CONTEXT_APPROVED_REVIEW_SHA=previous;
 }
});
