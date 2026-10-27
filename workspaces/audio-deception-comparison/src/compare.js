import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,basename,dirname} from 'node:path';
import {makeReport} from './report.js';

export function invokeAdapter(file, {python='python3',adapter=resolve('src/model_adapter.py')}={}) {
  const p=spawnSync(python,[adapter,file],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if(p.error) return {status:'error',reason:String(p.error)};
  if(p.status!==0) return {status:'error',reason:(p.stderr||'adapter exited '+p.status).slice(0,1500)};
  try {return JSON.parse(p.stdout);} catch {return {status:'error',reason:'invalid adapter JSON'};}
}
export function run(file, options={}) {
  const input=resolve(file);
  if(!statSync(input).isFile())throw Error('Audio input must be a file');
  const truth=invokeAdapter(input,options);
  const lie={status:'unsupported_missing_modalities',model:'sato2ru/lie-to-me-detector',reason:'Model expects face, body, voice and linguistic feature columns; audio alone cannot populate required feature vector.',score:null,label:null};
  return makeReport({input:basename(input),truth,lie});
}
if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  try{
    const input=process.argv[2],output=process.argv[3];
    if(!input||!output)throw Error('Usage: node src/compare.js /data/input/sample.wav /data/output/report.json');
    const report=run(input);
    mkdirSync(dirname(resolve(output)),{recursive:true});
    writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({output,status:report.comparison.status}));
  }catch(e){console.error(String(e));process.exitCode=1;}
}
