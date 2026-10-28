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
 const status=intake.parseProgress(f.docs.get(slotId).body);
 assert.equal(status.phase,'succeeded');
 assert.equal(status.source,JSON.stringify(definition));
 assert.ok(status.events.some(s=>s.includes('Issue #13 procedure found at commentID')));
 assert.ok(status.events.some(s=>s.includes('PROCEDURE:'+procedure.id)));
});
test('failed Issue 13 procedure readback leaves no ledger receipt and keeps input slot',async()=>{
 const f=makeIntake({failInstallationReadback:true});
 await assert.rejects(intake.run(f),/simulated installation readback failed/);
 assert.equal(f.procedures.length,1);
 assert.ok(!f.docs.get(ledgerId).body.includes('PROCEDURE:'));
 const state=intake.parseProgress(f.docs.get(slotId).body);
 assert.equal(state.phase,'failed');
 assert.equal(state.source,JSON.stringify(definition));
 assert.equal(state.stage,'issue13_create_verify');
});

// Guard template discovery against unrelated JSON in the Issue #1 body.
const typeValidator = require('./record-type-validator.js');
const canonicalTemplate = {
  "schema[string]": "issuestack.task.v3",
  "nonce[string]": "<unique-nonce>",
  "ordinal[number|null]": null,
  "source[object<Source>]": {
    "issue[number]": 1,
    "comment_id[number|null]": null
  },
  "interpretation[object<Interpretation>]": {
    "revised_instruction[string]": "<clear faithful rewritten instruction>",
    "user_intent[object<UserIntent>]": {
      "goal[string]": "<goal>",
      "expected_outcome[string]": "<outcome>",
      "requested_abstraction_level[string]": "<level>",
      "requested_action_scope[string]": "<scope>"
    }
  },
  "requirements[array<Requirement>]": [],
  "constraints[array<Constraint>]": [],
  "decomposition[array<WorkItem>]": [],
  "planning[object<Planning>]": {
    "status[string]": "not_started",
    "method[string]": "Break user requirements into verifiable work items with explicit dependencies and expected output.",
    "sources[array<ResearchSource>]": []
  },
  "execution[object<Execution>]": {
    "status[string]": "pending",
    "enqueued_at[string|null]": null,
    "started_at[string|null]": null,
    "finished_at[string|null]": null,
    "worker[string|null]": null
  },
  "completion[object<Completion>]": {
    "by_requirement[array<RequirementCompletion>]": [],
    "remaining_requirement_ids[array<Reference>]": [],
    "success[boolean|null]": null,
    "summary[string|null]": null,
    "artifacts[array<Artifact>]": [],
    "validation[array<ValidationCheck>]": [],
    "errors[array<ErrorEntry>]": [],
    "receipt[object<Receipt>|null]": null
  },
  "unrequested_changes[object<DeviationAudit>]": {
    "additions_outside_requirements[array<Deviation>]": [],
    "revisions_outside_requirements[array<Deviation>]": [],
    "additional_constraints[array<Deviation>]": [],
    "scope_reductions[array<Deviation>]": [],
    "abstraction_level_changes[array<Deviation>]": [],
    "abstraction_mismatches[array<Deviation>]": [],
    "action_scope_minimizations[array<Deviation>]": []
  }
};
const asJsonFence = value => String.fromCharCode(96).repeat(3) + 'json\n' +
  JSON.stringify(value, null, 2) + '\n' + String.fromCharCode(96).repeat(3);
