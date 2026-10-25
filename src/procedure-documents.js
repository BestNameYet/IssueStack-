'use strict';

// Dedicated Issue #13 procedure documents; static Issue #2 task.v3 JSON is
// completely separate. HTML comments hide state in rendered Markdown only:
// they do NOT restrict GitHub comment editing or provide secrecy.
const ISSUE=13;
const DECLARATION='issuestack.procedure.v1';
const STATE_VERSION='issuestack.procedure.state.v1';
const ID_START='<!-- ISSUESTACK_DECLARED_PROCEDURE:';
const BOT_START='<!-- ISSUESTACK_BOT_INSTRUCTION_START -->';
const BOT_END='<!-- ISSUESTACK_BOT_INSTRUCTION_END -->';
const ANSWER_START='<!-- ISSUESTACK_AGENT_ANSWER_START -->';
const ANSWER_END='<!-- ISSUESTACK_AGENT_ANSWER_END -->';
const STATE_START='<!-- ISSUESTACK_PROCEDURE_STATE_START';
const STATE_END='ISSUESTACK_PROCEDURE_STATE_END -->';
const fence=String.fromCharCode(96).repeat(3);
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const noncePattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/;
const idPattern=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const validTypes=new Set(['string','number','integer','boolean','null','object','array']);
function exact(value,keys,path){
  if(!object(value))throw Error(path+' must be a JSON object');
  const actual=Object.keys(value),want=[...keys].sort();
  if(actual.length!==want.length||actual.sort().some((k,i)=>k!==want[i]))throw Error(path+' must have exactly '+want.join(', '));
}
function typeDefinition(schema,path,depth=0){
  if(depth>8)throw Error(path+' return schema exceeds depth limit');
  if(!object(schema)||!validTypes.has(schema.type))throw Error(path+' must declare valid return type');
  if(schema.type==='object'){
    exact(schema,['type','properties','required','additionalProperties'],path);
    if(!object(schema.properties)||Object.keys(schema.properties).length>40)throw Error(path+' properties must be an object (max 40)');
    if(!Array.isArray(schema.required)||new Set(schema.required).size!==schema.required.length||
      schema.required.some(k=>typeof k!=='string'||!own(schema.properties,k)))throw Error(path+' required must identify unique declared properties');
    if(schema.additionalProperties!==false)throw Error(path+' additionalProperties must be false');
    for(const [key,value] of Object.entries(schema.properties)){
      if(!idPattern.test(key)||['constructor','prototype','__proto__'].includes(key))throw Error(path+' invalid property '+key);
      typeDefinition(value,path+'.'+key,depth+1);
    }
  } else if(schema.type==='array'){
    exact(schema,['type','items'],path);
    typeDefinition(schema.items,path+'[]',depth+1);
  } else exact(schema,['type'],path);
}
function validateDeclaration(d){
  try{
    exact(d,['schema','nonce','title','steps'],'procedure');
    if(d.schema!==DECLARATION)throw Error('Unsupported procedure schema');
    if(typeof d.nonce!=='string'||!noncePattern.test(d.nonce))throw Error('Invalid nonce');
    if(typeof d.title!=='string'||!d.title.trim()||d.title.length>200)throw Error('Procedure title required (max 200)');
    if(!Array.isArray(d.steps)||d.steps.length<1||d.steps.length>50)throw Error('Procedure needs 1-50 ordered steps');
    const ids=new Set();
    d.steps.forEach((step,i)=>{
      exact(step,['id','instruction','returns'],'steps['+i+']');
      if(typeof step.id!=='string'||!idPattern.test(step.id)||ids.has(step.id))throw Error('Step ID invalid or duplicated: '+step.id);
      ids.add(step.id);
      if(typeof step.instruction!=='string'||!step.instruction.trim()||step.instruction.length>12000)throw Error('Empty or excessive instruction at step '+step.id);
      typeDefinition(step.returns,'steps['+i+'].returns');
    });
    const encoded=JSON.stringify(d);
    if(encoded.length>60000)throw Error('Procedure document exceeds 60 KB');
    if(encoded.includes('<!--')||encoded.includes('-->')||encoded.includes('ISSUESTACK_PROCEDURE_STATE_END'))throw Error('Procedure contains reserved HTML or state delimiter');
    return null;
  }catch(e){return e.message;}
}
function validateValue(value,schema,path='$'){
  switch(schema.type){
    case 'null':return value===null?null:path+' expected null';
    case 'string':return typeof value==='string'?null:path+' expected string';
    case 'number':return typeof value==='number'&&Number.isFinite(value)?null:path+' expected number';
    case 'integer':return typeof value==='number'&&Number.isSafeInteger(value)?null:path+' expected integer';
    case 'boolean':return typeof value==='boolean'?null:path+' expected boolean';
    case 'array':
      if(!Array.isArray(value))return path+' expected array';
      for(let i=0;i<value.length;i++){const e=validateValue(value[i],schema.items,path+'['+i+']');if(e)return e;}
      return null;
    case 'object':
      if(!object(value))return path+' expected object';
      for(const k of Object.keys(value))if(!own(schema.properties,k))return path+' unexpected property '+k;
      for(const k of schema.required)if(!own(value,k))return path+' missing required property '+k;
      for(const [k,v] of Object.entries(value)){const e=validateValue(v,schema.properties[k],path+'.'+k);if(e)return e;}
      return null;
    default:throw Error('Unexpected return type '+schema.type);
  }
}
function initialState(declaration,sourceId){
  const e=validateDeclaration(declaration);
  if(e)throw Error('Invalid procedure: '+e);
  if(!Number.isSafeInteger(sourceId)||sourceId<1)throw Error('Invalid source comment ID');
  return {schema:STATE_VERSION,source_comment_id:sourceId,definition:declaration,revision:0,returns:[],last_error:null};
}
function validateState(state){
  exact(state,['schema','source_comment_id','definition','revision','returns','last_error'],'state');
  if(state.schema!==STATE_VERSION||!Number.isSafeInteger(state.source_comment_id)||state.source_comment_id<1)throw Error('Invalid state identity');
  const err=validateDeclaration(state.definition);if(err)throw Error('Invalid stored procedure: '+err);
  if(!Array.isArray(state.returns)||!Number.isSafeInteger(state.revision)||state.revision!==state.returns.length||
    state.revision>state.definition.steps.length)throw Error('State revision disagrees with prior returns');
  if(state.last_error!==null&&typeof state.last_error!=='string')throw Error('Invalid state error');
  state.returns.forEach((r,i)=>{
    exact(r,['step_id','submission_id','return_value','accepted_at'],'returns['+i+']');
    if(r.step_id!==state.definition.steps[i].id||!noncePattern.test(r.submission_id)||typeof r.accepted_at!=='string')
      throw Error('Malformed stored return at '+i);
    if(state.returns.slice(0,i).some(x=>x.submission_id===r.submission_id))throw Error('Repeated submission ID');
    const e=validateValue(r.return_value,state.definition.steps[i].returns,'returns['+i+'].return_value');
    if(e)throw Error(e);
  });
}
function identity(sourceId,nonce){return ID_START+sourceId+':'+nonce+' -->';}
function botProjection(state){
  const step=state.definition.steps[state.revision],total=state.definition.steps.length;
  return {schema:'issuestack.procedure.projection.v1',
    source_comment_id:state.source_comment_id,nonce:state.definition.nonce,
    revision:state.revision,step_number:step?state.revision+1:total,step_total:total,
    status:step?'awaiting_answer':'complete',step_id:step?.id??'complete',
    instruction:step?.instruction??'All declared steps have returned their required values.',
    return_schema:step?.returns??null,last_error:state.last_error};
}
function jsonPanel(start,end,value){
  return start+'\n'+fence+'json\n'+JSON.stringify(value,null,2)+'\n'+fence+'\n'+end;
}
function render(state,answer={}){
  validateState(state);
  const id=identity(state.source_comment_id,state.definition.nonce);
  return [
    '# Procedure: '+state.definition.title,'',id,'',
    'Edit ONLY the JSON inside AGENT ANSWER tags; keep the bot instruction and hidden procedure state unchanged. A new submission must match the current revision and step ID.',
    '',jsonPanel(BOT_START,BOT_END,botProjection(state)),'',
    jsonPanel(ANSWER_START,ANSWER_END,answer),'',
    STATE_START+'\n'+JSON.stringify(state,null,2)+'\n'+STATE_END,'',
    'The bot-owned state is hidden in rendered Markdown, but remains visible/editable in the GitHub comment source. This is not a security boundary.'
  ].join('\n')+'\n';
}
function between(body,start,end){
  const i=body.indexOf(start),j=body.indexOf(end);
  if(i<0||j<=i||body.indexOf(start,i+start.length)>=0||body.indexOf(end,j+end.length)>=0)throw Error('Missing or repeated tag '+start);
  return body.slice(i+start.length,j).trim();
}
function parsePane(body,start,end){
  const inner=between(body,start,end);
  if(!inner.startsWith(fence+'json')||!inner.endsWith(fence))throw Error('Tagged panel must contain JSON fence');
  const obj=JSON.parse(inner.slice((fence+'json').length,-fence.length).trim());
  if(!object(obj))throw Error('JSON panel must be an object');
  return obj;
}
function parseComment(body){
  const state=JSON.parse(between(body,STATE_START,STATE_END));
  validateState(state);
  const id=identity(state.source_comment_id,state.definition.nonce);
  if(body.split(id).length!==2)throw Error('Procedure identity missing or duplicated');
  const bot=parsePane(body,BOT_START,BOT_END);
  if(JSON.stringify(bot)!==JSON.stringify(botProjection(state)))throw Error('Bot instruction panel differs from state');
  return {state,bot,answer:parsePane(body,ANSWER_START,ANSWER_END)};
}
function normalizeAnswer(body){
  const i=body.indexOf(ANSWER_START),j=body.indexOf(ANSWER_END);
  if(i<0||j<=i||body.indexOf(ANSWER_START,i+ANSWER_START.length)>=0)return null;
  return body.slice(0,i+ANSWER_START.length)+'[EDITABLE_ANSWER_ONLY]'+body.slice(j);
}
function validateSubmission(a,state){
  try{
    exact(a,['revision','step_id','submission_id','return_value'],'agent response');
    const step=state.definition.steps[state.revision];
    if(!step)throw Error('Procedure is complete');
    if(a.revision!==state.revision||a.step_id!==step.id)throw Error('Stale revision or incorrect step ID');
    if(typeof a.submission_id!=='string'||!noncePattern.test(a.submission_id)||
      state.returns.some(r=>r.submission_id===a.submission_id))throw Error('Invalid or reused submission ID');
    const error=validateValue(a.return_value,step.returns,'return_value');
    if(error)throw Error(error);
    return null;
  }catch(e){return e.message;}
}
async function verifiedUpdate(github,owner,repo,id,body){
  await github.rest.issues.updateComment({owner,repo,comment_id:id,body});
  const reread=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  if(reread.body!==body)throw Error('Comment readback mismatch: '+id);
}
async function ensureDeclaredProcedure({github,owner,repo,declaration,sourceId,core}){
  const error=validateDeclaration(declaration);
  if(error)throw Error('Invalid procedure declaration: '+error);
  const list=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:ISSUE,per_page:100});
  const same=list.filter(c=>String(c.body).includes(ID_START)&&String(c.body).includes('"nonce": "'+declaration.nonce+'"'));
  if(same.length>1)throw Error('Duplicate procedure nonce needs repair');
  if(same.length){
    const prior=parseComment(same[0].body);
    if(prior.state.source_comment_id!==sourceId||
      JSON.stringify(prior.state.definition)!==JSON.stringify(declaration))throw Error('Procedure nonce already used by another declaration');
    return same[0].id;
  }
  const created=await github.rest.issues.createComment({owner,repo,issue_number:ISSUE,body:render(initialState(declaration,sourceId))});
  const saved=(await github.rest.issues.getComment({owner,repo,comment_id:created.data.id})).data;
  const read=parseComment(saved.body);
  if(read.state.definition.nonce!==declaration.nonce||read.state.source_comment_id!==sourceId)throw Error('New procedure readback failed');
  core?.info?.('Created declared procedure '+created.data.id+' in Issue #13');
  return created.data.id;
}
async function processEdit({github,owner,repo,comment,previousBody,core}){
  // GitHub Actions GITHUB_TOKEN bot writes do not retrigger this workflow.
  // For an owner edit, GitHub's event changes.body.from is the pre-edit body.
  if(typeof previousBody!=='string')throw Error('Cannot verify previous comment version');
  const prior=parseComment(previousBody);
  if(normalizeAnswer(previousBody)===null||
     normalizeAnswer(previousBody)!==normalizeAnswer(comment.body)){
    // GitHub cannot prevent the edit, but immediately restoring the prior
    // durable state makes the bot-owned region effectively read-only to this
    // workflow's authorized editor.
    await verifiedUpdate(github,owner,repo,comment.id,previousBody);
    core?.warning?.('Restored tampered bot-owned procedure region: '+comment.id);
    return;
  }
  let current;
  try{current=parseComment(comment.body);}
  catch(error){
    const next=JSON.parse(JSON.stringify(prior.state));
    next.last_error='Invalid procedure answer JSON: '+error.message;
    await verifiedUpdate(github,owner,repo,comment.id,render(next));
    core?.warning?.(next.last_error);
    return;
  }
  if(JSON.stringify(current.state)!==JSON.stringify(prior.state))throw Error('Procedure state was modified');
  if(Object.keys(current.answer).length===0)return;
  const error=validateSubmission(current.answer,prior.state);
  const next=JSON.parse(JSON.stringify(prior.state));
  if(error)next.last_error=error;
  else{
    next.returns.push({step_id:current.answer.step_id,submission_id:current.answer.submission_id,
      return_value:current.answer.return_value,accepted_at:new Date().toISOString()});
    next.revision=next.returns.length;
    next.last_error=null;
  }
  const latest=(await github.rest.issues.getComment({owner,repo,comment_id:comment.id})).data;
  if(latest.body!==comment.body)throw Error('Newer edit arrived; do not overwrite it');
  await verifiedUpdate(github,owner,repo,comment.id,render(next,error?current.answer:{}));
  core?.info?.(error?'Rejected procedure return: '+error:'Accepted procedure '+comment.id+' revision '+next.revision);
}
async function run({github,context,core}){
  if(context.eventName!=='issue_comment'||context.payload.action!=='edited'||
    context.payload.issue?.number!==ISSUE||context.payload.issue?.pull_request)return;
  const {owner,repo}=context.repo;
  if(context.actor!==owner){core?.info?.('Non-owner procedure edit ignored: '+context.actor);return;}
  const current=(await github.rest.issues.getComment({owner,repo,comment_id:context.payload.comment.id})).data;
  const prev=context.payload.changes?.body?.from;
  if(!current.body.includes(ID_START)&&!String(prev||'').includes(ID_START))return; // preserve historical demos
  await processEdit({github,owner,repo,comment:current,previousBody:prev,core});
}
module.exports={ISSUE,DECLARATION,STATE_VERSION,BOT_START,BOT_END,ANSWER_START,ANSWER_END,STATE_START,STATE_END,
  validateDeclaration,validateValue,initialState,validateState,identity,render,parseComment,normalizeAnswer,
  validateSubmission,ensureDeclaredProcedure,processEdit,run};
