'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const p=require('./procedure-documents.js');
const fence=String.fromCharCode(96).repeat(3);
const definition={
 schema:'issuestack.procedure.v1',
 nonce:'demo-declared-procedure-01',
 title:'Declared two-step sample',
 steps:[
  {id:'identify',instruction:'Return a confirmed identity record.',returns:{type:'object',
   properties:{subject:{type:'string'},confirmed:{type:'boolean'}},required:['subject','confirmed'],additionalProperties:false}},
  {id:'scores',instruction:'Return an array of integer scores.',returns:{type:'array',items:{type:'integer'}}}
 ]
};
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const owner='BestNameYet',repo='IssueStack-',id=701,sourceId=501;
 const initial=p.render(p.initialState(clone(definition),sourceId));
 const docs=new Map([[id,{id,body:initial}]]);
 const github={rest:{issues:{
  async getComment({comment_id}){const doc=docs.get(comment_id);if(!doc)throw Error('not found');return {data:{...doc}};},
  async updateComment({comment_id,body}){docs.set(comment_id,{id:comment_id,body});return {data:docs.get(comment_id)};}
 }}};
 function submit(value,submission='s1',rev=0,step='identify'){
  const old=docs.get(id),start=p.ANSWER_START,end=p.ANSWER_END;
  const answer={revision:rev,step_id:step,submission_id:submission,return_value:value};
  const body=old.body.replace(start+'\n'+fence+'json\n{}\n'+fence+'\n'+end,
    start+'\n'+fence+'json\n'+JSON.stringify(answer,null,2)+'\n'+fence+'\n'+end);
  assert.notEqual(body,old.body);
  docs.set(id,{id,body});
  return {old:old.body,now:docs.get(id)};
 }
 async function process(result){return p.processEdit({
  github,owner,repo,comment:result.now,previousBody:result.old,core:{info(){}}
 });}
 return {id,sourceId,docs,github,submit,process};
}
test('valid procedure declares ordered steps and typed returns',()=>{
 assert.equal(p.validateDeclaration(definition),null);
 assert.equal(p.validateValue({subject:'a',confirmed:true},definition.steps[0].returns),null);
 assert.match(p.validateValue({subject:'a',confirmed:'yes'},definition.steps[0].returns),/boolean/);
 assert.match(p.validateValue([2,1.5],definition.steps[1].returns),/integer/);
});
test('intake validator rejects malformed procedures and step schemas',()=>{
 const invalid=clone(definition);delete invalid.steps[0].returns;
 assert.match(p.validateDeclaration(invalid),/returns/);
 const duplicate=clone(definition);duplicate.steps[1].id='identify';
 assert.match(p.validateDeclaration(duplicate),/duplicated/);
 const unexpected=clone(definition);unexpected.steps[0].returns.additionalProperties=true;
 assert.match(p.validateDeclaration(unexpected),/additionalProperties/);
 const empty=clone(definition);empty.steps=[];
 assert.match(p.validateDeclaration(empty),/1-50/);
});
test('stepwise JSON projects only current declared step, state is hidden',()=>{
 const f=fixture(),body=f.docs.get(f.id).body,r=p.parseComment(body);
 assert.equal(r.bot.revision,0);
 assert.equal(r.bot.step_id,'identify');
 assert.deepEqual(r.bot.return_schema,definition.steps[0].returns);
 assert.equal(r.state.returns.length,0);
 assert.ok(body.includes(p.STATE_START));
 assert.deepEqual(r.answer,{});
});
test('valid return advances same comment ID and retains typed prior inputs',async()=>{
 const f=fixture();
 await f.process(f.submit({subject:'alpha',confirmed:true}));
 let parsed=p.parseComment(f.docs.get(f.id).body);
 assert.equal(parsed.bot.step_id,'scores');assert.equal(parsed.bot.revision,1);
 assert.deepEqual(parsed.state.returns[0].return_value,{subject:'alpha',confirmed:true});
 await f.process(f.submit([1,2,3],'s2',1,'scores'));
 parsed=p.parseComment(f.docs.get(f.id).body);
 assert.equal(parsed.bot.status,'complete');assert.equal(parsed.bot.revision,2);
 assert.deepEqual(parsed.state.returns.map(x=>x.return_value),[{subject:'alpha',confirmed:true},[1,2,3]]);
 assert.deepEqual(parsed.answer,{});
 assert.equal(f.docs.size,1);
});
test('wrong declared return type blocks advancement and keeps answer for correction',async()=>{
 const f=fixture();
 await f.process(f.submit({subject:'alpha',confirmed:'not boolean'}));
 let parsed=p.parseComment(f.docs.get(f.id).body);
 assert.equal(parsed.state.revision,0);
 assert.match(parsed.bot.last_error,/boolean/);
 assert.equal(parsed.state.returns.length,0);
});
test('editing hidden state or bot panel with answer is rejected',async()=>{
 const f=fixture();
 const change=f.submit({subject:'ok',confirmed:true});
 change.now.body=change.now.body.replace('"revision": 0','"revision": 1');
 f.docs.set(f.id,change.now);
 await assert.rejects(f.process(change),/bot-owned section/);
 const parsed=p.parseComment(change.old);
 assert.equal(parsed.state.revision,0);
});
test('stale revision does not write prior results',async()=>{
 const f=fixture();
 await f.process(f.submit({subject:'ok',confirmed:true},'a-01'));
 await f.process(f.submit([1,2],'a-02',0,'identify'));
 const parsed=p.parseComment(f.docs.get(f.id).body);
 assert.equal(parsed.state.revision,1);
 assert.match(parsed.bot.last_error,/Stale/);
 assert.equal(parsed.state.returns.length,1);
});
test('procedure declaration can be provisioned once without Issue #2 job',async()=>{
 const f=fixture(),d=clone(definition),created=[];
 let nextId=990;
 const gh={paginate:async()=>created,rest:{issues:{
  async createComment({issue_number,body}){assert.equal(issue_number,13);const obj={id:nextId++,body};created.push(obj);return {data:obj};},
  async getComment({comment_id}){return {data:created.find(x=>x.id===comment_id)};}
 }}};
 const first=await p.ensureDeclaredProcedure({github:gh,owner:'BestNameYet',repo:'IssueStack-',declaration:d,sourceId:501,core:{}});
 const second=await p.ensureDeclaredProcedure({github:gh,owner:'BestNameYet',repo:'IssueStack-',declaration:d,sourceId:501,core:{}});
 assert.equal(first,second);assert.equal(created.length,1);
});
