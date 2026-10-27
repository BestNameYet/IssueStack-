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
module.exports={evaluate};