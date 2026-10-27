'use strict';
// Semantic judgment belongs to the active operator, not this deterministic validator.
// No network calls or GitHub writes occur here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const eq=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
function exact(x,fields,label){if(!obj(x)||!eq(Object.keys(x),fields))throw Error('Invalid '+label+' fields');}
function string(s,label){if(typeof s!=='string'||!s.trim())throw Error('Invalid '+label);}
function arr(a,label){if(!Array.isArray(a)||a.some(s=>typeof s!=='string'))throw Error('Invalid '+label);}
const SHA=/^[0-9a-f]{64}$/,SHA40=/^[0-9a-f]{40}$/;
const OPS=['CREATE','AUGMENT','REVISE','SUPERSEDE','CONFLICT','NO_OP','DEFER'];
const STATES=['completed','no_op','deferred','blocked'];
const PROP=['schema','command_id','chore_id','chore_version','evidence_sha256','record_type','record_id','operation','atomic_claim','payload','evidence','existing_record_ref','semantic_ruling','uncertainties','proposed_registry_page','review_status'];
const CH=['chore_id','chore_version','evidence_sha256','idempotency_key','status','proposal_refs','reason','next_action'];
const CP=['schema','command_id','job_id','catalog_version','evaluated_at','budget','chores','remaining','status'];
const EV=['uri','sha256','source_commit','observed_at','evidence_class','assertion_span'];
const RULING=['inclusion_test','exclusion_test','few_shot_refs','reason','alternatives','confidence','uncertainties'];
function load(root=path.resolve(__dirname,'..')){
 const contract=JSON.parse(fs.readFileSync(path.join(root,'config/semantic-operator-contract.v1.json'),'utf8'));
 const shots=JSON.parse(fs.readFileSync(path.join(root,'config/semantic-operator-fewshots.v1.json'),'utf8'));
 const schema=JSON.parse(fs.readFileSync(path.join(root,'src/types/semantic-operator.v1.json'),'utf8'));
 validateLibrary(contract,shots,schema);
 return {contract,shots,schema};
}
function validateLibrary(c,s,schema){
 if(c?.schema!=='issuestack.semantic-operator.contract.v1'||c.version!==1||
 s?.schema!=='issuestack.semantic-operator.fewshots.v1'||s.version!==1)throw Error('Unsupported contract/examples versions');
 if(!schema?.$defs?.semantic_proposal||!schema?.$defs?.checkpoint)throw Error('Missing output schemas');
 if(c.lifecycle?.state_machine?.length!==9||c.lifecycle.state_machine.some((x,i)=>x.id!=='P'+i||!x.decision||!x.on_no))throw Error('Incomplete procedure');
 if(c.budgets?.max_chore_passes_per_command!==1||c.budgets?.stop_on_new_primary_command!==true||
 c.budgets?.max_evidence_units<1||c.budgets?.max_evidence_units>32||
 c.budgets?.max_tool_calls<1||c.budgets?.max_tool_calls>40||
 c.budgets?.max_proposals<1||c.budgets?.max_proposals>30||
 c.idempotency?.no_chore_recursion!==true)throw Error('Unsafe/unbounded budget');
 if(!Array.isArray(c.ontology?.concepts)||c.ontology.concepts.length!==9)throw Error('Missing ontology');
 const ids=new Set();
 for(const concept of c.ontology.concepts){string(concept.id,'concept');if(ids.has(concept.id))throw Error('Duplicate concept');ids.add(concept.id);
  for(const field of ['definition','inclusion','exclusion'])string(concept[field],field);
  const payload=schema.$defs['payload_'+concept.id];if(!payload||!eq(payload.required,concept.required_payload_fields))throw Error('Payload contract mismatch '+concept.id);
 }
 if(!Array.isArray(c.operations)||!eq(c.operations.map(x=>x.id),OPS))throw Error('Incomplete operation set');
 for(const op of c.operations)for(const f of ['definition','precondition','forbidden_when'])string(op[f],op.id+' '+f);
 if(c.chore_catalog?.length!==7||c.chore_catalog.some((x,i)=>x.id!=='SC0'+(i+1)||x.version!==1||!x.procedure||!x.acceptance))throw Error('Invalid chore ordering');
 for(const [kind,entries,set]of [['concept',s.concepts,ids],['operation',s.operations,new Set(OPS)]]){
  if(!Array.isArray(entries)||entries.length!==set.size)throw Error('Missing '+kind+' examples');
  const found=new Set();
  for(const item of entries){const id=item.concept||item.operation;if(!set.has(id)||found.has(id))throw Error('Unknown or duplicated '+kind+' example');found.add(id);
   if(item.examples?.length!==3||!eq(item.examples.map(e=>e.kind),['positive','boundary','negative']))throw Error('Must have three contrastive examples '+id);
   for(const e of item.examples){string(e.input,'example input');string(e.why,'example reason');
    if(e.fixture_provenance!=='synthetic_training_demonstration_not_empirical_issue_stack_evidence')throw Error('Examples must disclose hypothetical provenance');
    if(kind==='concept'){if(e.expected?.record_type!==id||!OPS.includes(e.expected?.operation)||!e.decision_boundary)throw Error('Invalid expected concept ruling');}
    else if(!OPS.includes(e.expected_operation)||!e.contrast)throw Error('Invalid operation ruling');
   }
  }
 }
 if(!Array.isArray(s.end_to_end)||s.end_to_end.length<3||s.end_to_end.some(e=>e.steps?.length<7||!e.output))throw Error('Incomplete worked procedures');
 return true;
}
function validateProposal(p,{contract,shots,schema}){
 exact(p,PROP,'proposal');
 if(p.schema!=='issuestack.semantic-proposal.v1'||p.chore_version!==1||!SHA.test(p.evidence_sha256))throw Error('Proposal identity/version invalid');
 for(const k of ['command_id','chore_id','record_id','atomic_claim'])string(p[k],k);
 if(!contract.chore_catalog.some(x=>x.id===p.chore_id))throw Error('Unknown chore ID');
 const types=[...contract.ontology.concepts.map(x=>x.id),'unclassified'];if(!types.includes(p.record_type)||!OPS.includes(p.operation))throw Error('Unknown concept or operation');
 const typ=schema.$defs['payload_'+p.record_type];if(!typ)throw Error('Missing payload');
 exact(p.payload,typ.required,'typed payload '+p.record_type);
 for(const [key,def]of Object.entries(typ.properties)){if(def.type==='array')arr(p.payload[key],key);else if(typeof p.payload[key]!=='string')throw Error('Invalid payload '+key);}
 if(!Array.isArray(p.evidence))throw Error('Missing evidence list');
 for(const e of p.evidence){exact(e,EV,'evidence');string(e.uri,'evidence link');if(typeof e.assertion_span!=='string'||!SHA.test(e.sha256)||e.source_commit!==null&&!SHA40.test(e.source_commit)||e.observed_at!==null&&Number.isNaN(Date.parse(e.observed_at)))throw Error('Invalid provenance');
  if(!['verified_static','verified_runtime','documented','inferred','unknown'].includes(e.evidence_class))throw Error('Invalid evidence class');
 }
 exact(p.semantic_ruling,RULING,'semantic ruling');
 for(const k of ['inclusion_test','exclusion_test','reason'])string(p.semantic_ruling[k],k);
 for(const k of ['few_shot_refs','alternatives','uncertainties'])arr(p.semantic_ruling[k],k);
 if(!p.semantic_ruling.few_shot_refs.length||!['high','medium','low','unknown'].includes(p.semantic_ruling.confidence))throw Error('Missing ruling calibration');
 const refs=new Set([...shots.concepts.flatMap(x=>x.examples.map(y=>y.id)),...shots.operations.flatMap(x=>x.examples.map(y=>y.id)),...shots.end_to_end.map(x=>x.id)]);
 for(const id of p.semantic_ruling.few_shot_refs)if(!refs.has(id))throw Error('Unknown fewshot '+id);
 arr(p.uncertainties,'uncertainties');
 if(p.existing_record_ref!==null&&typeof p.existing_record_ref!=='string')throw Error('Invalid record reference');
 if(p.proposed_registry_page!==null&&typeof p.proposed_registry_page!=='string')throw Error('Invalid registry reference');
 if(!['pending_review','review_not_required','approved','rejected','deferred','blocked'].includes(p.review_status))throw Error('Invalid review');
 if(!['DEFER','NO_OP'].includes(p.operation)&&p.review_status==='review_not_required')throw Error('Mutation without review');
 if(['AUGMENT','REVISE','SUPERSEDE','CONFLICT'].includes(p.operation)&&!p.existing_record_ref)throw Error('Missing existing target');
 if(!['DEFER','NO_OP'].includes(p.operation)&&!p.evidence.length)throw Error('Unsupported positive claim');
 if(p.record_type==='unclassified'&&!['DEFER','NO_OP'].includes(p.operation))throw Error('Unclassified must defer');
 return true;
}
function keyOf(command_id,chore_id,chore_version,evidence_sha256){
 string(command_id,'command ID');string(chore_id,'chore ID');
 if(chore_version!==1||!SHA.test(evidence_sha256))throw Error('Invalid chore version/evidence');
 return sha(JSON.stringify({command_id,chore_id,chore_version,evidence_sha256}));
}
function validateCheckpoint(cp,{contract}){
 exact(cp,CP,'checkpoint');if(cp.schema!=='issuestack.semantic-chore.checkpoint.v1'||cp.catalog_version!==1||Number.isNaN(Date.parse(cp.evaluated_at)))throw Error('Checkpoint version/time');
 string(cp.command_id,'command id');if(cp.job_id!==null&&typeof cp.job_id!=='string')throw Error('Invalid job ref');
 exact(cp.budget,['max_passes','evidence_units','tool_calls','proposals'],'budget');
 for(const [key,limit]of Object.entries({max_passes:1,evidence_units:contract.budgets.max_evidence_units,tool_calls:contract.budgets.max_tool_calls,proposals:contract.budgets.max_proposals})){
  if(!Number.isInteger(cp.budget[key])||cp.budget[key]<0||cp.budget[key]>limit)throw Error('Budget exceeded '+key);
 }
 if(!Array.isArray(cp.chores))throw Error('Invalid checkpoint chores');const found=new Set();
 for(const item of cp.chores){exact(item,CH,'chore result');if(found.has(item.chore_id))throw Error('Duplicate chore');found.add(item.chore_id);
  if(!contract.chore_catalog.some(x=>x.id===item.chore_id)||item.chore_version!==1||!SHA.test(item.evidence_sha256)||item.idempotency_key!==keyOf(cp.command_id,item.chore_id,1,item.evidence_sha256))throw Error('Chore key mismatch');
  if(!STATES.includes(item.status))throw Error('Invalid chore outcome');arr(item.proposal_refs,'proposal refs');string(item.reason,'chore reason');
  if(item.next_action!==null&&typeof item.next_action!=='string')throw Error('Invalid next action');
 }
 arr(cp.remaining,'remaining');for(const id of cp.remaining)if(!contract.chore_catalog.some(x=>x.id===id))throw Error('Unknown remaining chore');
 if(!['complete','deferred','blocked','no_op'].includes(cp.status)||cp.remaining.length&&cp.status==='complete')throw Error('Invalid completion');
 return true;
}
function planPostCommand({command_id,job_id=null,primary_state,top_level=true,within_semantic_chore=false,changed_evidence=[],prior=[],now,contract}){
 string(command_id,'command ID');if(Number.isNaN(Date.parse(now)))throw Error('Invalid time');
 if(!['succeeded','failed','blocked','handed_off'].includes(primary_state))throw Error('Not a command boundary');
 if(!Array.isArray(changed_evidence))throw Error('Invalid source delta');
 const blocked=!top_level||within_semantic_chore,digest=sha(JSON.stringify(changed_evidence));
 const budget={max_passes:blocked?0:1,evidence_units:Math.min(changed_evidence.length,contract.budgets.max_evidence_units),tool_calls:0,proposals:0},chores=[],remaining=[];
 for(const chore of contract.chore_catalog){
  const idempotency_key=keyOf(command_id,chore.id,1,digest);
  const prev=prior.find(x=>x.chore_id===chore.id&&x.idempotency_key===idempotency_key&&['completed','no_op'].includes(x.status));
  let status='no_op',reason='No new evidence',next_action=null;
  if(blocked)reason='Internal call or semantic chore does not recurse';
  else if(prev)reason='Identical evidence/chore revision previously completed';
  else if(chore.id==='SC07'){status='completed';reason='Checkpoint prepared; operator must persist to approved durable surface';}
  else if(changed_evidence.length){
   status='deferred';reason=changed_evidence.length>contract.budgets.max_evidence_units?'Evidence budget exceeded':'Semantic work requires an active operator judgment, not a deterministic guess';
   next_action='Run '+chore.id+' procedure or record bounded handoff';remaining.push(chore.id);
  }
  chores.push({chore_id:chore.id,chore_version:1,evidence_sha256:digest,idempotency_key,status,proposal_refs:[],reason,next_action});
 }
 const cp={schema:'issuestack.semantic-chore.checkpoint.v1',command_id,job_id,catalog_version:1,evaluated_at:now,budget,chores,remaining,status:remaining.length?'deferred':chores.some(x=>x.status==='completed')?'complete':'no_op'};
 validateCheckpoint(cp,{contract});return cp;
}
module.exports={load,validateLibrary,validateProposal,validateCheckpoint,planPostCommand,keyOf,sha};
if(require.main===module){const {contract,shots,schema}=load();process.stdout.write(JSON.stringify({valid:true,concepts:contract.ontology.concepts.length,chore_steps:contract.chore_catalog.length,few_shots:shots.concepts.reduce((n,c)=>n+c.examples.length,0)+shots.operations.reduce((n,c)=>n+c.examples.length,0),end_to_end:shots.end_to_end.length,proposal_schema:!!schema.$defs.semantic_proposal},null,2)+'\n');}
