'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const runtime=require('../issue-comment-runtime.js');
const {makeHarness,ROOT}=require('./fake-github.js');
const valid={issue_number:2,comment_id:111,text:'X',operation:'append'};
const path=ROOT+'/instructions/fixture.json';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');

test('four mandatory fields are accepted',()=>assert.equal(runtime.validateInstruction({...valid}).issue_number,2));
for(const bad of [
  null,undefined,[],{},'bad',4,{...valid,extra:true},
  {...valid,issue_number:0},{...valid,issue_number:-1},
  {...valid,issue_number:1.5},{...valid,issue_number:'2'},
  {...valid,issue_number:Number.MAX_SAFE_INTEGER+1},
  {...valid,comment_id:0},{...valid,comment_id:null},
  {...valid,comment_id:'111'},{...valid,comment_id:-5},
  {...valid,comment_id:1.2},{...valid,comment_id:Number.MAX_SAFE_INTEGER+1},
  {...valid,text:''},{...valid,text:null},{...valid,text:15},
  {...valid,operation:'insert'},{...valid,operation:'APPEND'},
  {...valid,operation:null},
  {issue_number:2,comment_id:111,operation:'append'}
]){
  test('reject malformed instruction '+JSON.stringify(bad),()=>{
    assert.throws(()=>runtime.validateInstruction(bad));
  });
}
test('new is an allowed comment ID',()=>{
  assert.equal(runtime.validateInstruction({...valid,comment_id:'new'}).comment_id,'new');
});
for(const op of ['prepend','replace','append']){
  test('existing comment '+op+' preserves byte-exact text',()=>{
    const expected=op==='prepend'?'Xold':op==='replace'?'X':'oldX';
    assert.equal(runtime.composeBody('old',{...valid,operation:op}),expected);
    const input='Δ\n🙂\r\n \t';
    const baseline='\n🍎before\n';
    const actual=runtime.composeBody(baseline,{...valid,operation:op,text:input});
    assert.equal(actual,op==='prepend'?input+baseline:op==='replace'?input:baseline+input);
  });
  test('new comment '+op+' uses exact text',()=>{
    assert.equal(runtime.composeBody('old',{...valid,comment_id:'new',operation:op,text:'A\nB'}),'A\nB');
  });
}
for(const good of [
  ROOT+'/instructions/a.json',
  ROOT+'/instructions/With-01_thing.json',
  ROOT+'/instructions/test.fixture.json'
])test('accept direct instruction path '+good,()=>assert.equal(runtime.validatePath(good),good));
for(const bad of [
  ROOT+'/schema/comment-write.schema.json',ROOT+'/tests/a.json',
  ROOT+'/instructions/../a.json',ROOT+'/instructions/nested/a.json',
  ROOT+'/instructions/evil.json/other',ROOT+'/instructions/x.yml',
  '/tmp/instructions/a.json','',null,
  ROOT+'/instructions/a.json\nanother'
])test('reject invalid path '+bad,()=>assert.throws(()=>runtime.validatePath(bad)));

test('dispatch enumerates exact requested path',async()=>{
  const h=makeHarness({eventName:'workflow_dispatch'});
  assert.deepEqual(await runtime.enumerate(h),[h.instructionFile]);
});
test('push enumerates changed eligible files in sorted order, ignoring unrelated files',async()=>{
  const a=ROOT+'/instructions/a.json',b=ROOT+'/instructions/b.json';
  const h=makeHarness({changedFiles:[
    {filename:b,status:'modified'},{filename:a,status:'added'},
    {filename:b,status:'modified'},{filename:ROOT+'/README.md',status:'modified'},
    {filename:ROOT+'/instructions/c.json',status:'removed'},
    {filename:ROOT+'/instructions/folder/d.json',status:'modified'}
  ]});
  await assert.rejects(()=>runtime.enumerate(h),/directly under/);
  h.github.rest.repos.compareCommits=async()=>({data:{files:[
    {filename:b,status:'modified'},{filename:a,status:'added'},
    {filename:b,status:'modified'},{filename:ROOT+'/README.md',status:'modified'},
    {filename:ROOT+'/instructions/c.json',status:'removed'}
  ]}});
  assert.deepEqual(await runtime.enumerate(h),[a,b]);
});
for(const modify of [
  h=>h.context.actor='stranger',
  h=>h.context.repo.owner='wrong',
  h=>h.context.ref='refs/heads/feature',
  h=>h.context.payload.before='0'.repeat(40),
  h=>h.context.eventName='pull_request'
])test('enumeration rejects invalid origin or trigger',async()=>{
  const h=makeHarness();modify(h);
  await assert.rejects(()=>runtime.enumerate(h));
});
test('enumeration rejects truncated comparison',async()=>{
  const h=makeHarness({changedFiles:Array.from({length:300},(_,i)=>({
    filename:ROOT+'/instructions/'+i+'.json',status:'modified'
  }))});
  await assert.rejects(()=>runtime.enumerate(h),/truncated/);
});

