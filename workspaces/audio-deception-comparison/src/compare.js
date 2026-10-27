import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,basename,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeReport} from './report.js';

const adapterDefault = resolve(dirname(fileURLToPath(import.meta.url)), 'model_adapter.py');

export function invokeAdapter(file, {python='python3',adapter=adapterDefault}={}) {
  const p=spawnSync(python,[adapter,file],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if(p.error) return {status:'error',model:'sangambhamare/TruthDetection',reason:String(p.error),score:null,label:null};
  if(p.status!==0) return {status:'error',model:'sangambhamare/TruthDetection',reason:(p.stderr||'adapter exited '+p.status).slice(0,1500),score:null,label:null};
  try {
    const result=JSON.parse(p.stdout);
    if (!result || typeof result!=='object' || Array.isArray(result) || typeof result.status!=='string') {
      throw Error('expected structured status object');
    }
    return result;
  } catch {return {status:'error',model:'sangambhamare/TruthDetection',reason:'invalid adapter JSON',score:null,label:null};}
}

export function run(file, options={}) {
  if (!file) throw Error('An audio WAV path is required');
  const input=resolve(file);
  if(!input.toLowerCase().endsWith('.wav')) throw Error('Audio input must be a WAV file');
  if(!statSync(input).isFile()) throw Error('Audio input must be a file');
  const truth=invokeAdapter(input,options);
  return makeReport({input:basename(input),truth});
}

const main=process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
  try{
    const input=process.argv[2],output=process.argv[3];
    if(!input||!output)throw Error('Usage: node src/compare.js /data/input/sample.wav /data/output/report.json');
    const report=run(input);
    mkdirSync(dirname(resolve(output)),{recursive:true});
    writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({output,status:report.models.truthDetection.status,comparison:report.comparison.status}));
  }catch(e){console.error(String(e));process.exitCode=1;}
}
