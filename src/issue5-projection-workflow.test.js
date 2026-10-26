'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('./issue5-projection');
const workflow=require('./issue5-projection-workflow');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const promptText='Use issue 5 instead';
 const user={date:'2026-10-25',time:'22:50:00-07:00',verbatim_user_prompt:promptText,
 salient_surrounding_context:'Previously Issue4 was selected.',explicit_meaning:'Use Issue5.',implicit_meaning:'Other constraints persist.',tone:'directive',mood:'unknown'};
 const response={schema:core.SCHEMAS.agent,role:'agent',turn:1,prompt_comment_id:101,
 prompt_analysis_ref:'issue5:101:prompt-analysis:v1',date:'2026-10-25',time:'22:51:00-07:00',status:'answered',message:'I will use Issue #5.'};
 const data={5:[{id:101,body:core.upsertBlock(promptText,'analysis',user),created_at:'2026-10-25T22:50:00Z'},
 {id:102,body:JSON.stringify(response),created_at:'2026-10-25T22:51:00Z'}],7:[]};
 let next=700;const writes=[],creates=[];let issue5Body='Reserved Issue #5';
 const getById=id=>Object.values(data).flat().find(x=>x.id===id);
 const github={paginate:async(_fn,args)=>data[args.issue_number].map(clone),rest:{issues:{
  async listComments(){throw Error('call paginate instead')},
  async getComment({comment_id}){const c=getById(comment_id);if(!c)throw Error('missing '+comment_id);return {data:clone(c)}},
  async createComment({issue_number,body}){const c={id:next++,body,created_at:'2026-10-25T22:52:00Z'};data[issue_number].push(c);creates.push({issue_number,id:c.id});return {data:clone(c)}},
  async updateComment({comment_id,body}){const c=getById(comment_id);if(!c)throw Error('missing update');c.body=body;writes.push(comment_id);return {data:clone(c)}},
  async get({issue_number}){if(issue_number!==5)throw Error('not issue5');return {data:{number:5,body:issue5Body}}}
 }}};
 const ctx=(n,comment,action='created',changes=null)=>({eventName:'issue_comment',actor:'BestNameYet',repo:{owner:'BestNameYet',repo:'IssueStack-'},payload:{action,issue:{number:n},comment:clone(comment),...(changes?{changes}:{})}});
 const issueCtx=()=>({eventName:'issues',actor:'BestNameYet',repo:{owner:'BestNameYet',repo:'IssueStack-'},payload:{action:'edited',issue:{number:5}}});
 const get=id=>clone(getById(id));
 const second=pair=>({schema:core.SCHEMAS.second,turn:pair.turn,pair_revision:pair.revision,pair_digest:core.pairDigest(pair),projection_return_schema:clone(core.MESSAGE_RETURN_SCHEMA),projection_return:{message:'The conversational UI uses Issue #5.',fidelity:'faithful'}});
 async function pairAndReturn(){
  const event=ctx(5,get(102));const first=await workflow.run({github,context:event,core:{info(){}}});
  const issue7=get(first.issue7_comment_id),p=core.readBlock(issue7.body,'pair'),edit=core.upsertBlock(issue7.body,'second',second(p));
  getById(issue7.id).body=edit;
  const result=await workflow.run({github,context:ctx(7,get(issue7.id),'edited',{body:{from:issue7.body}}),core:{info(){}}});
  return {first,result,pair:p,issue7_id:issue7.id};
 }
 return {github,ctx,issueCtx,data,get,getById,creates,writes,setIssue5Body:x=>{issue5Body=x;},second,pairAndReturn};
}

