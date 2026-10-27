import test from 'node:test';
import assert from 'node:assert/strict';
import {makeReport} from '../src/report.js';
import {invokeAdapter} from '../src/compare.js';
test('missing visual modalities do not produce fabricated agreement',()=>{
 const report=makeReport({input:'fixture.wav',truth:{status:'ok',label:'True Story'},lie:{status:'unsupported_missing_modalities',label:null}});
 assert.equal(report.comparison.agreement,null);
 assert.equal(report.comparison.status,'insufficient_modalities_or_model_unavailable');
});
test('same labels are comparable only when both adapters actually succeeded',()=>{
 const report=makeReport({input:'fixture.wav',truth:{status:'ok',label:'True Story'},lie:{status:'ok',label:'True Story'}});
 assert.equal(report.comparison.agreement,true);
});
test('adapter launch errors are structured rather than false predictions',()=>{
 const result=invokeAdapter('/nonexistent.wav',{python:'/nonexistent/python'});
 assert.equal(result.status,'error');
});