test('task.v3 template is selected when unrelated UI JSON appears first', () => {
  const body = '# UI metadata\n' + asJsonFence({date:'2026-10-26',time:'11:00'}) +
    '\n## Current record template\n' + asJsonFence(canonicalTemplate);
  const found = typeValidator.readDefinition(body);
  assert.deepEqual(found.template, canonicalTemplate);
  assert.ok(found.registry.Requirement);
});
test('canonical first task template remains compatible with subsequent UI JSON', () => {
  const body = '## Current record template\n' + asJsonFence(canonicalTemplate) +
    '\n# UI examples\n' + asJsonFence({schema:'issuestack.issue5.agent-response.v1',role:'agent'});
  assert.equal(typeValidator.readDefinition(body).template['schema[string]'], 'issuestack.task.v3');
});
test('unrelated malformed JSON code fences do not prevent task template discovery', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const body = fence + 'json\n{ definitely not JSON }\n' + fence + '\n' + asJsonFence(canonicalTemplate);
  assert.equal(typeValidator.readDefinition(body).template['schema[string]'], 'issuestack.task.v3');
});
test('missing or duplicate task templates fail closed', () => {
  assert.throws(() => typeValidator.readDefinition(asJsonFence({date:'2026-10-26'})), /no versioned JSON task record template/);
  assert.throws(() => typeValidator.readDefinition(asJsonFence(canonicalTemplate) + '\n' + asJsonFence(canonicalTemplate)), /multiple task record templates/);
});


