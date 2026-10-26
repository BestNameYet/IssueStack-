'use strict';

// GitHub Actions event adapter. GITHUB_TOKEN-created comments do not recursively
// trigger issue_comment workflows: process pair creation in the same run and
// wait for a separately authorized agent edit to the Issue #7 return block.
const coreLogic = require('./issue5-projection');
const defaultConfig=require('../config/issue5-rendering.json');
const {
  readBlock,pairRecord,pairDigest,issue7Body,parseIssue7,buildProjections,
  verifyBotOwnership,sourceBody,issueConfig
}=coreLogic;

const log=(core,level,message)=>{if(typeof core?.[level]==='function')core[level](message);};
const expectedRepo='BestNameYet/IssueStack-';
const permittedEvents=new Set(['created','edited']);
function hasIssueCommentEvent(context){return context.eventName==='issue_comment'&&permittedEvents.has(context.payload.action)}
function isConfigurationEvent(context){return context.eventName==='issues'&&context.payload.action==='edited'&&context.payload.issue.number===5}
function validateContext(context){
  const fullname=context.repo.owner+'/'+context.repo.repo;
  if(fullname!==expectedRepo)throw Error('Unexpected repository '+fullname);
  if(context.actor!==context.repo.owner)throw Error('Non-owner event rejected');
  return fullname;
}
async function fetchComments(github,context,issue_number){
  const comments=await github.paginate(github.rest.issues.listComments,{owner:context.repo.owner,repo:context.repo.repo,issue_number,per_page:100});
  return comments.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)||a.id-b.id);
}
async function fetchComment(github,context,comment_id){
  const r=await github.rest.issues.getComment({...context.repo,comment_id});
  if(!r.data || r.data.id!==comment_id)throw Error('GitHub returned wrong comment ID');
  return r.data;
}
async function safeUpdateComment(github,context,old,body,kind){
  if(old.body===body)return {id:old.id,changed:false};
  const current=await fetchComment(github,context,old.id);
  if(current.body!==old.body)throw Error('Concurrent '+kind+' source update detected');
  const result=await github.rest.issues.updateComment({...context.repo,comment_id:old.id,body});
  if(result.data.id!==old.id)throw Error('Comment update changed ID');
  const check=await fetchComment(github,context,old.id);
  if(check.body!==body)throw Error('Comment update not verified');
  return {id:old.id,changed:true};
}
async function safeCreateComment(github,context,issue_number,body){
  const result=await github.rest.issues.createComment({...context.repo,issue_number,body});
  const actual=await fetchComment(github,context,result.data.id);
  if(actual.body!==body)throw Error('Issue7 creation readback mismatch');
  return actual;
}
function ensureSourceOwned(previousBody,currentBody){
  // GitHub's old body is available in issue_comment edited events only.
  // Treat both analysis and projection tags as bot-owned *when they exist*;
  // agent-issued first analysis can be installed in a reserved slot, while
  // subsequent edits must preserve it without a controlled revision.
  verifyBotOwnership(previousBody,currentBody,'projection');
}
function ensureIssue7Owned(previousBody,currentBody){
  verifyBotOwnership(previousBody,currentBody,'pair');
  const prefix=previousBody.split('<!-- ISSUESTACK7_SOURCE_PAIR_START')[0];
  if(!currentBody.startsWith(prefix))throw Error('Issue7 bot instruction header altered');
}
function matchingPair(comment,pair){
  try{
    const stored=readBlock(comment.body,'pair');
    return stored?.schema===coreLogic.SCHEMAS.pair && stored.turn===pair.turn &&
      stored.issue5_prompt_comment_id===pair.issue5_prompt_comment_id && stored.issue5_agent_comment_id===pair.issue5_agent_comment_id;
  }catch{return false}
}
function existingTurn(comment,turn){
  try{return readBlock(comment.body,'pair')?.turn===turn}catch{return false}
}
async function handleIssue5Comment({github,context,core}){
  const comment=context.payload.comment,issue=context.payload.issue;
  if(issue.number!==5 || !comment)return {ignored:true};
  if(context.payload.action==='edited'){
    const prev=context.payload.changes?.body?.from;
    if(typeof prev!=='string')throw Error('Missing previous comment body for edit ownership check');
    try { ensureSourceOwned(prev,comment.body); }
    catch (error) {
      // Never leave altered bot instructions as if they were authoritative.
      // Restore the prior full comment only after checking the current ID/body.
      await safeUpdateComment(github,context,comment,prev,'protected Issue5 region repair');
      throw error;
    }
  }
  const comments=await fetchComments(github,context,5);
  const index=comments.findIndex(x=>x.id===comment.id);
  if(index<0)throw Error('Edited Issue5 comment missing from transcript');
  if(index%2===0){
    // Once an even-position response exists, the paired odd-position prompt is
    // immutable. A changed prompt would silently detach the stored second run
    // and leave old projections incorrectly attached to a new request.
    if(context.payload.action==='edited' && comments[index+1]){
      const prev=context.payload.changes?.body?.from;
      if(typeof prev!=='string')throw Error('Missing previous paired prompt body');
      if(sourceBody(prev)!==sourceBody(comment.body)){
        await safeUpdateComment(github,context,comment,prev,'immutable paired user prompt repair');
        throw Error('Paired user prompt is immutable; submit a new odd-position turn');
      }
      return {state:'paired_user_prompt',turn:(index+2)/2};
    }
    return {state:'awaiting_agent_response',turn:(index+2)/2};
  }
  const prompt=comments[index-1],answer=comments[index];
  const turn=(index+1)/2;
  if(!prompt||!answer)throw Error('Broken odd/even Issue5 transcript');
  const pair=pairRecord(prompt,answer,turn);
  const issue7comments=await fetchComments(github,context,7);
  const same=issue7comments.filter(x=>matchingPair(x,pair));
  const sameTurn=issue7comments.filter(x=>existingTurn(x,turn));
  if(same.length>1 || sameTurn.length>1)throw Error('Conflicting duplicate Issue7 pair records');
  if(sameTurn.length && !same.length)throw Error('Issue7 turn ID occupied by different source comments');
  if(!same.length){
    const created=await safeCreateComment(github,context,7,issue7Body(pair));
    log(core,'info','Issue7 paired turn '+turn+' saved as comment '+created.id);
    return {state:'awaiting_second_run',turn,issue7_comment_id:created.id,created:true};
  }
  const original=same[0],oldPair=readBlock(original.body,'pair');
  // The stored pair's revision is a lifecycle counter, not source content.
  // Ignore it when checking for an unchanged replay of the same source pair.
  if(!Number.isSafeInteger(oldPair.revision)||oldPair.revision<0)throw Error('Invalid stored Issue7 pair revision');
  if(pairDigest({...oldPair,revision:0})===pairDigest(pair))return {state:'awaiting_or_processed_second_run',turn,issue7_comment_id:original.id,created:false};
  const updated={...pair,revision:oldPair.revision+1};
  const newBody=issue7Body(updated);
  await safeUpdateComment(github,context,original,newBody,'Issue7 pair revision');
  // The old projection was derived from an obsolete pair. Remove stale display
  // instructions from BOTH original comments until the new second run validates.
  // Retain the source bodies (including the prompt-analysis tag) byte for byte.
  await safeUpdateComment(github,context,prompt,sourceBody(prompt.body),'stale Issue5 user projection invalidation');
  await safeUpdateComment(github,context,answer,sourceBody(answer.body),'stale Issue5 agent projection invalidation');
  return {state:'awaiting_second_run',turn,issue7_comment_id:original.id,revised:true};
}
async function applyValidatedPair({github,context,core,issue7Comment,config}){
  const {pair}=parseIssue7(issue7Comment.body);
  const comments=await fetchComments(github,context,5),expectedPrompt=comments[pair.turn*2-2],expectedAgent=comments[pair.turn*2-1];
  if(!expectedPrompt || !expectedAgent)throw Error('Issue5 pair not complete');
  if(expectedPrompt.id!==pair.issue5_prompt_comment_id || expectedAgent.id!==pair.issue5_agent_comment_id)throw Error('Issue5 turn parity or IDs changed');
  const computed=buildProjections({promptComment:expectedPrompt,agentComment:expectedAgent,issue7Comment,config});
  const user=await safeUpdateComment(github,context,expectedPrompt,computed.updatedPrompt,'Issue5 user projection');
  const agent=await safeUpdateComment(github,context,expectedAgent,computed.updatedAgent,'Issue5 agent projection');
  log(core,'info','Projected Issue7 comment '+issue7Comment.id+' onto Issue5 comments '+user.id+' and '+agent.id);
  return {state:'projected',turn:pair.turn,issue7_comment_id:issue7Comment.id,user,agent};
}
async function handleIssue7Comment({github,context,core,config}){
  const comment=context.payload.comment;
  if(context.payload.issue.number!==7 || !comment)return {ignored:true};
  if(context.payload.action==='edited'){
    const prev=context.payload.changes?.body?.from;
    if(typeof prev!=='string')throw Error('Missing prior Issue7 body for protected pair comparison');
    try { ensureIssue7Owned(prev,comment.body); }
    catch (error) {
      await safeUpdateComment(github,context,comment,prev,'protected Issue7 source-pair repair');
      throw error;
    }
  }
  // Verify source by independent live fetch. The owner/agent replaces only the
  // Issue7 return slot. Bot-generated new Issue7 comments cannot recursively
  // fire this workflow, so this runs after the agent's separately authenticated edit.
  const live=await fetchComment(github,context,comment.id);
  return applyValidatedPair({github,context,core,issue7Comment:live,config});
}
async function handleConfigChange({github,context,core,config}){
  const results=[],issue7comments=await fetchComments(github,context,7);
  for(const record of issue7comments){
    const pair=readBlock(record.body,'pair'),result=readBlock(record.body,'second');
    if(!pair || !result || !result.schema)continue;
    // A failed/uncertain second-run return MUST block rather than hide an error.
    results.push(await applyValidatedPair({github,context,core,issue7Comment:record,config}));
  }
  return {state:'reprojected',count:results.length};
}
async function run({github,context,core}){
  validateContext(context);
  if(!hasIssueCommentEvent(context) && !isConfigurationEvent(context))return {ignored:true};
  const issueNumber=context.payload.issue?.number;
  if(![5,7].includes(issueNumber))return {ignored:true};
  const issue=await github.rest.issues.get({...context.repo,issue_number:5});
  const config=issueConfig(issue.data.body||'',defaultConfig);
  if(isConfigurationEvent(context))return handleConfigChange({github,context,core,config});
  if(issueNumber===5)return handleIssue5Comment({github,context,core});
  if(issueNumber===7)return handleIssue7Comment({github,context,core,config});
  return {ignored:true};
}
module.exports={run,fetchComments,fetchComment,safeUpdateComment,safeCreateComment,handleIssue5Comment,handleIssue7Comment,handleConfigChange,applyValidatedPair,ensureIssue7Owned,ensureSourceOwned};
