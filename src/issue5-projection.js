'use strict';

// Issue #5 / #7 two-pass conversation projection, deliberately free of GitHub I/O.
// Both Issue #5 comments keep their permanent IDs. The last pass produces
// agent-facing display instructions, never a ChatGPT UI rendering itself.
const crypto = require('node:crypto');
const presentation = require('./issue5-presentation');
const SCHEMAS = Object.freeze({
  pair:'issuestack.issue7.pair.v1',
  second:'issuestack.issue7.second-run.v1',
  projection:'issuestack.issue5.bot-projection.v2',
  agent:'issuestack.issue5.agent-response.v1',
  config:'issuestack.issue5.render-config.v1'
});
const MARKERS = Object.freeze({
  analysis:'ISSUESTACK5_PROMPT_ANALYSIS',
  projection:'ISSUESTACK5_BOT_PROJECTION',
  config:'ISSUESTACK5_RENDER_CONFIG',
  pair:'ISSUESTACK7_SOURCE_PAIR',
  second:'ISSUESTACK7_AGENT_RETURN'
});
const TONE = new Set(['neutral','directive','inquisitive','collaborative','critical','formal','informal','urgent','unknown']);
const MOOD = new Set(['neutral','calm','curious','pleased','concerned','frustrated','angry','excited','sad','unknown']);
const STATUS = new Set(['answered','needs_input','blocked','error']);
const FIDELITY = new Set(['faithful','requires_review']);
const MESSAGE_RETURN_SCHEMA = Object.freeze({
  type:'object',
  required:['message','fidelity'],
  properties:{message:{type:'string',minLength:1},fidelity:{type:'string',enum:['faithful','requires_review']}},
  additionalProperties:false
});
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const equal = (a,b) => stable(a) === stable(b);
const stable = x => JSON.stringify(canonical(x));
function canonical(x) {
  if (Array.isArray(x)) return x.map(canonical);
  if (isObject(x)) return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));
  return x;
}
const sha256 = x => crypto.createHash('sha256').update(typeof x === 'string'?x:stable(x),'utf8').digest('hex');
function assert(cond,message){if(!cond)throw new Error(message);}
function closed(x,keys,label){
  assert(isObject(x),label+' must be an object');
  for(const k of keys)assert(Object.prototype.hasOwnProperty.call(x,k),label+': missing '+k);
  for(const k of Object.keys(x))assert(keys.includes(k),label+': unexpected '+k);
}
function dateTime(date,time){
  assert(typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date),'invalid ISO date');
  const d=new Date(date+'T00:00:00Z');
  assert(!Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===date,'invalid calendar date');
  assert(typeof time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00)$/.test(time),'invalid offset-aware time');
}
function tagName(kind){assert(Object.hasOwn(MARKERS,kind),'unknown tag');return MARKERS[kind];}
function tagBlock(kind,json){const m=tagName(kind);return '<!-- '+m+'_START\n'+JSON.stringify(json,null,2)+'\n'+m+'_END -->';}
function findBlock(body,kind){
  assert(typeof body==='string','comment body missing');
  const m=tagName(kind),start='<!-- '+m+'_START\n',end='\n'+m+'_END -->';
  const startAt=body.indexOf(start);
  if(startAt<0)return null;
  assert(body.indexOf(start,startAt+start.length)<0,'duplicate '+kind+' region');
  const endAt=body.indexOf(end,startAt+start.length);
  assert(endAt>=0,'unterminated '+kind+' region');
  assert(body.indexOf(end,endAt+end.length)<0,'duplicate '+kind+' end');
  return {start:startAt,end:endAt+end.length,raw:body.slice(startAt+start.length,endAt)};
}
function readBlock(body,kind){const b=findBlock(body,kind);if(!b)return null;try{return JSON.parse(b.raw)}catch{throw new Error('invalid '+kind+' JSON')}}
function withoutBlock(body,kind){
  const block=findBlock(body,kind);if(!block)return body;
  // Bot blocks are appended with exactly two separator newlines. Remove those
  // delimiters, not any preceding user-authored whitespace or line endings.
  assert(block.end===body.length && body.slice(block.start-2,block.start)==='\n\n',
    kind+' region must be terminal and canonically separated');
  return body.slice(0,block.start-2);
}
function upsertBlock(body,kind,json){
  assert(typeof body==='string','comment body missing');
  const block=findBlock(body,kind),render=tagBlock(kind,json);
  if(block)return body.slice(0,block.start)+render+body.slice(block.end);
  return body+'\n\n'+render;
}
function sourceBody(body){return withoutBlock(body,'projection')}
function verifyBotOwnership(previousBody,currentBody,kind='projection'){
  const before=findBlock(previousBody,kind),after=findBlock(currentBody,kind);
  // A human/agent editing a source cannot change a workflow-maintained block.
  assert(equal(before?.raw ?? null,after?.raw ?? null),'bot-owned '+kind+' region altered');
  return true;
}
function validateAnalysis(a,promptText){
  assert(isObject(a),'user prompt analysis missing');
  for(const k of ['date','time','verbatim_user_prompt','salient_surrounding_context','explicit_meaning','implicit_meaning','tone','mood'])
    assert(typeof a[k]==='string','prompt analysis '+k+' must be string');
  dateTime(a.date,a.time);
  assert(TONE.has(a.tone),'invalid tone enum');assert(MOOD.has(a.mood),'invalid mood enum');
  assert(a.verbatim_user_prompt===promptText,'verbatim prompt mismatch');
  return a;
}
function validateAgent(a){
  closed(a,['schema','role','turn','prompt_comment_id','prompt_analysis_ref','date','time','status','message'],'agent return');
  assert(a.schema===SCHEMAS.agent && a.role==='agent','wrong agent return identifiers');
  assert(Number.isSafeInteger(a.turn) && a.turn>=1,'invalid turn');
  assert(Number.isSafeInteger(a.prompt_comment_id) && a.prompt_comment_id>0,'invalid prompt_comment_id');
  assert(typeof a.prompt_analysis_ref==='string' && a.prompt_analysis_ref.length>0,'invalid prompt_analysis_ref');
  dateTime(a.date,a.time);
  assert(STATUS.has(a.status),'invalid agent status');
  assert(typeof a.message==='string' && a.message.length>0,'empty agent message');
  return a;
}
function validateConfig(cfg){
  closed(cfg,['schema','user_prompt','agent_response','rules'],'rendering config');
  assert(cfg.schema===SCHEMAS.config,'unknown rendering config version');
  closed(cfg.user_prompt,['mode'],'user prompt config');
  closed(cfg.agent_response,['mode'],'agent response config');
  closed(cfg.rules,['projection_source','prompt_projection_source','hide_meaning'],'render rules');
  assert(['markdown','json'].includes(cfg.user_prompt.mode),'user prompt mode invalid');
  assert(['markdown','json','hidden'].includes(cfg.agent_response.mode),'agent response mode invalid');
  assert(cfg.rules.projection_source==='issue7-second-run','agent source rule invalid');
  assert(cfg.rules.prompt_projection_source==='issue5-analysis','prompt source rule invalid');
  assert(cfg.rules.hide_meaning==='display-only','hide must not suppress processing');
  return cfg;
}
function issueConfig(issueBody,defaultConfig){
  const override=readBlock(issueBody||'', 'config');
  return validateConfig(override===null ? defaultConfig : override);
}
function setIssueConfig(issueBody,config){
  validateConfig(config);
  return upsertBlock(issueBody||'', 'config', config);
}
function promptParts(promptComment){
  const body=sourceBody(promptComment.body),a=readBlock(body,'analysis');
  assert(a!==null,'user analysis not yet available');
  const prompt=withoutBlock(body,'analysis');
  assert(!prompt.includes('ISSUESTACK5_'),'reserved marker text in prompt');
  validateAnalysis(a,prompt);
  return {analysis:a,prompt,sourceSha256:sha256(body)};
}
function answerParts(agentComment){
  const body=sourceBody(agentComment.body);
  assert(!body.includes('ISSUESTACK5_'),'reserved marker text in agent return');
  let answer;
  try {answer=JSON.parse(body.trim())}catch{throw new Error('agent source return must be JSON')}
  validateAgent(answer);
  return {answer,sourceSha256:sha256(body)};
}
function pairRecord(promptComment,agentComment,turn){
  assert(Number.isSafeInteger(turn) && turn>=1,'turn must be positive integer');
  assert(Number.isSafeInteger(promptComment.id)&&promptComment.id>0,'prompt comment ID required');
  assert(Number.isSafeInteger(agentComment.id)&&agentComment.id>0,'agent comment ID required');
  assert(promptComment.id!==agentComment.id,'prompt and response must be distinct comments');
  const p=promptParts(promptComment),a=answerParts(agentComment),response=a.answer;
  assert(response.turn===turn,'response turn does not match comment position');
  assert(response.prompt_comment_id===promptComment.id,'response prompt comment ID mismatch');
  assert(response.prompt_analysis_ref===`issue5:${promptComment.id}:prompt-analysis:v1`,'unresolved prompt analysis ref');
  const pair={schema:SCHEMAS.pair,revision:0,turn,
    issue5_prompt_comment_id:promptComment.id,issue5_agent_comment_id:agentComment.id,
    prompt_analysis_ref:response.prompt_analysis_ref,
    prompt_source_sha256:p.sourceSha256,agent_source_sha256:a.sourceSha256,
    user_prompt_json:p.analysis,agent_response_json:a.answer,
    return_schema:secondRunSchema()};
  return pair;
}
function secondRunSchema(){return {
  schema:SCHEMAS.second,
  required:['schema','turn','pair_revision','pair_digest','projection_return_schema','projection_return'],
  projection_return_schema:JSON.parse(JSON.stringify(MESSAGE_RETURN_SCHEMA)),
  constraints:'Rearticulate the paired intent faithfully. Do not invent facts; mark requires_review if source conflict or uncertainty prevents faithful synthesis.'
}}
function pairDigest(pair){assert(pair?.schema===SCHEMAS.pair,'invalid pair source');return sha256(pair)}
function issue7Body(pair,returnValue={}){
  assert(pair?.schema===SCHEMAS.pair,'invalid Issue7 pair');
  return `# IssueStack second-run rearticulation — turn ${pair.turn}\n\n`+
    'Read the paired JSON below. Submit exactly one second-run return JSON object by replacing the empty object inside the ISSUESTACK7_AGENT_RETURN block **in this same Issue #7 comment**. Use the declared return_schema, matching turn, pair_revision and pair_digest. Preserve every other byte of the comment. Do not assert unverified facts.\n\n'+
    `Pair digest (SHA-256): ${pairDigest(pair)}\n\n`+
    tagBlock('pair',pair)+'\n\n'+tagBlock('second',returnValue)+'\n';
}
function parseIssue7(body){
  const pair=readBlock(body,'pair'),value=readBlock(body,'second');
  assert(isObject(pair) && pair.schema===SCHEMAS.pair,'Issue7 paired sources missing');
  assert(isObject(value),'Issue7 second return absent');
  return {pair,second:value};
}
function validateSecondReturn(ret,pair){
  closed(ret,['schema','turn','pair_revision','pair_digest','projection_return_schema','projection_return'],'second-run return');
  assert(ret.schema===SCHEMAS.second,'second-run schema version mismatch');
  assert(ret.turn===pair.turn && ret.pair_revision===pair.revision,'second-run turn/revision mismatch');
  assert(ret.pair_digest===pairDigest(pair),'stale second-run source digest');
  assert(equal(ret.projection_return_schema,MESSAGE_RETURN_SCHEMA),'second-run projected return schema outside approved contract');
  const v=ret.projection_return;
  closed(v,['message','fidelity'],'second-run projection_return');
  assert(typeof v.message==='string'&&v.message.trim().length>0,'empty second-run message');
  assert(FIDELITY.has(v.fidelity),'invalid fidelity enum');
  assert(v.fidelity==='faithful','agent reported unverified rearticulation: block final projection');
  return ret;
}
function projectionObject(role,turn,commentId,issue7Id,pair,source,mode){
  assert(role==='user'||role==='agent','invalid projection role');
  assert(Number.isSafeInteger(issue7Id)&&issue7Id>0,'Issue #7 comment ID required');
  const hidden=mode==='hidden';
  // Bot composes the complete semantic tagged presentation from validated source
  // and a versioned ruleset. The ChatGPT agent must render that exact tree.
  const generated=presentation.renderMarkup({role,mode,source});
  const instruction=hidden ?
    'Do not display an agent response. Preserve all verified source and Issue #7 return data, including the empty render_markup checksum.' :
    mode==='json' ?
    'Render the exact bot-produced render_markup DIL component tree, including its JSON code block. Verify rules_schema and render_markup_sha256; never regenerate or reformat from payload.' :
    'Render the exact bot-produced render_markup DIL component tree. Verify rules_schema and render_markup_sha256; do not reconstruct, simplify, summarize, add emphasis, or substitute payload.';
  return {schema:SCHEMAS.projection,role,turn,source_comment_id:commentId,issue7_comment_id:issue7Id,
    pair_digest:pairDigest(pair),mode,action:hidden?'hide':'display',instruction,
    rules_schema:generated.rules_schema,render_markup:generated.markup,
    render_markup_sha256:generated.sha256,payload:hidden?null:source};
}
function buildProjections({promptComment,agentComment,issue7Comment,config}){
  validateConfig(config);
  const {pair,second}=parseIssue7(issue7Comment.body);
  validateSecondReturn(second,pair);
  assert(pair.issue5_prompt_comment_id===promptComment.id && pair.issue5_agent_comment_id===agentComment.id,'pair IDs mismatch');
  const current=pairRecord(promptComment,agentComment,pair.turn);
  assert(current.prompt_source_sha256===pair.prompt_source_sha256&&current.agent_source_sha256===pair.agent_source_sha256,'Issue5 sources changed after Issue7 pairing');
  assert(equal(current.user_prompt_json,pair.user_prompt_json) && equal(current.agent_response_json,pair.agent_response_json),'paired JSON not equal to source');
  const user=projectionObject('user',pair.turn,promptComment.id,issue7Comment.id,pair,current.user_prompt_json,config.user_prompt.mode);
  const agent=projectionObject('agent',pair.turn,agentComment.id,issue7Comment.id,pair,config.agent_response.mode==='json'?second:second.projection_return.message,config.agent_response.mode);
  return {user,agent,updatedPrompt:upsertBlock(promptComment.body,'projection',user),updatedAgent:upsertBlock(agentComment.body,'projection',agent)};
}
module.exports={SCHEMAS,MARKERS,MESSAGE_RETURN_SCHEMA,stable,sha256,tagBlock,findBlock,readBlock,withoutBlock,upsertBlock,sourceBody,verifyBotOwnership,
 validateAnalysis,validateAgent,validateConfig,issueConfig,setIssueConfig,promptParts,answerParts,pairRecord,pairDigest,secondRunSchema,issue7Body,parseIssue7,validateSecondReturn,buildProjections};
