'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const p=require('./issue5-presentation');
const clone=x=>JSON.parse(JSON.stringify(x));
const src={verbatim_user_prompt:'Check status',explicit_meaning:'Inspect without mutation',implicit_meaning:'Expect a receipt',salient_surrounding_context:'IssueStack',tone:'directive',mood:'unknown',date:'2026-10-26',time:'02:51:00-07:00'};
test('complete ruleset passes strict schema',()=>assert.equal(p.validateRules(p.DEFAULT_RULES).target,'chatgpt-dil'));
test('unknown keys and untrusted features are rejected',()=>{
  for(const tweak of [r=>r.extra=1,r=>r.layout.auto_interactive_controls=true,r=>r.roles.user.fields.pop(),r=>r.security.literal_interpolation='raw-html',r=>r.security.allowed_tags.push('button'),r=>r.semantic_rules[0].render='button']){
    const r=clone(p.DEFAULT_RULES);tweak(r);assert.throws(()=>p.validateRules(r));
  }
});
test('bot creates complete mobile-friendly user UI with every field',()=>{
 const r=p.renderMarkup({role:'user',mode:'markdown',source:src});
 assert.match(r.markup,/^<col gap=\{3\}>/);assert.match(r.markup,/<box border radius="lg"/);
 for(const v of Object.values(src))assert.ok(r.markup.includes(p.literal(v)),v);
 assert.equal(r.sha256,p.sha256(r.markup));assert.equal(r.rules_schema,p.DEFAULT_RULES.schema);
});
test('bot formats headings lists blockquotes bold and code',()=>{
 const tick=String.fromCharCode(96);
 const r=p.renderMarkup({role:'agent',mode:'markdown',source:'# Heading\n\n- **Bold**\n- '+tick+'code'+tick+'\n\n> Quoted\n\n1. Ordered'});
 for(const token of ['<title','<list marker="bullet"','<list marker="number"','<blockquote>','<bold>','<code>'])assert.ok(r.markup.includes(token),token);
});
test('injected markup and commands remain inert',()=>{
 const evil='</text><button onClick={attack}>CLICK</button>{evil()}';
 const r=p.renderMarkup({role:'agent',mode:'markdown',source:evil});
 assert.doesNotMatch(r.markup,/<button/);assert.ok(r.markup.includes('\\u003c/button\\u003e'));
 assert.ok(r.markup.includes('\\u007bevil()\\u007d'));
});
test('JSON presentation preserves full source',()=>{
 const user=p.renderMarkup({role:'user',mode:'json',source:src});
 assert.match(user.markup,/preserveWhitespace/);
 assert.ok(user.markup.includes(p.literal(JSON.stringify(src,null,2))));
 const second={schema:'issuestack.issue7.second-run.v1',projection_return:{message:'Second',fidelity:'faithful'}};
 const agent=p.renderMarkup({role:'agent',mode:'json',source:second});
 assert.ok(agent.markup.includes(p.literal(JSON.stringify(second,null,2))));
});
test('hidden agent returns no visible markup but validates mode',()=>{
 const h=p.renderMarkup({role:'agent',mode:'hidden',source:'Stored'});
 assert.equal(h.markup,'');assert.equal(h.sha256,p.sha256(''));
 assert.throws(()=>p.renderMarkup({role:'user',mode:'hidden',source:src}));
});
test('overflow fails closed without truncation',()=>{
 assert.throws(()=>p.renderMarkup({role:'agent',mode:'markdown',source:'x'.repeat(20001)}),/exceeds safe render limit/);
 const rules=clone(p.DEFAULT_RULES);rules.security.max_markup_chars=30;
 assert.throws(()=>p.renderMarkup({role:'agent',mode:'markdown',source:'test',rules}),/exceeds safe output limit/);
});
test('table semantic tags and responsive box',()=>{
 const r=p.renderMarkup({role:'agent',mode:'markdown',source:'| Name | State |\n| --- | --- |\n| Intake | Passed |'});
 for(const t of ['<box scrollable>','<table dividers>','<table-row header>','<table-cell header>'])assert.ok(r.markup.includes(t),t);
});
test('unsupported markdown remains literal',()=>{
 const text='Visit [docs](https://example.org)';
 assert.ok(p.renderMarkup({role:'agent',mode:'markdown',source:text}).markup.includes(p.literal(text)));
});
test('deterministic output and no source mutation',()=>{
 const a=clone(src),before=JSON.stringify(a),one=p.renderMarkup({role:'user',mode:'markdown',source:a});
 assert.deepEqual(one,p.renderMarkup({role:'user',mode:'markdown',source:a}));
 assert.equal(JSON.stringify(a),before);
});
