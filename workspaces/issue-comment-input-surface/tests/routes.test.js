'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../../..');
const project=path.resolve(__dirname,'..');
const matrix=require('./coverage-matrix.json');
const dispatch=read('.github/workflows/issue-comment-write-and-dispatch.yml');
const entry=read('.github/workflows/issue-comment-input.yml');
const runtime=read('workspaces/issue-comment-input-surface/issue-comment-runtime.js');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function jobBlock(name) {
  const lines=dispatch.split(/\r?\n/);
  const start=lines.findIndex(l=>l==='  '+name+':');
  if(start<0)return null;
  let end=start+1;
  while(end<lines.length && !/^  [A-Za-z0-9_-]+:\s*$/.test(lines[end]))end++;
  return lines.slice(start,end).join('\n');
}
const issueToken=n=>"needs.write.outputs.issue_number == '"+n+"'";
const expectedWorkflowFiles=new Set(matrix.cases.map(x=>x.workflow));
const expectedIssueNumbers=[...new Set(matrix.cases.map(x=>x.issue_number))].sort((a,b)=>a-b);

test('matrix enumerates all seven actual Issue numbers',()=>{
  assert.deepEqual(expectedIssueNumbers,[1,2,5,7,8,13,30]);
  assert.equal(matrix.cases.length,7);
  assert.equal(new Set(matrix.cases.map(x=>x.issue_number)).size,7);
});
test('writer must publish exact event and action outputs',()=>{
  for(const field of ['applied','issue_number','comment_id','action','event','export_marker']){
    assert.match(runtime,new RegExp("core\\.setOutput\\('"+field+"'"));
    assert.match(dispatch,new RegExp("steps\\.writer\\.outputs\\."+field));
  }
  assert.match(dispatch,/^\s*needs: write\s*$/m);
  assert.match(dispatch,/^\s*comment_event: \$\{\{ needs\.write\.outputs\.event \}\}/m);
});
test('entry workflow reads only directly scoped instruction JSON changes',()=>{
  assert.match(entry,/workspaces\/issue-comment-input-surface\/instructions\/\*\.json/);
  assert.match(entry,/github\.actor == github\.repository_owner/);
  assert.match(entry,/max-parallel: 1/);
  assert.match(entry,/cancel-in-progress: false/);
  assert.match(entry,/workflow_dispatch:/);
  assert.match(entry,/uses: \.\/\.github\/workflows\/issue-comment-write-and-dispatch\.yml/);
});
test('workflow-call writer is owner-gated and uses the scoped input file',()=>{
  assert.match(dispatch,/github\.actor == github\.repository_owner/);
  assert.match(dispatch,/workflow_call:/);
  assert.match(dispatch,/INPUT_INSTRUCTION_FILE/);
  assert.match(dispatch,/runtime\.writeInstruction/);
});
for(const entry of matrix.cases){
  test('Issue #'+entry.issue_number+': required route and callable workflow exist',()=>{
    const block=jobBlock(entry.job);
    assert.ok(block,'MISSING ROUTE: '+entry.job+' for Issue #'+entry.issue_number);
    assert.ok(block.includes('uses: ./.github/workflows/'+entry.workflow));
    assert.ok(block.includes(issueToken(entry.issue_number)),
      'Missing Issue #'+entry.issue_number+' guard');
    assert.match(block,/needs\.write\.outputs\.applied == 'true'/);
    if(entry.actions.length===1)
      assert.ok(block.includes("needs.write.outputs.action == '"+entry.actions[0]+"'"),
        'Missing action filter for Issue #'+entry.issue_number);
    if(entry.comment_id)
      assert.ok(block.includes("needs.write.outputs.comment_id == '"+entry.comment_id+"'"),
        'Missing pinned registry comment ID');
    if(entry.required_text_marker)
      assert.match(block,/needs\.write\.outputs\.export_marker == 'true'/);
    const wf=read('.github/workflows/'+entry.workflow);
    assert.match(wf,/\n  workflow_call:/,
      'Secondary workflow must declare workflow_call: '+entry.workflow);
    assert.match(wf,/\n      comment_event:\s*\n/);
    assert.match(wf,/COMMENT_EVENT: \$\{\{ inputs\.comment_event \}\}/);
    assert.match(wf,/adaptContext\(context, process\.env\.COMMENT_EVENT/);
    assert.match(wf,/  issue_comment:\s*\n/,'Native event trigger must be preserved');
    for(const action of entry.actions)assert.ok(
      wf.includes('types: ['+entry.actions.join(', ')+']') ||
      wf.includes('types: ['+entry.actions.join(',')+']') ||
      wf.includes("actions:['"+entry.actions.join("','")+"']"),
      'Cannot verify action '+action+' for '+entry.workflow);
  });
}
test('two consumers for Issue #5 and #7 share only one destination job',()=>{
  assert.equal(matrix.cases.filter(c=>c.workflow==='issue5-projection.yml').length,2);
  assert.equal((dispatch.match(/^  issue-5-projection:$/gm)||[]).length,1);
  const b=jobBlock('issue-5-projection');
  assert.ok(b.includes(issueToken(5))&&b.includes(issueToken(7)));
});
test('special issue filters may not be silently removed',()=>{
  const b13=jobBlock('issue-13-procedures');
  const b30=jobBlock('issue-30-export');
  assert.ok(b13&&b13.includes("'edited'"));
  assert.ok(b30&&b30.includes("'created'")&&b30.includes('export_marker'));
  const registry=jobBlock('issue-8-registry');
  assert.ok(registry&&registry.includes('6453773625'),
    'Issue #8 registry route missing; full coverage is BLOCKED');
});
test('no unexpected issue-specific route jobs exist',()=>{
  const jobs=[...dispatch.matchAll(/^  (issue-[A-Za-z0-9_-]+):$/gm)]
    .map(match=>match[1]);
  const expected=[...new Set(matrix.cases.map(x=>x.job))];
  assert.deepEqual(jobs.sort(),expected.sort());
});
test('comment writer refuses to directly execute Issue functions',()=>{
  assert.ok(!runtime.includes("require('./src/issue-1-intake.js')"));
  assert.ok(!runtime.includes('actions.createWorkflowDispatch'));
});
test('negative-route exclusions are declared in versioned matrix',()=>{
  const actual=new Set(matrix.negative_route_cases.map(x=>x.issue_number+':'+x.action));
  for(const name of ['13:created','30:edited','30:created','8:created','8:edited'])
    assert.ok(actual.has(name),'Missing negative case '+name);
});
test('schema aligns with the four-field runtime contract',()=>{
  const schema=require('../schema/comment-write.schema.json');
  assert.equal(schema.additionalProperties,false);
  assert.deepEqual(schema.required.slice().sort(),['comment_id','issue_number','operation','text']);
  assert.deepEqual(schema.properties.operation.enum.slice().sort(),['append','prepend','replace']);
  assert.equal(schema.properties.text.minLength,1);
  assert.equal(schema.properties.issue_number.minimum,1);
  assert.equal(schema.properties.comment_id.oneOf[1].const,'new');
});
test('every declared route has an action and a documented fixture policy',()=>{
  for(const c of matrix.cases){
    assert.ok(c.actions.length>0);
    assert.ok(c.fixture.length>0);
    assert.ok(c.allowed_targets.length>0);
  }
});
