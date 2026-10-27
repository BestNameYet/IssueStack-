'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../src/semantic-operator-contract.js');
const root=api.load(),{contract,shots,schema}=root;
const time='2026-10-27T23:00:00Z';
function proposal(){
 return {schema:'issuestack.semantic-proposal.v1',command_id:'command:demo',chore_id:'SC05',chore_version:1,evidence_sha256:'a'.repeat(64),
  record_type:'relationship',record_id:'relationship:issue1:issue2',operation:'CREATE',atomic_claim:'Intake produces a validated queue job',
  payload:{subject:'issue:1',predicate:'transfers_validated_job_to',object:'issue:2',conditions:['typed validation'],evidence:['immutable code reference']},
  evidence:[{uri:'https://github.com/BestNameYet/IssueStack-/blob/0123456789012345678901234567890123456789/src/issue-1-intake.js',
    sha256:'b'.repeat(64),source_commit:'0123456789012345678901234567890123456789',observed_at:null,evidence_class:'verified_static',assertion_span:'specific validated call site'}],
  existing_record_ref:null,semantic_ruling:{inclusion_test:'Resolvable endpoints and code evidence',exclusion_test:'Not naming similarity',
    few_shot_refs:['relationship-positive','CREATE-positive'],reason:'Validation and target documented in source',alternatives:['documented relationship'],confidence:'high',uncertainties:[]},
  uncertainties:[],proposed_registry_page:'architecture',review_status:'pending_review'};
}
test('contract library is complete, bounded and versioned',()=>{
 assert.equal(contract.ontology.concepts.length,9);
 assert.equal(contract.operations.length,7);
 assert.equal(contract.chore_catalog.length,7);
 assert.equal(contract.lifecycle.state_machine.length,9);
 assert.equal(shots.concepts.flatMap(x=>x.examples).length,27);
 assert.equal(shots.operations.flatMap(x=>x.examples).length,21);
 assert.equal(shots.end_to_end.length,3);
 assert.equal(api.validateLibrary(contract,shots,schema),true);
});
test('definitions map to typed output schemas and each few-shot has full expected payload',()=>{
 for(const c of contract.ontology.concepts){
   const group=shots.concepts.find(x=>x.concept===c.id);
   assert.equal(group.examples.length,3);
   for(const e of group.examples){
    assert.deepEqual(Object.keys(e.expected.payload).sort(),[...c.required_payload_fields].sort());
    assert.ok(e.decision_boundary&&e.why&&e.expected.review_status);
   }
 }
});
test('valid semantic proposal references immutable proof and contrastive demonstrations',()=>{
 assert.equal(api.validateProposal(proposal(),root),true);
});
test('schema rejects unknown type, missing payload and fabricated evidence',()=>{
 const wrong=proposal();wrong.record_type='invented';assert.throws(()=>api.validateProposal(wrong,root),/Unknown/);
 const missing=proposal();delete missing.payload.conditions;assert.throws(()=>api.validateProposal(missing,root),/payload/);
 const fabricated=proposal();fabricated.evidence[0].sha256='short';assert.throws(()=>api.validateProposal(fabricated,root),/provenance/);
 const noProof=proposal();noProof.evidence=[];assert.throws(()=>api.validateProposal(noProof,root),/evidence/i);
});
test('a semantic operation cannot skip review or silently overwrite a prior claim',()=>{
 const proposed=proposal();proposed.review_status='review_not_required';
 assert.throws(()=>api.validateProposal(proposed,root),/review/);
 const revision=proposal();revision.operation='REVISE';
 assert.throws(()=>api.validateProposal(revision,root),/existing target/);
 revision.existing_record_ref='registry:relationship:issue1:issue2';
 assert.equal(api.validateProposal(revision,root),true);
});
test('novel information abstains rather than forcing ontology',()=>{
 const p=proposal();p.record_type='unclassified';p.operation='DEFER';p.review_status='deferred';p.evidence=[];p.payload={
  observed_dimensions:['unknown coordination mechanism'],
  missing_dimensions:['contract boundary is unclear'],
  candidate_definition:'Needs a coordination record type',
  schema_extension_rationale:'None of nine concepts fits without losing semantics',
  evidence_refs:['immutable://source']
 };
 assert.equal(api.validateProposal(p,root),true);
 p.operation='CREATE';assert.throws(()=>api.validateProposal(p,root),/Unclassified/);
});
test('no changed evidence yields a bounded no-op/exit checkpoint',()=>{
 const cp=api.planPostCommand({command_id:'job:A',primary_state:'succeeded',changed_evidence:[],now:time,contract});
 assert.equal(cp.remaining.length,0);
 assert.equal(cp.chores.length,7);
 assert.equal(cp.chores[0].status,'no_op');
 assert.equal(cp.chores[6].status,'completed');
 assert.equal(cp.status,'complete');
 assert.equal(api.validateCheckpoint(cp,{contract}),true);
});
test('changed evidence requires an operator and cannot hallucinate chore completion',()=>{
 const delta=[{uri:'immutable:one',sha256:'b'.repeat(64)}];
 const cp=api.planPostCommand({command_id:'job:A',job_id:'6452132288',primary_state:'succeeded',changed_evidence:delta,now:time,contract});
 assert.deepEqual(cp.remaining,['SC01','SC02','SC03','SC04','SC05','SC06']);
 assert.equal(cp.chores[0].status,'deferred');
 assert.equal(cp.chores[6].status,'completed');
 assert.equal(cp.status,'deferred');
});
test('completed identical chore idempotency keyed by evidence revision',()=>{
 const delta=[{sha:'a'}];
 const initial=api.planPostCommand({command_id:'job:X',primary_state:'blocked',changed_evidence:delta,now:time,contract});
 const priors=initial.chores.map(x=>({...x,status:'completed'}));
 const cp=api.planPostCommand({command_id:'job:X',primary_state:'blocked',changed_evidence:delta,prior:priors,now:time,contract});
 assert.ok(cp.chores.every(x=>x.status==='no_op'));
 assert.notEqual(api.keyOf('job:X','SC01',1,api.sha(JSON.stringify([{sha:'a'}]))),
 api.keyOf('job:X','SC01',1,api.sha(JSON.stringify([{sha:'b'}]))));
});
test('post-command gate cannot recursively trigger on internal tool calls or semantic chores',()=>{
 for(const variant of [{top_level:false},{within_semantic_chore:true}]){
   const cp=api.planPostCommand({command_id:'job:W',primary_state:'succeeded',changed_evidence:['new evidence'],now:time,contract,...variant});
   assert.equal(cp.budget.max_passes,0);
   assert.equal(cp.remaining.length,0);
   assert.ok(cp.chores.every(x=>x.status==='no_op'));
 }
});
test('budget and malformed checkpoint failures are explicit',()=>{
 const cp=api.planPostCommand({command_id:'job:W',primary_state:'failed',changed_evidence:Array.from({length:9},(_,i)=>i),now:time,contract});
 assert.equal(cp.status,'deferred');
 assert.match(cp.chores[0].reason,/budget/i);
 const invalid=JSON.parse(JSON.stringify(cp));invalid.budget.tool_calls=13;
 assert.throws(()=>api.validateCheckpoint(invalid,{contract}),/Budget/);
 const tampered=JSON.parse(JSON.stringify(cp));tampered.chores[0].idempotency_key='a'.repeat(64);
 assert.throws(()=>api.validateCheckpoint(tampered,{contract}),/key mismatch/);
});
test('broken definitions/fewshots fail closed',()=>{
 const changed=JSON.parse(JSON.stringify(shots));changed.concepts[0].examples.pop();
 assert.throws(()=>api.validateLibrary(contract,changed,schema),/three contrastive/);
 const missing=JSON.parse(JSON.stringify(schema));delete missing.$defs.payload_component;
 assert.throws(()=>api.validateLibrary(contract,shots,missing),/Payload contract/);
});
