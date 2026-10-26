'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const p=require('./issue5-projection');
const config=require('../config/issue5-rendering.json');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(userMode='markdown',agentMode='markdown'){
 const userText='Use issue 5 instead';
 const analysis={date:'2026-10-25',time:'22:50:00-07:00',verbatim_user_prompt:userText,
 salient_surrounding_context:'Original UI was planned for Issue #4.',
 explicit_meaning:'Use Issue #5 for the conversational UI.',
 implicit_meaning:'Keep the rest of the UI requirements.',tone:'directive',mood:'unknown'};
 const answer={schema:p.SCHEMAS.agent,role:'agent',turn:1,prompt_comment_id:101,
 prompt_analysis_ref:'issue5:101:prompt-analysis:v1',date:'2026-10-25',time:'22:51:00-07:00',status:'answered',message:'Issue #5 replaces Issue #4.'};
 const prompt={id:101,body:p.upsertBlock(userText,'analysis',analysis)};
 const agent={id:102,body:JSON.stringify(answer)};
 const pair=p.pairRecord(prompt,agent,1);
 const second={schema:p.SCHEMAS.second,turn:1,pair_revision:pair.revision,
 pair_digest:p.pairDigest(pair),projection_return_schema:clone(p.MESSAGE_RETURN_SCHEMA),
 projection_return:{message:'Issue #5 is the conversational UI.',fidelity:'faithful'}};
 const issue7={id:701,body:p.issue7Body(pair,second)};
 const settings=clone(config);settings.user_prompt.mode=userMode;settings.agent_response.mode=agentMode;
 return {prompt,agent,pair,second,issue7,settings,analysis,answer};
}
function throws(fn,pattern){assert.throws(fn,pattern)}
test('same source comment IDs produce one strictly correlated paired record',()=>{
 const f=fixture(),pair=f.pair;
 assert.equal(pair.schema,'issuestack.issue7.pair.v1');
 assert.equal(pair.issue5_prompt_comment_id,101);assert.equal(pair.issue5_agent_comment_id,102);
 assert.equal(pair.user_prompt_json.verbatim_user_prompt,'Use issue 5 instead');
 assert.equal(pair.agent_response_json.message,'Issue #5 replaces Issue #4.');
 assert.equal(p.pairDigest(pair),p.pairDigest(p.pairRecord(f.prompt,f.agent,1)));
});
test('issue7 one-comment record contains both JSON documents, schema and second-run return',()=>{
 const f=fixture(),raw=f.issue7.body,parse=p.parseIssue7(raw);
 assert.equal(parse.pair.turn,1);assert.equal(parse.second.turn,1);
 assert.match(raw,/ISSUESTACK7_SOURCE_PAIR_START/);
 assert.match(raw,/ISSUESTACK7_AGENT_RETURN_START/);
 assert.equal(parse.pair.return_schema.schema,'issuestack.issue7.second-run.v1');
 assert.equal(parse.pair.return_schema.projection_return_schema.type,'object');
 assert.equal(p.validateSecondReturn(parse.second,parse.pair),parse.second);
});
test('markdown/markdown projection updates existing two comment bodies, no new Issue5 comments',()=>{
 const f=fixture(),out=p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 assert.equal(out.user.mode,'markdown');assert.equal(out.agent.mode,'markdown');
 assert.equal(out.agent.payload,'Issue #5 is the conversational UI.');
 assert.equal(out.user.payload.verbatim_user_prompt,'Use issue 5 instead');
 assert.equal(p.readBlock(out.updatedPrompt,'projection').source_comment_id,101);
 assert.equal(p.readBlock(out.updatedAgent,'projection').source_comment_id,102);
 assert.equal(p.sourceBody(out.updatedPrompt),p.sourceBody(f.prompt.body));
 assert.equal(p.sourceBody(out.updatedAgent),p.sourceBody(f.agent.body));
 const replay=p.buildProjections({promptComment:{id:101,body:out.updatedPrompt},agentComment:{id:102,body:out.updatedAgent},issue7Comment:f.issue7,config:f.settings});
 assert.equal(replay.updatedPrompt,out.updatedPrompt);assert.equal(replay.updatedAgent,out.updatedAgent);
});
test('JSON rendering preserves actual authoritative user JSON and second run JSON',()=>{
 const f=fixture('json','json');const out=p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 assert.deepEqual(out.user.payload,f.analysis);assert.deepEqual(out.agent.payload,f.second);
 assert.match(out.user.instruction,/JSON code block/);assert.match(out.agent.instruction,/JSON code block/);
});
test('hidden mode suppresses only display; rearticulation and original answer remain',()=>{
 const f=fixture('markdown','hidden');const out=p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 assert.equal(out.agent.action,'hide');assert.equal(out.agent.payload,null);
 assert.match(out.agent.instruction,/Do not display/);
 assert.equal(p.answerParts({id:f.agent.id,body:out.updatedAgent}).answer.message,f.answer.message);
 assert.equal(p.parseIssue7(f.issue7.body).second.projection_return.message,f.second.projection_return.message);
 const show=clone(f.settings);show.agent_response.mode='markdown';
 const again=p.buildProjections({promptComment:{...f.prompt,body:out.updatedPrompt},agentComment:{...f.agent,body:out.updatedAgent},issue7Comment:f.issue7,config:show});
 assert.equal(again.agent.action,'display');assert.equal(again.agent.payload,f.second.projection_return.message);
});
test('mode validation rejects invalid global selectors and violating hide semantics',()=>{
 const f=fixture();f.settings.agent_response.mode='off';throws(()=>p.validateConfig(f.settings),/mode invalid/);
 f.settings.agent_response.mode='hidden';f.settings.rules.hide_meaning='skip-execution';throws(()=>p.validateConfig(f.settings),/hide must not suppress processing/);
});
test('wrong response prompt comment or turn blocks pairing',()=>{
 let f=fixture(),bad=clone(f.answer);bad.prompt_comment_id=199;
 throws(()=>p.pairRecord(f.prompt,{id:102,body:JSON.stringify(bad)},1),/comment ID mismatch/);
 bad=clone(f.answer);bad.turn=2;
 throws(()=>p.pairRecord(f.prompt,{id:102,body:JSON.stringify(bad)},1),/turn does not match/);
 bad=clone(f.answer);bad.prompt_analysis_ref='random';
 throws(()=>p.pairRecord(f.prompt,{id:102,body:JSON.stringify(bad)},1),/analysis ref/);
});
test('prompt metadata must faithfully preserve original user prompt and enums',()=>{
 const f=fixture(),bad=clone(f.analysis);bad.verbatim_user_prompt='altered';
 throws(()=>p.promptParts({id:101,body:p.upsertBlock('Use issue 5 instead','analysis',bad)}),/verbatim prompt mismatch/);
 bad.verbatim_user_prompt='Use issue 5 instead';bad.mood='certainly furious';
 throws(()=>p.promptParts({id:101,body:p.upsertBlock('Use issue 5 instead','analysis',bad)}),/mood enum/);
});
test('bot-only projection regions cannot be modified by user',()=>{
 const f=fixture(),out=p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 const tampered=out.updatedAgent.replace('"action": "display"','"action": "hide"');
 throws(()=>p.verifyBotOwnership(out.updatedAgent,tampered),/bot-owned/);
 assert.equal(p.verifyBotOwnership(out.updatedAgent,out.updatedAgent),true);
});
test('changing Issue5 source after pairing blocks projection as stale',()=>{
 const f=fixture(),bad={id:f.agent.id,body:f.agent.body.replace('Issue #5 replaces','New claim replaces')};
 throws(()=>p.buildProjections({promptComment:f.prompt,agentComment:bad,issue7Comment:f.issue7,config:f.settings}),/sources changed/);
});
test('second-run source digest, revision, schema and value must be verified',()=>{
 const f=fixture(),ret=clone(f.second);
 ret.pair_digest='0'.repeat(64);throws(()=>p.validateSecondReturn(ret,f.pair),/stale second-run/);
 ret.pair_digest=f.second.pair_digest;ret.pair_revision=123;throws(()=>p.validateSecondReturn(ret,f.pair),/turn\/revision mismatch/);
 ret.pair_revision=0;ret.projection_return_schema.additionalProperties=true;
 throws(()=>p.validateSecondReturn(ret,f.pair),/outside approved contract/);
});
test('second-run conflicting uncertain rearticulation blocks final projection',()=>{
 const f=fixture();f.second.projection_return.fidelity='requires_review';
 throws(()=>p.validateSecondReturn(f.second,f.pair),/block final projection/);
 const issue7={id:701,body:p.issue7Body(f.pair,f.second)};
 throws(()=>p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:issue7,config:f.settings}),/block final projection/);
});
test('unanswered Issue7 second-run prevents projection',()=>{
 const f=fixture(),issue7={id:701,body:p.issue7Body(f.pair)};
 throws(()=>p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:issue7,config:f.settings}),/missing schema/);
});
test('invalid Issue5 agent raw response is rejected',()=>{
 const f=fixture();const bad={...f.answer,foo:'extra'};
 throws(()=>p.answerParts({id:102,body:JSON.stringify(bad)}),/unexpected foo/);
 bad.foo=undefined;delete bad.foo;bad.status='success';
 throws(()=>p.answerParts({id:102,body:JSON.stringify(bad)}),/invalid agent status/);
});
test('reserved markers and duplicated bot blocks are rejected',()=>{
 const f=fixture(),tag=p.tagBlock('projection',{hello:1});
 throws(()=>p.findBlock(tag+'\n'+tag,'projection'),/duplicate projection region/);
 throws(()=>p.promptParts({id:101,body:'ISSUESTACK5_X\n\n'+p.tagBlock('analysis',f.analysis)}),/reserved marker/);
});
test('projection does not mutate source JSON objects/config or Issue7 record',()=>{
 const f=fixture('json','hidden'),before=JSON.stringify(f);
 p.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 assert.equal(JSON.stringify(f),before);
});
test('verbatim user prompt preserves trailing spaces and newlines through metadata and projection tags',()=>{
 const verbatim='Text with trailing spaces  \n\n';
 const original={date:'2026-10-25',time:'22:50:00-07:00',verbatim_user_prompt:verbatim,
 salient_surrounding_context:'test',explicit_meaning:'test',implicit_meaning:'unknown',tone:'neutral',mood:'unknown'};
 const before=p.upsertBlock(verbatim,'analysis',original);
 const projected=p.upsertBlock(before,'projection',{schema:p.SCHEMAS.projection});
 const parts=p.promptParts({id:999,body:projected});
 assert.equal(parts.prompt,verbatim);
 assert.equal(p.sourceBody(projected),before);
});
