import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {invokeAdapter,run} from '../src/compare.js';
import {makeReport} from '../src/report.js';

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'audio-compare-'));
  const wav=join(dir,'sample.wav');
  writeFileSync(wav,Buffer.from('RIFF fake fixture'));
  return {dir,wav};
}
test('never includes a model requiring visual data',()=>{
  const report=makeReport({input:'sample.wav',model:{status:'model_not_installed',model:'sangambhamare/TruthDetection'}});
  assert.deepEqual(Object.keys(report.models),['truthDetection']);
  assert.equal(report.comparison.agreement,null);
  assert.equal(report.comparison.status,'not_applicable_single_model');
});
test('missing Python yields explicit error',()=>{
  assert.equal(invokeAdapter('/not-there.wav',{python:'/no-such-python'}).status,'error');
});
test('audio-only CLI writes a report without model weights',()=>{
  const f=fixture();
  try {
    const output=join(f.dir,'out.json');
    const p=spawnSync('node',['src/compare.js',f.wav,output],{encoding:'utf8'});
    assert.equal(p.status,0,p.stderr);
    const report=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(report.schema,'issuestack.audio-deception-comparison.v2');
    assert.deepEqual(Object.keys(report.models),['truthDetection']);
    assert.ok(['model_not_installed','model_load_not_authorized','error'].includes(report.models.truthDetection.status));
  } finally {rmSync(f.dir,{recursive:true,force:true})}
});
test('missing audio fails nonzero',()=>{
  const p=spawnSync('node',['src/compare.js','/no/such.wav','/tmp/out.json'],{encoding:'utf8'});
  assert.notEqual(p.status,0);
});
test('adapter errors cannot masquerade as predictions',()=>{
  const f=fixture();
  try{
    const report=run(f.wav,{python:'/no-such-python'});
    assert.equal(report.models.truthDetection.status,'error');
    assert.equal(report.comparison.agreement,null);
  } finally{rmSync(f.dir,{recursive:true,force:true})}
});