test('even comment creates exactly one Issue7 comment containing combined source JSON',async()=>{
 const f=fixture();const a=await workflow.run({github:f.github,context:f.ctx(5,f.get(102)),core:{info(){}}});
 assert.equal(a.created,true);assert.equal(f.creates.length,1);assert.equal(f.creates[0].issue_number,7);
 const pair=core.readBlock(f.get(a.issue7_comment_id).body,'pair');
 assert.equal(pair.issue5_prompt_comment_id,101);assert.equal(pair.issue5_agent_comment_id,102);
 assert.equal(pair.user_prompt_json.verbatim_user_prompt,'Use issue 5 instead');
 assert.equal(pair.agent_response_json.message,'I will use Issue #5.');
 const again=await workflow.run({github:f.github,context:f.ctx(5,f.get(102)),core:{info(){}}});
 assert.equal(again.created,false);assert.equal(f.creates.length,1);
 assert.equal(f.data[5].length,2);
});
test('Issue7 validated second-run edit updates bot-only projections on existing Issue5 comments',async()=>{
 const f=fixture(),x=await f.pairAndReturn();
 assert.equal(x.result.state,'projected');
 assert.equal(f.data[5].length,2);assert.equal(f.data[7].length,1);
 assert.equal(core.readBlock(f.get(101).body,'projection').role,'user');
 assert.equal(core.readBlock(f.get(102).body,'projection').role,'agent');
 assert.equal(core.readBlock(f.get(102).body,'projection').payload,'The conversational UI uses Issue #5.');
 assert.equal(core.answerParts(f.get(102)).answer.message,'I will use Issue #5.');
 assert.deepEqual(f.writes.sort(),[101,102]);
});
test('odd-position prompt event does not prematurely create Issue7 record',async()=>{
 const f=fixture(),result=await workflow.run({github:f.github,context:f.ctx(5,f.get(101)),core:{info(){}}});
 assert.equal(result.state,'awaiting_agent_response');assert.equal(f.creates.length,0);
});
test('issue body JSON selector configuration reprojects existing turns without creating comments',async()=>{
 const f=fixture();await f.pairAndReturn();
 const mode=require('../config/issue5-rendering.json');const v=clone(mode);
 v.user_prompt.mode='json';v.agent_response.mode='hidden';
 f.setIssue5Body(core.setIssueConfig('Reserved Issue #5',v));
 const result=await workflow.run({github:f.github,context:f.issueCtx(),core:{info(){}}});
 assert.equal(result.count,1);assert.equal(f.creates.length,1);
 assert.equal(core.readBlock(f.get(101).body,'projection').mode,'json');
 assert.equal(core.readBlock(f.get(102).body,'projection').action,'hide');
 assert.equal(core.readBlock(f.get(102).body,'projection').payload,null);
 assert.equal(core.answerParts(f.get(102)).answer.message,'I will use Issue #5.');
});
test('wrong source digest on agent rearticulation blocks both projection writes',async()=>{
 const f=fixture(),first=await workflow.run({github:f.github,context:f.ctx(5,f.get(102)),core:{info(){}}});
 const old=f.get(first.issue7_comment_id),pair=core.readBlock(old.body,'pair');
 const ret=f.second(pair);ret.pair_digest='1'.repeat(64);
 f.getById(old.id).body=core.upsertBlock(old.body,'second',ret);
 await assert.rejects(workflow.run({github:f.github,context:f.ctx(7,f.get(old.id),'edited',{body:{from:old.body}}),core:{info(){}}}),/stale second-run source digest/);
 assert.equal(f.writes.length,0);
});
test('tampering with Issue7 bot-owned pair block is rejected',async()=>{
 const f=fixture(),first=await workflow.run({github:f.github,context:f.ctx(5,f.get(102)),core:{info(){}}});
 const old=f.get(first.issue7_comment_id);
 const tamper=old.body.replace('"issue5_prompt_comment_id": 101','"issue5_prompt_comment_id": 102');
 f.getById(old.id).body=tamper;
 await assert.rejects(workflow.run({github:f.github,context:f.ctx(7,f.get(old.id),'edited',{body:{from:old.body}}),core:{info(){}}}),/bot-owned pair region altered/);
 assert.equal(f.get(old.id).body,old.body);
});
test('tampering with bot-owned Issue5 projection block is rejected',async()=>{
 const f=fixture();await f.pairAndReturn();const old=f.get(101);
 const changed=old.body.replace('"action": "display"','"action": "hide"');
 f.getById(101).body=changed;
 await assert.rejects(workflow.run({github:f.github,context:f.ctx(5,f.get(101),'edited',{body:{from:old.body}}),core:{info(){}}}),/bot-owned projection region altered/);
 assert.equal(f.get(101).body,old.body);
});
test('stale source edits invalidate original paired return and require new same-ID Issue7 revision',async()=>{
 const f=fixture();await f.pairAndReturn();const old=f.get(102),updated=JSON.parse(core.sourceBody(old.body));
 updated.message='Updated agent response';f.getById(102).body=core.upsertBlock(JSON.stringify(updated),'projection',core.readBlock(old.body,'projection'));
 const stage=await workflow.run({github:f.github,context:f.ctx(5,f.get(102),'edited',{body:{from:old.body}}),core:{info(){}}});
 assert.equal(stage.revised,true);assert.equal(f.creates.length,1);
 const doc=f.get(stage.issue7_comment_id),pair=core.readBlock(doc.body,'pair');
 assert.equal(pair.revision,1);assert.deepEqual(core.readBlock(doc.body,'second'),{});
 assert.equal(pair.agent_response_json.message,'Updated agent response');
});
test('invalid issue config is rejected before projection',async()=>{
 const f=fixture(),cfg=clone(require('../config/issue5-rendering.json'));
 cfg.agent_response.mode='unrecognized';f.setIssue5Body(core.setIssueConfig('x',{...cfg,agent_response:{mode:'json'}}).replace('"mode": "json"','"mode": "unrecognized"'));
 await assert.rejects(workflow.run({github:f.github,context:f.ctx(5,f.get(102)),core:{info(){}}}),/mode invalid/);
});
test('non-owner event and other repositories are rejected',async()=>{
 const f=fixture(),event=f.ctx(5,f.get(102));event.actor='attacker';
 await assert.rejects(workflow.run({github:f.github,context:event,core:{info(){}}}),/Non-owner/);
 event.actor='BestNameYet';event.repo.repo='Other';
 await assert.rejects(workflow.run({github:f.github,context:event,core:{info(){}}}),/Unexpected repository/);
});


