'use strict';
/* Evaluate independent response cohorts. This script NEVER runs an agent. */
const fs=require('node:fs');
const path=require('node:path');
const registry=require('./agent-context-registry.js');
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const required=(args,flag)=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error(flag+' required');return args[i+1];};
function evaluate({config,fixtures,baseline,registryAnswers}){
 if(!Array.isArray(baseline.answers)||!Array.isArray(registryAnswers.answers))throw Error('Cohorts must contain answers arrays');
 if(!baseline.run_id || !registryAnswers.run_id || baseline.run_id===registryAnswers.run_id)throw Error('Independent distinct run IDs are required');
 if(baseline.source==='synthetic'||registryAnswers.source==='synthetic')throw Error('Synthetic cohorts cannot be counted as actual agent runs');
 for(const [label,cohort]of [['baseline',baseline],['registry',registryAnswers]]){
   if(!cohort.model||!cohort.timestamp||!cohort.provenance)throw Error(label+' cohort metadata incomplete');
   const seen=new Set();
   for(const answer of cohort.answers){
     if(!answer || typeof answer.id!=='string'||seen.has(answer.id))throw Error(label+' answer IDs invalid');
     seen.add(answer.id);
     if(answer.confidence!==undefined&&(answer.confidence<0||answer.confidence>1))throw Error('Invalid confidence');
     if(answer.tokens!==undefined&&(!Number.isFinite(answer.tokens)||answer.tokens<0))throw Error('Invalid token metric');
     if(answer.retrievals!==undefined&&(!Number.isFinite(answer.retrievals)||answer.retrievals<0))throw Error('Invalid retrieval metric');
   }
 }
 const a=registry.scoreBenchmark(fixtures,baseline.answers,config);
 const b=registry.scoreBenchmark(fixtures,registryAnswers.answers,config);
 return {schema:'issuestack.agent-context.comparison.v1',created_at:new Date().toISOString(),
   fixture_count:fixtures.fixtures.length,baseline:{run_id:baseline.run_id,model:baseline.model,provenance:baseline.provenance,...a},
   registry:{run_id:registryAnswers.run_id,model:registryAnswers.model,provenance:registryAnswers.provenance,...b},
   comparison:registry.compareBenchmarks(a,b,config),
   limitations:['Results are valid only for supplied independently executed cohorts and declared ground truth',
     'Question fixtures are visible in the repository: use held-out cases for unbiased evaluation',
     'Runtime-dependent questions require current evidence; null represents abstention, not historical correctness']};
}
if(require.main===module){
 const args=process.argv.slice(2),config=registry.loadConfig(required(args,'--config'));
 const output=evaluate({config,fixtures:read(required(args,'--fixtures')),
   baseline:read(required(args,'--baseline')),registryAnswers:read(required(args,'--registry'))});
 process.stdout.write(JSON.stringify(output,null,2)+'\n');
}

function deterministicOrder(fixtures,seed) {
 if(!Number.isSafeInteger(seed)||seed<0)throw Error('Nonnegative integer seed required');
 let state=(seed>>>0)||1;
 const ids=fixtures.map(f=>f.id),seen=new Set();
 for(const id of ids){if(typeof id!=='string'||seen.has(id))throw Error('Fixture ID missing or duplicate');seen.add(id);}
 const v=[...fixtures].map(f=>({id:f.id,question:f.question}));
 for(let i=v.length-1;i>0;i--){
   state=(Math.imul(1664525,state)+1013904223)>>>0;
   const j=state%(i+1);
   [v[i],v[j]]=[v[j],v[i]];
 }
 return v;
}
function buildProtocol({fixtures,heldout,seed=20261027}) {
 if(fixtures?.schema!=='issuestack.agent-context.fixtures.v1'||heldout?.schema!=='issuestack.agent-context.heldout.v1')throw Error('Fixture schema mismatch');
 const ids=new Set();
 for(const f of [...fixtures.fixtures,...heldout.fixtures]){
   if(!f.question||typeof f.id!=='string'||ids.has(f.id))throw Error('Fixture invalid or duplicate');
   ids.add(f.id);
 }
 const prompts={
   public:deterministicOrder(fixtures.fixtures,seed),
   adversarial:deterministicOrder(heldout.fixtures,seed^0x4c4457)
 };
 return {schema:'issuestack.agent-context.protocol.v1',seed,
   conditions:[
     {cohort:'baseline',sources:['Repository AGENTS.md','README.md if present','Applicable Issue #6 instructions'],registry_allowed:false},
     {cohort:'registry',sources:['Repository AGENTS.md','README.md if present','Applicable Issue #6 instructions','Issue #8 TOC and relevant pages'],registry_allowed:true}
   ],
   scoring_requirements:['Independent new agent context in both cohorts','Record run IDs, model, start/end time and retrievable provenance','Record each answer, calibrated confidence, tool retrieval count, and token consumption','Abstain explicitly on unverifiable live questions','Use seeded order and supplied immutable source commit','Blind evaluation requires externally hidden fixtures and a separate evaluation judge'],
   prompts,
   limitations:['Published adversarial fixtures are reproducible but not blind','Creating protocol is not an agent execution','No synthetic performance can substitute for separate actual agents']};
}
function evaluateExtended({config,fixtures,heldout,baseline,registryAnswers,seed=20261027}) {
 const protocol=buildProtocol({fixtures,heldout,seed});
 const valid=new Set([...fixtures.fixtures,...heldout.fixtures].map(f=>f.id));
 for(const [kind,cohort]of [['baseline',baseline],['registry',registryAnswers]]){
   if(cohort.cohort!==kind||cohort.seed!==seed||cohort.source_commit!==registryAnswers.source_commit || !/^[0-9a-f]{40}$/.test(cohort.source_commit||''))throw Error(kind+' cohort identity, seed or source commit mismatch');
   if(!Array.isArray(cohort.answers)||cohort.answers.length!==valid.size||cohort.answers.some(a=>!valid.has(a.id)))throw Error(kind+' cohort fixture coverage mismatch');
   if(cohort.answers.some(a=>typeof a.tokens!=='number'||typeof a.retrievals!=='number'||typeof a.confidence!=='number'))throw Error(kind+' missing token/retrieval/calibration measurements');
 }
 const primary=evaluate({config,fixtures,baseline,registryAnswers});
 const adversarial=evaluate({config,fixtures:{fixtures:heldout.fixtures},baseline,registryAnswers});
 return {schema:'issuestack.agent-context.extended-comparison.v1',
   protocol_version:protocol.schema,seed,source_commit:baseline.source_commit,
   public:primary,adversarial,complete_runs:true,
   limitations:['A score requires independently collected non-synthetic actual agent answers; caller-supplied provenance must be audited','Published adversarial fixtures are not truly blind']};
}

module.exports={evaluate,deterministicOrder,buildProtocol,evaluateExtended};