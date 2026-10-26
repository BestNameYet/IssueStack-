'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const projection=require('./issue5-projection');
const presentation=require('./issue5-presentation');
const config=require('../config/issue5-rendering.json');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(mode='markdown'){
 const input='**Please** verify Issue #5';
 const analysis={date:'2026-10-26',time:'02:52:00-07:00',verbatim_user_prompt:input,
 salient_surrounding_context:'IssueStack projected UI',explicit_meaning:'Verify Issue 5',implicit_meaning:'A check is requested',tone:'directive',mood:'unknown'};
 const prompt={id:101,body:projection.upsertBlock(input,'analysis',analysis)};
 const answer={schema:projection.SCHEMAS.agent,role:'agent',turn:1,prompt_comment_id:101,prompt_analysis_ref:'issue5:101:prompt-analysis:v1',date:'2026-10-26',time:'02:53:00-07:00',status:'answered',message:'Original first-pass answer'};
 const agent={id:102,body:JSON.stringify(answer)};
 const pair=projection.pairRecord(prompt,agent,1);
 const second={schema:projection.SCHEMAS.second,turn:1,pair_revision:pair.revision,
 pair_digest:projection.pairDigest(pair),projection_return_schema:clone(projection.MESSAGE_RETURN_SCHEMA),
 projection_return:{message:'# Confirmed\n\n- **Second-pass** output\n- Verified',fidelity:'faithful'}};
 const issue7={id:701,body:projection.issue7Body(pair,second)};
 const settings=clone(config);settings.agent_response.mode=mode;
 return {prompt,agent,issue7,settings,analysis,answer,second};
}
test('validated two-pass result produces full tagged UI on original comment IDs',()=>{
 const f=fixture(),out=projection.buildProjections({promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings});
 const user=projection.readBlock(out.updatedPrompt,'projection'),agent=projection.readBlock(out.updatedAgent,'projection');
 assert.equal(user.schema,'issuestack.issue5.bot-projection.v2');assert.equal(agent.schema,user.schema);
 assert.equal(user.rules_schema,presentation.DEFAULT_RULES.schema);
 for(const p of [user,agent])assert.equal(p.render_markup_sha256,presentation.sha256(p.render_markup));
 assert.match(user.render_markup,/<box border radius="lg"/);
 assert.match(agent.render_markup,/<title size="sm">/);
 assert.match(agent.render_markup,/<list marker="bullet"/);
 assert.ok(agent.render_markup.includes(presentation.literal('Second-pass')));
 assert.ok(!agent.render_markup.includes('Original first-pass answer'));
 assert.equal(user.source_comment_id,101);assert.equal(agent.source_comment_id,102);
 assert.equal(user.issue7_comment_id,701);assert.equal(agent.issue7_comment_id,701);
 assert.equal(projection.sourceBody(out.updatedPrompt),f.prompt.body);
 assert.equal(projection.sourceBody(out.updatedAgent),f.agent.body);
});
test('JSON/Hidden support does not mutate source',()=>{
 const f=fixture('json'),args={promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings};
 const result=projection.buildProjections(args),agent=projection.readBlock(result.updatedAgent,'projection');
 assert.match(agent.render_markup,/preserveWhitespace/);
 assert.ok(agent.render_markup.includes(presentation.literal(JSON.stringify(f.second,null,2))));
 f.settings.agent_response.mode='hidden';
 const hidden=projection.readBlock(projection.buildProjections(args).updatedAgent,'projection');
 assert.equal(hidden.action,'hide');assert.equal(hidden.payload,null);assert.equal(hidden.render_markup,'');
 assert.equal(hidden.render_markup_sha256,presentation.sha256(''));
});
test('same paired inputs regenerate identical render markup',()=>{
 const f=fixture(),args={promptComment:f.prompt,agentComment:f.agent,issue7Comment:f.issue7,config:f.settings};
 assert.deepEqual(projection.buildProjections(args),projection.buildProjections(args));
});