const routes=[
  [1,['created','edited']],
  [2,['created','edited']],
  [5,['created','edited']],
  [7,['created','edited']],
  [8,['edited']],
  [13,['edited']],
  [30,['created']]
];
for(const [issue,actions] of routes){
  for(const action of actions){
    test('virtualize Issue #'+issue+' '+action+' event with original context getters',()=>{
      const initial=makeHarness();
      const ctx=Object.create({get repo(){return initial.context.repo;},
        get eventName(){return 'workflow_call';},get ref(){return 'refs/heads/main';},
        get sha(){return 'c'.repeat(40);}});
      ctx.actor='BestNameYet';ctx.payload={inputs:{comment_event:'other'}};
      const event={issue_number:issue,comment_id:99,action,body:'after',
        previous_body:action==='edited'?'before':null};
      const routed=runtime.adaptContext(ctx,JSON.stringify(event),{issues:[issue],actions});
      assert.deepEqual(routed.repo,{owner:'BestNameYet',repo:'IssueStack-'});
      assert.equal(routed.eventName,'issue_comment');
      assert.equal(routed.payload.issue.number,issue);
      assert.equal(routed.payload.comment.body,'after');
      assert.equal(routed.payload.comment.id,99);
      assert.equal(routed.actor,'BestNameYet');
      assert.equal(routed.sha,'c'.repeat(40));
      assert.equal(routed.payload.changes?.body?.from,action==='edited'?'before':undefined);
    });
  }
}
test('native GitHub event context is unchanged when no virtual input is supplied',()=>{
  const h=makeHarness();
  assert.equal(runtime.adaptContext(h.context,'',{issues:[1],actions:['edited']}),h.context);
});
for(const event of [
  {issue_number:7,comment_id:9,action:'deleted',body:'x'},
  {issue_number:7,comment_id:9,action:'edited',body:'x'},
  {issue_number:7,comment_id:9,action:'edited',body:'x',previous_body:42},
  {issue_number:7,comment_id:9,action:'created',body:null},
  {issue_number:8,comment_id:9,action:'created',body:'x'},
  {issue_number:7,comment_id:0,action:'created',body:'x'},
  {issue_number:7,comment_id:9.2,action:'created',body:'x'},
  {issue_number:9,comment_id:9,action:'created',body:'x'}
])test('virtual event rejects invalid action, identity or history '+JSON.stringify(event),()=>{
  const h=makeHarness();
  assert.throws(()=>runtime.adaptContext(h.context,JSON.stringify(event),{
    issues:[7],actions:['created','edited']
  }));
});
test('virtual event rejects malformed JSON or unauthorized actor',()=>{
  const h=makeHarness({actor:'guest'});
  assert.throws(()=>runtime.adaptContext(h.context,'{"bad"',{issues:[2],actions:['edited']}));
  const ev={issue_number:2,comment_id:12,action:'edited',body:'a',previous_body:'b'};
  assert.throws(()=>runtime.adaptContext(h.context,JSON.stringify(ev),{issues:[2],actions:['edited']}),/owner/);
});

