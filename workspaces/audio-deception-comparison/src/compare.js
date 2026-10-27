import {spawnSync} from 'node:child_process';
import {writeFileSync, mkdirSync, statSync} from 'node:fs';
import {resolve, basename, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeReport} from './report.js';

const pythonAdapter = fileURLToPath(new URL('./model_adapter.py', import.meta.url));

export function invokeAdapter(file, {python='python3',modelDir='/opt/models',adapter=pythonAdapter}={}) {
  const p=spawnSync(python,[adapter,file],{
    encoding:'utf8',timeout:120000,maxBuffer:1048576
  });
  if(p.error||p.status!==0) return {model:'sangambhamare/TruthDetection',
    status:'error',reason:String(p.error||p.stderr||('adapter exited '+p.status))};
  try {
    const output=JSON.parse(p.stdout);
    if(!output || output.model!=='sangambhamare/TruthDetection' || typeof output.status!=='string') throw Error('Invalid model result');
    return output;
  } catch {
    return {model:'sangambhamare/TruthDetection',status:'error',reason:'invalid adapter JSON'};
  }
}

export function run(input, options={}) {
  const location=resolve(input);
  if(!statSync(location).isFile()) throw Error('Audio input must be a file');
  return makeReport({input:basename(location),model:invokeAdapter(location, options)});
}

function main() {
  const [input,output,...rest]=process.argv.slice(2);
  if(!input||!output) throw Error('Usage: node src/compare.js INPUT.wav OUTPUT.json [--model-dir DIRECTORY]');
  if(rest.length!==0 && (rest.length!==2 || rest[0]!=='--model-dir')) throw Error('Invalid arguments');
  const result=run(input,{modelDir:rest.length===2?rest[1]:(process.env.MODEL_DIR||'/opt/models')});
  mkdirSync(dirname(resolve(output)),{recursive:true});
  writeFileSync(resolve(output),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({output,modelStatus:result.models.truthDetection.status}));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main()}catch(error){console.error(String(error));process.exitCode=1}
}
