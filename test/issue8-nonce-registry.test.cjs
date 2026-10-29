'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW = path.join(__dirname, '..', '.github', 'workflows', 'issue8-nonce-registry.yml');
const content = fs.readFileSync(WORKFLOW, 'utf8');
const lines = content.split(/\r?\n/);
const scriptLine = lines.findIndex(line => line.trim() === 'script: |');
assert.ok(scriptLine >= 0, 'actions/github-script block must exist');
const program = lines.slice(scriptLine + 1).map(line => line.startsWith('            ') ? line.slice(12) : line).join('\n');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const execute = new AsyncFunction('context', 'github', 'core', 'Buffer', program);

const A = {nonce:'alpha',name:'Test Alpha',current_tasks:['task1'],completed_tasks:[],trust_level:'limited'};
const B = {nonce:'bravo',name:'Test Bravo',current_tasks:[],completed_tasks:['done'],trust_level:'untrusted'};
const botStart = '<!-- ISSUESTACK_NONCE_BOT_START -->';
const botEnd = '<!-- ISSUESTACK_NONCE_BOT_END -->';
const tableStart = '<!-- ISSUESTACK_NONCE_TABLE_START -->';
const tableEnd = '<!-- ISSUESTACK_NONCE_TABLE_END -->';
const jsonStart = '<!-- ISSUESTACK_NONCE_AGENT_JSON_START -->';
const jsonEnd = '<!-- ISSUESTACK_NONCE_AGENT_JSON_END -->';
function fixture(records) {
  const data = typeof records === 'string' ? records : JSON.stringify(records, null, 2);
  return `${botStart}\nHEADER\n${tableStart}\nOLD TABLE\n${tableEnd}\nFOOTER\n${botEnd}\nInstructions\n${jsonStart}\n\`\`\`json\n${data}\n\`\`\`\n${jsonEnd}\n`;
}
async function run(initial, opts={}) {
  let body=initial, writes=0, reads=0, hijacked=false;
  let context={repo:{owner:'BestNameYet',repo:'IssueStack-'},eventName:'issue_comment',payload:{action:'edited',issue:{number:8},comment:{id:6453773625}}};
  if(opts.payload) Object.assign(context.payload,opts.payload);
  if(opts.context) Object.assign(context,opts.context);
  const github={rest:{issues:{
    async getComment() {
      reads++;
      if(opts.injectBeforeRead && reads === opts.injectBeforeRead.at) {
        body=opts.injectBeforeRead.body;
      }
      return {data:{body}};
    },
    async updateComment({body:replacement}) {
      writes++;
      if(opts.injectConcurrent && !hijacked) {hijacked=true; body=opts.injectConcurrent;}
      body=replacement;
    }
  }}};
  try {await execute(context,github,{info(){}},Buffer);return {ok:true,writes,reads,body};}
  catch(error) {return {ok:false,writes,reads,body,error:String(error.message)};}
}
function valid(name,make,check=(r)=>r.ok) {test(name,async()=>assert.ok(check(await run(make()))));}
valid('valid single agent accepted',()=>fixture([A]),r=>r.ok&&r.writes===1);
test('idempotent replay does not write',async()=>{
  let r=await run(fixture([A])); let replay=await run(r.body);
  assert.ok(r.ok && replay.ok && replay.writes===0);
});
valid('distinct nonce adds exactly one row',()=>fixture([A,B]),r=>r.ok&&r.body.match(/\| bravo \|/g)?.length===1);
valid('same nonce updates its only row',()=>fixture([{...A,current_tasks:['changed']},B]),r=>r.ok&&r.body.match(/\| alpha \|/g)?.length===1&&r.body.match(/\| bravo \|/g)?.length===1);
valid('duplicate nonce rejected',()=>fixture([A,{...A}]),r=>!r.ok&&r.writes===0);
valid('preserves input order',()=>fixture([B,A]),r=>r.ok&&r.body.indexOf('| bravo |')<r.body.indexOf('| alpha |'));
valid('preserves untrusted and limited levels',()=>fixture([A,B]),r=>r.ok&&r.body.includes('| untrusted |')&&r.body.includes('| limited |'));
valid('all five fields required, including trust',()=>fixture([{nonce:'x',name:'X',current_tasks:[],completed_tasks:[]}]),r=>!r.ok&&r.writes===0);
for (const field of ['nonce','name','current_tasks','completed_tasks']) {
  valid(`missing ${field} rejected`,()=>{let x={...A};delete x[field];return fixture([x]);},r=>!r.ok&&r.writes===0);
}
for (const [name,x] of [
  ['extra key', {...A,unknown:'x'}], ['null agent',null], ['array agent',[]],
  ['invalid enum',{...A,trust_level:'admin'}], ['numeric trust',{...A,trust_level:99}],
  ['nonce spaces',{...A,nonce:'bad nonce'}], ['nonce too long',{...A,nonce:'x'.repeat(129)}],
  ['name too long',{...A,name:'x'.repeat(81)}], ['blank name',{...A,name:'  '}],
  ['non-string task',{...A,current_tasks:[1]}],
  ['task string too long',{...A,current_tasks:['x'.repeat(301)]}],
  ['31 tasks',{...A,completed_tasks:Array(31).fill('x')}]
]) valid(`${name} rejected`,()=>fixture([x]),r=>!r.ok&&r.writes===0);
valid('101 agents rejected',()=>fixture(Array.from({length:101},(_,i)=>({...A,nonce:'agent'+i}))),r=>!r.ok&&r.writes===0);
valid('malformed JSON rejected',()=>fixture('not valid json'),r=>!r.ok&&r.writes===0);
valid('missing end marker rejected',()=>fixture([A]).replace(jsonEnd,''),r=>!r.ok&&r.writes===0);
valid('duplicate marker rejected',()=>fixture([A]).replace(jsonEnd,jsonEnd+'\n'+jsonEnd),r=>!r.ok&&r.writes===0);
// The wrong-issue test above checks fixture setup, while these three test event gates.
test('wrong issue event rejected',async()=>{let r=await run(fixture([A]),{payload:{issue:{number:7}}});assert.ok(!r.ok&&r.writes===0);});
test('wrong comment event rejected',async()=>{let r=await run(fixture([A]),{payload:{comment:{id:1}}});assert.ok(!r.ok&&r.writes===0);});
test('created event rejected',async()=>{let r=await run(fixture([A]),{payload:{action:'created'}});assert.ok(!r.ok&&r.writes===0);});
valid('duplicate task strings rejected',()=>fixture([{...A,current_tasks:['duplicate','duplicate']}]),r=>!r.ok&&r.writes===0);
test('stale input discovered at pre-write read aborts without mutation',async()=>{
  const revised=fixture([A,B]).replace('Instructions','CONCURRENT EDIT');
  const result=await run(fixture([A]),{injectBeforeRead:{at:2,body:revised}});
  assert.ok(!result.ok && result.writes===0 && result.body===revised);
});
// A concurrent edit made after the last read but during PATCH remains unsafe.
// This test must remain red until the storage architecture supplies true CAS.
test('concurrent stale write cannot clobber new input',async()=>{
  let intervening=fixture([A,B]).replace('Instructions','CONCURRENT EDIT');
  let r=await run(fixture([A]),{injectConcurrent:intervening});
  assert.ok((!r.ok&&r.writes===0)||r.body.includes('CONCURRENT EDIT'));
});
valid('preserves bot non-table content',()=>fixture([A]).replace('HEADER','HEADER untouched'),r=>r.ok&&r.body.includes('HEADER untouched'));
valid('preserves instructions outside agent input',()=>fixture([A]).replace('Instructions','Instructions untouched'),r=>r.ok&&r.body.includes('Instructions untouched'));