test('edit: writer, hashes, receipt and output are all consistent',async()=>{
  const h=makeHarness({instruction:{issue_number:2,comment_id:111,text:'!',operation:'append'}});
  const result=await runtime.writeInstruction({...h,instructionFile:path});
  assert.equal(h.comments.get(111).body,'original!');
  assert.equal(result.event.action,'edited');
  assert.equal(result.event.previous_body,'original');
  assert.equal(h.outputs.issue_number,'2');
  assert.equal(h.outputs.comment_id,'111');
  assert.equal(h.outputs.applied,'true');
  assert.equal(h.receipts().length,1);
  assert.equal(h.receipts()[0].record.status,'completed');
  assert.equal(h.receipts()[0].record.old_body_sha256,digest('original'));
  assert.equal(h.receipts()[0].record.completed_body_sha256,digest('original!'));
  const metadata=JSON.parse(h.files.get('config/file-metadata.json').body);
  assert.ok(metadata.files.some(x=>x.path===h.receipts()[0].path));
  assert.ok(metadata.files.some(x=>x.sha256===digest(h.files.get(h.receipts()[0].path).body)));
  const writes=h.calls.filter(x=>x[0]==='putFile');
  assert.equal(writes.filter(x=>x[1]===h.receipts()[0].path).length,2);
});
for(const op of ['prepend','replace','append']){
  test('writer existing comment '+op,async()=>{
    const h=makeHarness({instruction:{...valid,operation:op}});
    await runtime.writeInstruction({...h,instructionFile:path});
    assert.equal(h.comments.get(111).body,
      op==='prepend'?'Xoriginal':op==='replace'?'X':'originalX');
  });
  test('writer new comment '+op,async()=>{
    const h=makeHarness({instruction:{...valid,comment_id:'new',operation:op}});
    const r=await runtime.writeInstruction({...h,instructionFile:path});
    assert.equal(r.event.action,'created');
    assert.equal(r.event.previous_body,null);
    assert.equal(h.comments.get(r.event.comment_id).body,'X');
    assert.equal(h.receipts()[0].record.requested_comment_id,'new');
  });
}
test('completed receipt prevents duplicate append on rerun',async()=>{
  const h=makeHarness({instruction:{...valid,operation:'append'}});
  await runtime.writeInstruction({...h,instructionFile:path});
  const before=h.calls.filter(x=>x[0]==='updateComment').length;
  const result=await runtime.writeInstruction({...h,instructionFile:path});
  assert.equal(result.skipped,true);
  assert.equal(h.outputs.applied,'false');
  assert.equal(h.comments.get(111).body,'originalX');
  assert.equal(h.calls.filter(x=>x[0]==='updateComment').length,before);
});
test('invalid target issue/comment pairing blocks all writes',async()=>{
  const h=makeHarness({commentIssue:5});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/does not belong/);
  assert.equal(h.receipts().length,0);
  assert.ok(!h.calls.some(x=>x[0]==='updateComment'));
});
test('pull requests may not be targeted',async()=>{
  const h=makeHarness({isPullRequest:true});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/not a pull request/);
  assert.equal(h.receipts().length,0);
});
test('unauthorized actor must not mutate anything',async()=>{
  const h=makeHarness({actor:'guest'});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/owner/);
  assert.ok(!h.calls.some(x=>x[0]==='putFile'||x[0]==='updateComment'));
});
test('invalid JSON instruction must not mutate anything',async()=>{
  const h=makeHarness();h.setFile(path,'not-json');
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}));
  assert.equal(h.receipts().length,0);
});
test('concurrent comment edit aborts with pending receipt rather than overwriting',async()=>{
  const h=makeHarness({mutateBeforePrewriteCheck:true});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/changed/);
  assert.equal(h.receipts()[0].record.status,'pending');
  assert.equal(h.comments.get(111).body,'original-concurrent');
  assert.ok(!h.calls.some(x=>x[0]==='updateComment'));
});
test('failed comment mutation remains pending and cannot replay automatically',async()=>{
  const h=makeHarness({failAt:'updateComment'});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/Injected failure/);
  assert.equal(h.receipts()[0].record.status,'pending');
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/pending/);
});
test('readback mismatch aborts completed receipt publication',async()=>{
  const h=makeHarness({corruptReadback:true});
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/readback|verification/);
  assert.equal(h.receipts()[0].record.status,'pending');
});
test('receipt publication failure stops before comment write',async()=>{
  const h=makeHarness();
  const original=h.github.rest.repos.createOrUpdateFileContents;
  h.github.rest.repos.createOrUpdateFileContents=async params=>{
    if(params.path.startsWith(ROOT+'/receipts/'))throw Error('storage failure');
    return original(params);
  };
  await assert.rejects(()=>runtime.writeInstruction({...h,instructionFile:path}),/storage failure/);
  assert.equal(h.comments.get(111).body,'original');
});

test('all Issue × comment-mode × operation permutations behave deterministically in isolation',async()=>{
  const matrix=require('./coverage-matrix.json');
  let checked=0;
  for(const route of matrix.cases){
    for(const op of matrix.instructions.operations){
      for(const mode of matrix.instructions.comment_id_modes){
        const id=mode==='new'?'new':111;
        const instruction={issue_number:route.issue_number,comment_id:id,text:'Δ\n',operation:op};
        const h=makeHarness({issueNumber:route.issue_number,instruction});
        const result=await runtime.writeInstruction({...h,instructionFile:path});
        assert.equal(result.event.issue_number,route.issue_number);
        const isCreated=mode==='new';
        assert.equal(result.event.action,isCreated?'created':'edited');
        assert.equal(h.receipts()[0].record.status,'completed');
        const expected=isCreated?'Δ\n':op==='prepend'?'Δ\noriginal':
          op==='replace'?'Δ\n':'originalΔ\n';
        assert.equal(h.comments.get(result.event.comment_id).body,expected);
        assert.equal(h.outputs.applied,'true');
        checked++;
      }
    }
  }
  assert.equal(checked,42);
});
test('zero Issue IDs cannot be virtualized',()=>{
  const h=makeHarness();
  const data={issue_number:0,comment_id:12,action:'created',body:'x'};
  assert.throws(()=>runtime.adaptContext(h.context,JSON.stringify(data),
    {issues:[0],actions:['created']}));
});
