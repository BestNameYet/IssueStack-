'use strict';
const fs=require('node:fs');
const path=require('node:path');
const registry=require('./agent-context-registry.js');
const JOB_ID=6452132288;
async function observe({github,owner,repo,config,now=new Date().toISOString()}) {
  if(!github?.rest?.actions?.listWorkflowRunsForRepo||!github?.rest?.issues?.getComment)throw Error('GitHub observation client unavailable');
  const response=await github.rest.actions.listWorkflowRunsForRepo({owner,repo,per_page:Math.min(config.max_workflow_runs,100)});
  const runs=(response.data.workflow_runs||[]).slice(0,config.max_workflow_runs).map(r=>({
    id:r.id,name:r.name,path:r.path,status:r.status,conclusion:r.conclusion,
    created_at:r.created_at,updated_at:r.updated_at,html_url:r.html_url
  }));
  const fetched=await github.rest.issues.getComment({owner,repo,comment_id:JOB_ID});
  const jobComment=fetched.data;
  const j=JSON.parse(jobComment.body);
  if(j['nonce[string]']!=='issuestack-agent-context-registry-issue8-20261027-v1')throw Error('Observed job nonce mismatch');
  const e=j['execution[object<Execution>]'];
  const c=j['completion[object<Completion>]'];
  const job={id:JOB_ID,status:e['status[string]'],success:c['success[boolean|null]'],
    outstanding:c['remaining_requirement_ids[array<Reference>]'].length,
    started_at:e['started_at[string|null]'],updated_at:jobComment.updated_at,
    evidence:'https://github.com/'+owner+'/'+repo+'/issues/2#issuecomment-'+JOB_ID,
    verification:'verified_runtime'};
  return registry.runtimeSnapshot({observedAt:now,runs,job,maxFreshnessHours:config.max_freshness_hours});
}
async function buildWithRuntime({github,context,configPath='config/agent-context-registry.json',outputPath='context-registry-preview.json'}){
  const config=registry.loadConfig(configPath);
  const owner=context.repo.owner,repo=context.repo.repo,commit=context.sha;
  const base=registry.buildRegistry({root:process.cwd(),repo:owner+'/'+repo,commit,config,observedAt:new Date().toISOString()});
  base.runtime=await observe({github,owner,repo,config});
  fs.writeFileSync(path.resolve(outputPath),JSON.stringify(base,null,2)+'\n');
  return {outputPath,files:base.sources.length,workflows:base.runtime.workflows.length,commit};
}
module.exports={observe,buildWithRuntime,JOB_ID};