'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const p=require('./interactive-procedures.js');
const fence=String.fromCharCode(96).repeat(3);

function fixture(){
 const owner='BestNameYet',repo='IssueStack-',jobId=234,padId=345,procedureId=456;
 const nonce='demo-procedure-job';
 const docs=new Map([
  [6392250512,{id:6392250512,body:'<!-- ISSUESTACK_MAP:234:345:active -->'}],
  [jobId,{id:jobId,body:JSON.stringify({'nonce[string]':nonce,'execution[object<Execution>]':{'status[string]':'running'}})}],
  [padId,{id:padId,body:'# Persistent notes\n<!-- ISSUESTACK_PAD_JOB:234 -->\n\nUser-created working notes stay intact.\n'}],
  [procedureId,{id:procedureId,body:p.render(jobId,padId,nonce,0)}]
 ]);
 const github={rest:{issues:{
  async getComment({comment_id}){const data=docs.get(comment_id);if(!data)throw Error('Missing '+comment_id);return {data:{...data}};},
  async updateComment({comment_id,body}){if(!docs.has(comment_id))throw Error('Missing '+comment_id);docs.set(comment_id,{...docs.get(comment_id),body});return {data:docs.get(comment_id)};}
 }}};
 return {owner,repo,jobId,padId,procedureId,nonce,docs,github,
  answer(revision,stepId='trace',submission='submit-001',summary='Verified references'){
   const old=docs.get(procedureId);
   const start='<!-- ISSUESTACK_AGENT_ANSWER_START -->';
   const end='<!-- ISSUESTACK_AGENT_ANSWER_END -->';
   const oldPane=start+'\n'+fence+'json\n{}\n'+fence+'\n'+end;
   const json=JSON.stringify({revision,step_id:stepId,submission_id:submission,
     answer:{summary,evidence_uri:'https://github.com/BestNameYet/IssueStack-/issues/3'}},null,2);
   const newPane=start+'\n'+fence+'json\n'+json+'\n'+fence+'\n'+end;
   const next=old.body.replace(oldPane,newPane);
   assert.notEqual(next,old.body);
   docs.set(procedureId,{...old,body:next});
   return docs.get(procedureId);
  }
 };
}
test('two tagged JSON panes remain in one comment through rendering',()=>{
 const f=fixture(),a=p.readProjection(f.docs.get(f.procedureId).body);
 assert.equal(a.jobId,234);assert.equal(a.padId,345);
 assert.equal(a.bot.revision,0);assert.equal(a.bot.step_id,'trace');
 assert.deepEqual(a.answer,{});
 assert.equal(p.STEPS.length,5);
});
test('schema rejects malformed and stale responses',()=>{
 assert.match(p.validateAnswer({revision:0},0),/exactly/);
 assert.match(p.validateAnswer({revision:1,step_id:'trace',submission_id:'valid-01',answer:{summary:'yes',evidence_uri:null}},0),/Stale/);
 assert.equal(p.validateAnswer({revision:0,step_id:'trace',submission_id:'valid-01',answer:{summary:'yes',evidence_uri:null}},0),null);
});
test('successful response journals before projecting next step, preserving scratchpad',async()=>{
 const f=fixture(),submitted=f.answer(0);
 await p.processComment({github:f.github,owner:f.owner,repo:f.repo,comment:submitted,core:{}});
 const pad=f.docs.get(f.padId).body;
 assert.match(pad,/User-created working notes stay intact/);
 assert.match(pad,/ISSUESTACK_BOT_HISTORY_START/);
 assert.match(pad,/ISSUESTACK_STEP_EVENT:456:0:submit-001/);
 assert.equal(p.journalEvents(pad,f.procedureId).length,1);
 const next=p.readProjection(f.docs.get(f.procedureId).body);
 assert.equal(next.bot.revision,1);assert.equal(next.bot.step_id,'plan');assert.deepEqual(next.answer,{});
});
test('retry after journal append does not create a duplicate event',async()=>{
 const f=fixture(),original=f.answer(0);
 await p.processComment({github:f.github,owner:f.owner,repo:f.repo,comment:original,core:{}});
 await p.processComment({github:f.github,owner:f.owner,repo:f.repo,comment:original,core:{}});
 assert.equal(p.journalEvents(f.docs.get(f.padId).body,f.procedureId).length,1);
 assert.equal(p.readProjection(f.docs.get(f.procedureId).body).bot.revision,1);
});
test('agent editing the bot instruction is refused',async()=>{
 const f=fixture(),c=f.answer(0);
 c.body=c.body.replace('Verify issue linkage','Skip all validation');
 f.docs.set(f.procedureId,c);
 await assert.rejects(p.processComment({github:f.github,owner:f.owner,repo:f.repo,comment:c,core:{}}),/Bot-owned instruction/);
 assert.equal(p.journalEvents(f.docs.get(f.padId).body,f.procedureId).length,0);
});
test('invalid response keeps the same step with bot feedback',async()=>{
 const f=fixture(),c=f.answer(9);
 await p.processComment({github:f.github,owner:f.owner,repo:f.repo,comment:c,core:{warning(){}}});
 const projection=p.readProjection(f.docs.get(f.procedureId).body);
 assert.equal(projection.bot.revision,0);
 assert.match(projection.bot.last_error,/Stale/);
 assert.equal(p.journalEvents(f.docs.get(f.padId).body,f.procedureId).length,0);
});