test('replay after Issue7 pair revision is idempotent and invalidates stale Issue5 projections',async()=>{
 const f=fixture();
 await f.pairAndReturn();
 const prior=f.get(102),replacement=JSON.parse(core.sourceBody(prior.body));
 replacement.message='An amended first-pass response';
 f.getById(102).body=core.upsertBlock(JSON.stringify(replacement),'projection',core.readBlock(prior.body,'projection'));
 const event=f.ctx(5,f.get(102),'edited',{body:{from:prior.body}});
 const first=await workflow.run({github:f.github,context:event,core:{info(){}}});
 assert.equal(first.revised,true);
 const revised=core.readBlock(f.get(first.issue7_comment_id).body,'pair');
 assert.equal(revised.revision,1);
 assert.deepEqual(core.readBlock(f.get(first.issue7_comment_id).body,'second'),{});
 assert.equal(core.readBlock(f.get(101).body,'projection'),null);
 assert.equal(core.readBlock(f.get(102).body,'projection'),null);
 assert.equal(f.data[5].length,2);
 assert.equal(f.data[7].length,1);
 const retry=await workflow.run({github:f.github,context:event,core:{info(){}}});
 assert.equal(retry.created,false);
 assert.equal(retry.revised,undefined);
 assert.equal(retry.state,'awaiting_or_processed_second_run');
 assert.equal(core.readBlock(f.get(first.issue7_comment_id).body,'pair').revision,1);
 assert.equal(core.readBlock(f.get(first.issue7_comment_id).body,'second').schema,undefined);
});


test('editing a user prompt after an agent response restores the immutable paired source',async()=>{
 const f=fixture();await f.pairAndReturn();
 const original=f.get(101);
 const altered=original.body.replace('Use issue 5 instead','Use issue 4 instead');
 f.getById(101).body=altered;
 const event=f.ctx(5,f.get(101),'edited',{body:{from:original.body}});
 await assert.rejects(workflow.run({github:f.github,context:event,core:{info(){}}}),/Paired user prompt is immutable/);
 assert.equal(f.get(101).body,original.body);
 assert.equal(f.data[5].length,2);
 assert.equal(f.data[7].length,1);
 assert.equal(core.readBlock(f.get(101).body,'projection').role,'user');
 assert.equal(core.readBlock(f.get(102).body,'projection').role,'agent');
});
