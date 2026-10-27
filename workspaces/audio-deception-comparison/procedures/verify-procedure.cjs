'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const p = require('../../../src/procedure-documents.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const declaration = read('seven-recordings.v1.json');
const samples = read('examples.json');
const evidence = read('live-verification.json');
const ids = ['verify_sources','configure_review','align_transcripts','extract_claims','join_windows','review_findings','assemble_report','verify_delivery'];

test('eight ordered closed-schema steps validate on the current runtime', () => {
  assert.equal(p.validateDeclaration(declaration), null);
  assert.deepEqual(declaration.steps.map(x => x.id), ids);
  assert.ok(JSON.stringify(declaration).length < 60000);
  assert.deepEqual(samples.steps.map(x => x.step_id), ids);
  samples.steps.forEach((x,i) => assert.equal(p.validateValue(x.return_value,declaration.steps[i].returns),null,x.step_id));
});

test('nested missing, extra and wrong-type values are rejected for every step', () => {
  declaration.steps.forEach((step,i) => {
    const value = structuredClone(samples.steps[i].return_value);
    assert.notEqual(p.validateValue({...value,undeclared:true},step.returns),null);
    delete value[step.returns.required[0]];
    assert.notEqual(p.validateValue(value,step.returns),null);
    assert.notEqual(p.validateValue('wrong type',step.returns),null);
  });
  const wrong = structuredClone(samples.steps[0].return_value);
  wrong.records[0].recording='17';
  assert.match(p.validateValue(wrong,declaration.steps[0].returns),/integer/);
});

test('production instructions retain user gates, source reuse and deployment boundary', () => {
  for(const id of ['configure_review','review_findings']) {
    const step=declaration.steps.find(x=>x.id===id);
    assert.match(step.instruction,/USER STEP/);
    assert.match(step.instruction,/leave this step unanswered/);
    assert.ok(step.returns.required.includes('user_message'));
  }
  assert.match(declaration.steps[1].instruction,/deploy_site=false/);
  assert.match(declaration.steps[4].instruction,/positive interval overlap/);
  assert.match(declaration.steps[7].instruction,/does not itself close/);
});

test('live snapshots prove ordered transitions, rejection and history preservation', () => {
  const wanted=['wrong_type','valid_advance','stale_revision','duplicate_submission','protected_region','resume','finish'];
  assert.deepEqual(evidence.events.map(x=>x.test),wanted);
  for(const event of evidence.events) {
    const before=p.parseComment(event.before), after=p.parseComment(event.after);
    assert.equal(after.state.revision,event.expected_revision,event.test);
    assert.equal(event.passed,true);
    if(event.test==='protected_region') assert.equal(event.after,event.before);
    else if(event.expected_error) {
      assert.ok(after.state.last_error.includes(event.expected_error));
      assert.deepEqual(after.state.returns,before.state.returns);
    } else {
      assert.equal(after.state.last_error,null);
      assert.equal(after.state.revision,before.state.revision+1);
      assert.deepEqual(after.state.returns.slice(0,-1),before.state.returns);
    }
  }
  const final=p.parseComment(evidence.events.at(-1).after);
  assert.equal(final.bot.status,'complete');
  assert.equal(final.state.returns.length,3);
  assert.deepEqual(final.state.returns.map(x=>x.submission_id),['test-accepted-01','test-resume-02','test-finish-03']);
  assert.equal(evidence.replay.same_comment_id,true);
  assert.equal(evidence.replay.state_unchanged,true);
  assert.equal(evidence.replay.procedure_count,1);
  assert.equal(evidence.replay.queue_job_count,0);
});

test('source reconciliation return matches verified artifact identities and offsets', () => {
  const value=evidence.source_return;
  assert.equal(p.validateValue(value,declaration.steps[0].returns),null);
  assert.deepEqual(value.records.map(x=>x.recording),[17,18,19,20,21,22,23]);
  assert.equal(value.records.reduce((n,x)=>n+x.window_count,0),103);
  assert.equal(value.records.reduce((n,x)=>n+x.word_count,0),744);
  for(const row of value.records) assert.match(row.wav_sha256,/^[a-f0-9]{64}$/);
  assert.equal(value.source_identity_matched,true);
  assert.ok(value.follow_up.length > 0);
});

test('metadata covers every substantive package file with exact bytes', () => {
  const root=path.resolve(__dirname,'../../..');
  const metadata=JSON.parse(fs.readFileSync(path.join(root,'config/file-metadata.json'),'utf8'));
  for(const relative of [
    'workspaces/audio-deception-comparison/procedures/seven-recordings.v1.json',
    'workspaces/audio-deception-comparison/procedures/OPERATING.md',
    'workspaces/audio-deception-comparison/procedures/examples.json',
    'workspaces/audio-deception-comparison/procedures/verify-procedure.cjs',
    'workspaces/audio-deception-comparison/procedures/live-verification.json',
    '.github/workflows/verify-audio-procedure.yml'
  ]) {
    const entry=metadata.files.find(x=>x.path===relative);
    assert.ok(entry,relative);
    const bytes=fs.readFileSync(path.join(root,relative));
    assert.equal(entry.size_bytes,bytes.length,relative);
    assert.equal(entry.sha256,crypto.createHash('sha256').update(bytes).digest('hex'),relative);
  }
});
