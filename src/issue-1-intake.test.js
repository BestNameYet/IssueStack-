'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const intake=require('./issue-1-intake.js');

const owner='BestNameYet',repo='IssueStack-';
const ledgerId=intake.LEDGER_ID,slotId=intake.SLOT_IDS[0];
function makeLedger(){
 const docs=new Map([[ledgerId,{id:ledgerId,body:intake.initialLedger()}]]);
 let writes=0;
 const github={rest:{issues:{
  async getComment({comment_id}){const item=docs.get(comment_id);if(!item)throw Error('missing '+comment_id);return {data:{...item}};},
  async updateComment({comment_id,body}){const item=docs.get(comment_id);if(!item)throw Error('missing '+comment_id);writes++;docs.set(comment_id,{...item,body});return {data:docs.get(comment_id)};}
 }}};
 return {github,docs,get writes(){return writes;}};
}
function receipt(prefix,id){
 const kind=prefix==='PROCEDURE'?'Issue #13 procedure':'Issue #2 job';
 return '- 2026-10-25T08:01:00Z | slot 2 | source #101 | nonce "a" | ['+kind+' #'+id+
   '](https://github.com/BestNameYet/IssueStack-/issues/'+(prefix==='PROCEDURE'?13:2)+
   '#issuecomment-'+id+') | receipt: '+prefix+':'+id;
}
test('procedure receipts follow successful transfers, never rejected overflow entries',async()=>{
 const f=makeLedger();
 await intake.appendLedger(f.github,owner,repo,receipt('TRANSFER',113),'TRANSFER:113');
 await intake.appendLedger(f.github,owner,repo,receipt('PROCEDURE',314),'PROCEDURE:314');
 await intake.appendLedger(f.github,owner,repo,'- Removed comment #12 | receipt: REJECT:12','REJECT:12');
 const body=f.docs.get(ledgerId).body;
 assert.ok(body.indexOf('PROCEDURE:314')>body.indexOf('## Verified transfers'));
 assert.ok(body.indexOf('PROCEDURE:314')<body.indexOf('## Rejected extra comments'));
 assert.ok(body.indexOf('REJECT:12')>body.indexOf('## Rejected extra comments'));
 assert.ok(body.indexOf('TRANSFER:113')<body.indexOf('## Rejected extra comments'));
});
test('ledger receipts deduplicate using complete IDs rather than substring matches',async()=>{
 const f=makeLedger();
 await intake.appendLedger(f.github,owner,repo,receipt('PROCEDURE',3145),'PROCEDURE:3145');
 await intake.appendLedger(f.github,owner,repo,receipt('PROCEDURE',314),'PROCEDURE:314');
 assert.equal(f.writes,2);
 await intake.appendLedger(f.github,owner,repo,receipt('PROCEDURE',314),'PROCEDURE:314');
 assert.equal(f.writes,2);
 const text=f.docs.get(ledgerId).body;
 assert.equal(text.split('\n').filter(x=>x.endsWith('PROCEDURE:314')).length,1);
});
test('unrecognized receipts are not categorized as rejected work',async()=>{
 const f=makeLedger();
 await assert.rejects(intake.appendLedger(f.github,owner,repo,'line | receipt: UNKNOWN:5','UNKNOWN:5'),/Unknown ledger receipt category/);
 assert.equal(f.writes,0);
});
const definition={schema:'issuestack.procedure.v1',nonce:'ledger-after-install-20261025',title:'Ledger sequence test',
 steps:[{id:'validate',instruction:'Return true when installation is verified',returns:{type:'boolean'}}]};
function makeIntake({failInstallationReadback=false}={}){
 const docs=new Map([
  [ledgerId,{id:ledgerId,body:intake.initialLedger(),user:{login:owner}}],
  [slotId,{id:slotId,body:JSON.stringify(definition),user:{login:owner}}]
 ]);
 const procedures=[];
 let nextId=900;
 const github={paginate:async(method,options)=>options.issue_number===13?procedures:[],
  rest:{issues:{
   listComments:()=>{},
   async createComment({issue_number,body}){
    assert.equal(issue_number,13);
    const item={id:nextId++,body,user:{login:'github-actions[bot]'}};
    procedures.push(item);docs.set(item.id,item);
    return {data:{...item}};
   },
   async getComment({comment_id}){
    if(failInstallationReadback&&procedures.some(p=>p.id===comment_id))throw Error('simulated installation readback failed');
    const item=docs.get(comment_id);if(!item)throw Error('missing '+comment_id);
    return {data:{...item}};
   },
   async updateComment({comment_id,body}){
    const item=docs.get(comment_id);if(!item)throw Error('missing '+comment_id);
    docs.set(comment_id,{...item,body});return {data:docs.get(comment_id)};
   }
  }}};
 const context={eventName:'issue_comment',payload:{action:'edited',issue:{number:1},comment:{id:slotId}},repo:{owner,repo}};
 return {github,context,docs,procedures,core:{info(){}}};
}
test('procedure installation/readback precede its verified ledger receipt and source reset',async()=>{
 const f=makeIntake();
 await intake.run(f);
 assert.equal(f.procedures.length,1);
 const procedure=f.procedures[0];
 assert.match(procedure.body,/ISSUESTACK_DECLARED_PROCEDURE/);
 const ledger=f.docs.get(ledgerId).body;
 assert.ok(ledger.includes('PROCEDURE:'+procedure.id));
 assert.ok(ledger.indexOf('PROCEDURE:'+procedure.id)<ledger.indexOf('## Rejected extra comments'));
 assert.equal(f.docs.get(slotId).body,intake.SLOT_PROMPT);
});
test('failed Issue 13 procedure readback leaves no ledger receipt and keeps input slot',async()=>{
 const f=makeIntake({failInstallationReadback:true});
 await assert.rejects(intake.run(f),/simulated installation readback failed/);
 assert.equal(f.procedures.length,1);
 assert.ok(!f.docs.get(ledgerId).body.includes('PROCEDURE:'));
 assert.equal(f.docs.get(slotId).body,JSON.stringify(definition));
});
