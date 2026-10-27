#!/usr/bin/env python3
"""Batch pinned TruthDetection inference, intended only for restricted offline Docker run.
Requires ALLOW_TRUSTED_MODEL_LOAD=1 and adapter's exact hash validation.
"""
import csv, hashlib, json, os, sys
from pathlib import Path
sys.path.insert(0,'/app/src')
import model_adapter

def sha(path):
    with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def main():
    if len(sys.argv)!=4:raise ValueError('usage: batch_truthdetection.py MANIFEST_CSV WAV_DIRECTORY OUTPUT_JSONL')
    manifest,wav_dir,dest=Path(sys.argv[1]),Path(sys.argv[2]),Path(sys.argv[3]);dest.parent.mkdir(parents=True,exist_ok=True)
    with manifest.open(encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f))
    outcome=[]
    for row in rows:
        id=row['sha256_media_id']
        if row['prior_23']=='yes':continue
        if row['prior_23']!='no':raise ValueError('Unknown exclusion flag')
        p=wav_dir/(id+'.wav')
        if not p.exists():raise FileNotFoundError(str(p))
        res={'sha256':id,'wav_sha256':sha(p),'original_filename':row['original_filename'],
             'source_sha256':id,'speech_screen':row['speech_presence_screen'],
             'model':model_adapter.REPO,'revision':model_adapter.REVISION,
             'model_artifact_sha256':model_adapter.EXPECTED_SHA256,
             'score':None,'label':None,'raw_prediction':None,
             'status':'not_run','note':'Per-recording computer category, not a factual determination.'}
        if row['speech_presence_screen']!='speech_likely':
            res['status']='needs_human_speech_check'
        else:
            pred=model_adapter.predict(str(p))
            res.update({key:pred.get(key) for key in ['status','label','raw_prediction','reason'] if key in pred})
        outcome.append(res)
        # Maintain append-only partial progress even on interruption
        with dest.open('w',encoding='utf-8') as stream:
            for result in outcome:stream.write(json.dumps(result,sort_keys=True)+'\n')
        print(f"{len(outcome)}/87 : {id[:12]} : {res['status']}",flush=True)
    if len(outcome)!=87:raise RuntimeError('Expected exactly 87 additional files')
if __name__=='__main__':main()