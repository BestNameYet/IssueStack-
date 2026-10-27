import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makeReport} from '../src/report.js';
import {invokeAdapter,run} from '../src/compare.js';

test('report includes only the configured audio-only model',()=>{
  const report=makeReport({input:'fixture.wav',truth:{status:'ok',model:'sangambhamare/TruthDetection',label:'True Story',score:null}});
  assert.deepEqual(Object.keys(report.models),['truthDetection']);
  assert.equal(report.input.kind,'audio');
  assert.equal(report.comparison.status,'not_applicable_single_model');
  assert.equal(report.comparison.agreement,null);
});
test('one classifier is not represented as a two-model agreement',()=>{
  for(const label of ['True Story','Deceptive Story']){
    const report=makeReport({input:'fixture.wav',truth:{status:'ok',label}});
    assert.equal(report.comparison.agreement,null);
  }
});
test('unavailable weights produce a status, not a fabricated second prediction',()=>{
  const report=makeReport({input:'fixture.wav',truth:{status:'model_not_installed',label:null}});
  assert.equal(report.models.truthDetection.status,'model_not_installed');
  assert.equal(Object.keys(report.models).length,1);
});
test('adapter launch errors are structured rather than false predictions',()=>{
  const result=invokeAdapter('/nonexistent.wav',{python:'/nonexistent/python'});
  assert.equal(result.status,'error');
  assert.equal(result.label,null);
});
test('invalid adapter JSON is reported as an error',()=>{
  const result=invokeAdapter('/nonexistent.wav',{python:process.execPath,adapter:process.execPath});
  assert.equal(result.status,'error');
});
test('only audio WAV files are accepted by CLI orchestration',()=>{
  const dir=mkdtempSync(join(tmpdir(),'issuestack-audio-'));
  try {
    const wav=join(dir,'sample.wav'),wrong=join(dir,'sample.mp4');
    writeFileSync(wav,'RIFF\0\0\0\0WAVE');writeFileSync(wrong,'not wav');
    assert.throws(()=>run(wrong),/WAV/);
    const report=run(wav,{python:'/missing/python'});
    assert.deepEqual(Object.keys(report.models),['truthDetection']);
    assert.equal(report.comparison.agreement,null);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