// Progress status lifecycle and serialized-intake / detached-cleanup regression.
const scratchpads=require('./issue-3-scratchpads.js');
function makeTaskIntake({payload,failCreateIssue3=false}={}){
  const nonce='test-status-flow-20261028';
  const rec=structuredClone(canonicalTemplate);
  rec['nonce[string]']=nonce;
  rec['interpretation[object<Interpretation>]']={
    'revised_instruction[string]':'Diagnose a test intake transaction',
    'user_intent[object<UserIntent>]':{
      'goal[string]':'Test running status',
      'expected_outcome[string]':'Verified progress events',
      'requested_abstraction_level[string]':'Code behavior',
      'requested_action_scope[string]':'Local fake GitHub API'
    }
  };
  rec['requirements[array<Requirement>]']=[{
    'id[string]':'R1','description[string]':'Verify progress tracking',
    'acceptance_criteria[array<AcceptanceCriterion>]':[{'text[string]':'Readback confirms each milestone'}]
  }];
  rec['completion[object<Completion>]']['remaining_requirement_ids[array<Reference>]']=[{'id[string]':'R1'}];
  const original=payload??JSON.stringify(rec,null,2);
  const sourceIssue='## Current record template\n'+asJsonFence(canonicalTemplate);
  const docs=new Map([
    [ledgerId,{id:ledgerId,body:intake.initialLedger(),user:{login:owner}}],
    [slotId,{id:slotId,body:original,user:{login:owner}}],
    [scratchpads.INDEX_ID,{id:scratchpads.INDEX_ID,body:scratchpads.initialIndex()}]
  ]);
  const lists={2:[],3:[]};
  let next=8000;
  const github={
    async paginate(method,options){return [...(lists[options.issue_number]||[])];},
    rest:{issues:{
      listComments:()=>{},
      async get({issue_number}){assert.equal(issue_number,1);return {data:{body:sourceIssue}};},
      async getComment({comment_id}){
        const x=docs.get(comment_id);if(!x)throw Error('missing comment '+comment_id);
        return {data:{...x}};
      },
      async updateComment({comment_id,body}){
        const x=docs.get(comment_id);if(!x)throw Error('missing comment '+comment_id);
        const n={...x,body};docs.set(comment_id,n);return {data:{...n}};
      },
      async createComment({issue_number,body}){
        if(issue_number===3&&failCreateIssue3)throw Object.assign(Error('simulated private API failure'),{status:503});
        const x={id:next++,body,user:{login:'github-actions[bot]'}};
        lists[issue_number].push(x);docs.set(x.id,x);return {data:{...x}};
      }
    }}
  };
  const failures=[];
  const context={runId:12345,eventName:'issue_comment',payload:{
    action:'edited',issue:{number:1},comment:{id:slotId}},repo:{owner,repo}};
  const core={info(){},warning(){},error(){},setFailed(v){failures.push(v)}};
  return {github,context,core,docs,lists,failures,original};
}
test('task intake displays running, issue2, issue3, ledger, terminal sequence with source intact',async()=>{
  const f=makeTaskIntake();
  await intake.run(f);
  const visible=f.docs.get(slotId).body;
  const state=intake.parseProgress(visible);
  assert.equal(state.phase,'succeeded');
  assert.equal(state.source,f.original);
  assert.match(visible,/## IssueStack intake — workflow completed/);
  assert.equal(f.lists[2].length,1);
  assert.equal(f.lists[3].length,1);
  assert.ok(state.events[0].includes('Workflow running'));
  assert.ok(state.events[1].includes('commentID [8000]'));
  assert.ok(state.events[2].includes('commentID [8001]'));
  assert.ok(state.events[3].includes('TRANSFER:8000'));
  assert.ok(f.docs.get(ledgerId).body.includes('TRANSFER:8000'));
  assert.ok(f.docs.get(scratchpads.INDEX_ID).body.includes('ISSUESTACK_MAP:8000:8001:active'));
});
test('five-minute reset refuses early cleanup and clears exact terminal source after retention',async()=>{
  const f=makeTaskIntake();
  await intake.run(f);
  await intake.cleanup(f);
  assert.ok(intake.parseProgress(f.docs.get(slotId).body),'early reset forbidden');
  const state=intake.parseProgress(f.docs.get(slotId).body);
  state.finished_at=new Date(Date.now()-301000).toISOString();
  f.docs.get(slotId).body=intake.renderProgress(state);
  await intake.cleanup(f);
  assert.equal(f.docs.get(slotId).body,intake.SLOT_PROMPT);
});
test('stale cleanup cannot replace user-edited newer entry',async()=>{
  const f=makeTaskIntake();
  await intake.run(f);
  f.docs.get(slotId).body='{"new":"submission"}';
  await intake.cleanup(f);
  assert.equal(f.docs.get(slotId).body,'{"new":"submission"}');
});
test('validation failures remain visible with run link and original text',async()=>{
  const f=makeTaskIntake({payload:'{ broken JSON'});
  await intake.run(f);
  const state=intake.parseProgress(f.docs.get(slotId).body);
  assert.equal(state.phase,'failed');
  assert.equal(state.source,f.original);
  assert.ok(state.events.join('\n').includes('Invalid JSON'));
  assert.ok(state.events.join('\n').includes('/actions/runs/12345'));
  assert.equal(f.lists[2].length,0);
  assert.equal(f.failures.length,1);
});
test('downstream issue3 failure produces stage-specific error and leaves recoverable queue',async()=>{
  const f=makeTaskIntake({failCreateIssue3:true});
  await assert.rejects(intake.run(f),/simulated private API failure/);
  const state=intake.parseProgress(f.docs.get(slotId).body);
  assert.equal(state.phase,'failed');
  assert.equal(state.stage,'issue3_create_verify');
  assert.ok(state.events.some(x=>x.includes('HTTP 503')));
  assert.equal(f.lists[2].length,1);
  assert.equal(f.lists[3].length,0);
  assert.ok(!f.docs.get(ledgerId).body.includes('TRANSFER:8000'));
});
test('orphaned workflow can report interruption without inserting a fake transfer',async()=>{
  const f=makeTaskIntake();
  const original=f.docs.get(slotId).body;
  const state={version:1,run_id:f.context.runId,run_url:'https://github.com/BestNameYet/IssueStack-/actions/runs/12345',
    slot_id:slotId,source:original,phase:'running',stage:'queue',events:['Workflow running'],finished_at:null};
  f.docs.get(slotId).body=intake.renderProgress(state);
  await intake.finishOrphan(f);
  const final=intake.parseProgress(f.docs.get(slotId).body);
  assert.equal(final.phase,'failed');
  assert.equal(final.stage,'interrupted');
  assert.ok(final.events.join('\n').includes('terminated before completion'));
  assert.ok(!f.docs.get(ledgerId).body.includes('TRANSFER:'));
});
