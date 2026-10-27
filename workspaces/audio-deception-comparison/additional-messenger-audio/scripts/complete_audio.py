#!/usr/bin/env python3
"""IssueStack additional-audio job: immutable source audit, *additional only* WAV, ASR and evidence report.

No input inference claims factual veracity. Model predictions are acquired separately
by the existing checksum-verified TruthDetection Docker image.
"""
import argparse, csv, hashlib, json, os, subprocess, sys, wave, zipfile, tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ARCHIVE_SHA256='5021c790220f24d8011e63fc404cc6ede0ebb5233ac4fecfe206bef303b579e5'
EXPECTED_PRIOR=23
EXPECTED_NEW=87
EXPECTED_EVENTS=98
EXPECTED_MISSING=57

def digest_file(path):
    with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def write_jsonl(path,rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w',encoding='utf-8') as f:
        for row in rows:f.write(json.dumps(row, ensure_ascii=False, sort_keys=True)+'\n')

def load_jsonl(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]

def load_manifest(path):
    with path.open('r',encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def sha_from_row(row):return row['sha256_media_id']

def wav_ok(path):
    with wave.open(str(path),'rb') as w:
        if (w.getnchannels(), w.getsampwidth(), w.getframerate())!=(1,2,16000):
            raise ValueError('WAV not signed 16-bit PCM 16k mono: '+str(path))
        if w.getnframes()==0:raise ValueError('empty WAV: '+str(path))
        return round(w.getnframes()/w.getframerate(),3)

def audit(args):
    manifest=load_manifest(Path(args.manifest))
    events=load_jsonl(Path(args.events))
    if len(manifest)!=EXPECTED_PRIOR+EXPECTED_NEW:raise ValueError('manifest file count mismatch')
    if len(events)!=EXPECTED_EVENTS:raise ValueError('event count mismatch')
    if len({r['sha256_media_id'] for r in manifest})!=len(manifest):raise ValueError('duplicate media hashes')
    if digest_file(args.archive)!=ARCHIVE_SHA256:raise ValueError('merged archive SHA-256 mismatch')
    z=zipfile.ZipFile(args.archive)
    archive_names=set(z.namelist())
    excluded=[];converted=[];issues=[]
    wav_dir=Path(args.wav_dir)
    wav_dir.mkdir(parents=True,exist_ok=True)
    for r in manifest:
        key=sha_from_row(r);p=r['original_media_path']
        if p not in archive_names:raise ValueError('missing media '+p)
        if hashlib.sha256(z.read(p)).hexdigest()!=key:raise ValueError('original media digest mismatch '+p)
        if r['prior_23']=='yes':
            excluded.append(key)
            if r['wav_relpath']:raise ValueError('prior-23 WAV path in manifest: '+key)
            continue
        if r['prior_23']!='no':raise ValueError('unknown prior flag')
        wav=wav_dir/(key+'.wav')
        if not wav.exists():
            if args.no_convert:raise FileNotFoundError(str(wav))
            # Conversion deliberately limited to the 87 previously unscored sources.
            # MP4's index can be at the end; FFmpeg may need a seekable file.
            # Use an isolated temp file rather than piping the compressed media.
            with tempfile.TemporaryDirectory(prefix='audio-source-') as tmp:
                source=Path(tmp)/('original'+Path(p).suffix)
                source.write_bytes(z.read(p))
                cmd=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',str(source),
                     '-map','0:a:0','-vn','-ac','1','-ar','16000','-acodec','pcm_s16le',str(wav)]
                proc=subprocess.run(cmd,capture_output=True,timeout=120)
                if proc.returncode:raise RuntimeError('ffmpeg failed on '+p+': '+proc.stderr.decode(errors='replace')[-600:])
        actual_dur=wav_ok(wav)
        if abs(actual_dur-float(r['duration_sec']))>0.2:issues.append('duration delta '+key)
        converted.append({'sha256':key,'source_path':p,'wav_file':wav.name,'wav_sha256':digest_file(wav),
             'duration_seconds':actual_dur,'speech_screen':r['speech_presence_screen'],
             'transcript_status':r['transcript_status'],'source_sha256_verified':True})
    if len(excluded)!=EXPECTED_PRIOR or len(converted)!=EXPECTED_NEW:
        raise ValueError('exclusion/conversion counts mismatch')
    all_valid={r['sha256'] for r in converted}
    if not all(e['source_path'].split('/')[1].split('.')[0] in all_valid for e in events):
        raise ValueError('event media not contained in 87')
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    audit={"schema":"issuestack.additional-audio.audit.v1", "release_zip_sha256":ARCHIVE_SHA256,
        "recordings_total":len(manifest),"previously_evaluated_excluded":len(excluded),
        "new_wavs_verified":len(converted),"additional_events":len(events),
        "missing_transcripts":sum(r['transcript_status']=='needs_transcription' for r in manifest if r['prior_23']=='no'),
        "warnings":issues,"evaluated":False,
        "excluded_sha256":sorted(excluded)}
    (out/'audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    write_jsonl(out/'source_wavs.jsonl',converted)
    print(json.dumps({k:v for k,v in audit.items() if k!='excluded_sha256'}))
    return audit

def transcribe(args):
    manifest=load_manifest(Path(args.manifest))
    out=Path(args.out);out.mkdir(parents=True, exist_ok=True)
    pending=[r for r in manifest if r['prior_23']=='no' and r['transcript_status']=='needs_transcription']
    if len(pending)!=EXPECTED_MISSING:raise ValueError('unexpected pending count '+str(len(pending)))
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError('faster-whisper not installed, no ASR run performed') from exc
    model=WhisperModel(args.asr_model, device='cpu', compute_type='int8', cpu_threads=max(1,args.cpu_threads))
    output=[]
    for i,r in enumerate(pending,1):
        key=sha_from_row(r)
        wav=Path(args.wav_dir)/(key+'.wav')
        if not wav.exists():raise FileNotFoundError(str(wav))
        detected=r['speech_presence_screen']
        result={'sha256':key,'original_filename':r['original_filename'],'wav_filename':wav.name,
                'asr_model':args.asr_model,'asr_tool':'faster-whisper','wav_sha256':digest_file(wav),
                'speech_screen':detected, 'text':'','segments':[],'transcription_status':'pending','language':None}
        try:
            segments,info=model.transcribe(str(wav), beam_size=5, language='en', vad_filter=True, condition_on_previous_text=False)
            segments=list(segments)
            result['segments']=[{'start':round(seg.start,3),'end':round(seg.end,3),
               'text':seg.text.strip(),'avg_logprob':seg.avg_logprob,'no_speech_prob':seg.no_speech_prob} for seg in segments]
            result['text']=' '.join(seg.text.strip() for seg in segments).strip()
            result['language']=info.language
            result['transcription_status']='asr_unverified' if result['text'] else 'no_speech_transcribed_review'
        except Exception as exc:
            result['transcription_status']='asr_error'
            result['error']=type(exc).__name__+': '+str(exc)[:250]
        output.append(result)
        # persist successes even if CI is interrupted
        write_jsonl(out/'transcription_results.jsonl',output)
        print(f"transcribed {i}/{len(pending)}: {key[:12]} status={result['transcription_status']}",flush=True)
    return output

def aggregate(args):
    manifest=load_manifest(Path(args.manifest))
    events=load_jsonl(Path(args.events))
    asr_path=Path(args.out)/'transcription_results.jsonl'
    asr={r['sha256']:r for r in (load_jsonl(asr_path) if asr_path.is_file() else [])}
    pred_path=Path(args.out)/'truthdetection_results.jsonl'
    preds={r['sha256']:r for r in (load_jsonl(pred_path) if pred_path.is_file() else [])}
    by_hash=defaultdict(list)
    for event in events:by_hash[event['source_path'].split('/')[1].split('.')[0]].append(event)
    output=[]
    for row in manifest:
        if row['prior_23']=='yes':continue
        key=sha_from_row(row)
        linked=by_hash[key]
        if not linked:raise ValueError('unlinked WAV '+key)
        inherited=next((e.get('existing_transcript') for e in linked if e.get('existing_transcript')),None)
        status='inherited_unverified_asr' if inherited else 'needs_asr'
        text=inherited or ''
        if key in asr:
            status=asr[key]['transcription_status']
            text=asr[key].get('text','')
        pred=preds.get(key)
        outcome=(pred.get('label') if pred and pred.get('status')=='ok' else None)
        output.append({
          'sha256':key,'original_filename':row['original_filename'], 'wav_filename':key+'.wav',
          'duration_seconds':float(row['duration_sec']),'transcription_status':status,
          'transcript':text,'transcript_verified':False,
          'truthdetection_status':pred['status'] if pred else 'not_run',
          'truthdetection_label':outcome,
          'truthdetection_raw_prediction':pred.get('raw_prediction') if pred else None,
          'model_revision':pred.get('revision') if pred else None,
          'speech_screen':row['speech_presence_screen'],
          'message_events':[{'event_id':e['id'],'date':e['timestamp_pacific'],'speaker':e['speaker'],
             'conversation':e['conversation'],'before':e['immediately_prior_messages'],
             'after':e['immediately_following_messages']} for e in linked]
        })
    if len(output)!=EXPECTED_NEW:raise ValueError('output file count mismatch')
    out=Path(args.out);write_jsonl(out/'contextual_evaluation_records.jsonl',output)
    ct=Counter(x['truthdetection_status'] for x in output)
    ts=Counter(x['transcription_status'] for x in output)
    summary={'unique_recordings':len(output),'additional_message_events':sum(len(x['message_events']) for x in output),
             'transcription_status':dict(ts),'truthdetection_status':dict(ct),
             'truthdetection_counts':dict(Counter(x['truthdetection_label'] for x in output if x['truthdetection_label'])),
             'prior_review_recordings_processed':0,
             'note':'Classifier output describes per-recording computer categories, not established truth.'}
    (out/'completion_summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    lines=['# Additional Messenger audio — completion evidence','',
      '## Coverage',f"- **{len(output)}** additional audio files, **{summary['additional_message_events']}** audio message events",
      f"- Prior 23 analyzed recordings: **excluded from this run**",'',
      '## Transcription status',*[f'- {k}: {v}' for k,v in ts.items()],'',
      '## TruthDetection status',*[f'- {k}: {v}' for k,v in ct.items()],'',
      '## Chronological recording index','']
    for j,x in enumerate(sorted(output,key=lambda a:min(e['date'] for e in a['message_events'])),1):
        e=min(x['message_events'],key=lambda y:y['date'])
        lines += [f"### {j:02d} · {e['date']} · {e['speaker']}",
            f"Audio: `{x['original_filename']}` · WAV: `{x['wav_filename']}`",
            f"Conversation: `{e['conversation']}` · Additional events: {len(x['message_events'])}",
            f"Transcript status: `{x['transcription_status']}` · TruthDetection: `{x['truthdetection_status']}`"+
            (f" · {x['truthdetection_label']}" if x['truthdetection_label'] else ''),'',
            'Spoken excerpt (*unverified ASR*): '+((x['transcript'][:320]+'…') if len(x['transcript'])>320 else x['transcript'] or '[no verified speech transcript]'),'',
            'Nearby conversation (*context, not spoken audio*):']
        for n in (e['before'][-2:]+e['after'][:2]):
            lines.append(f"- {n['speaker']} ({n['minutes_from_recording']:+g} min): {n['text'][:210]}")
        lines.append('')
    (out/'contextual_completion_report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps(summary))

def main():
 p=argparse.ArgumentParser()
 p.add_argument('command', choices=['audit','transcribe','aggregate'])
 p.add_argument('--archive',type=Path)
 p.add_argument('--manifest',type=Path,required=True)
 p.add_argument('--events',type=Path)
 p.add_argument('--wav-dir',type=Path)
 p.add_argument('--out',type=Path,required=True)
 p.add_argument('--no-convert',action='store_true')
 p.add_argument('--asr-model',default='base.en')
 p.add_argument('--cpu-threads',type=int,default=4)
 a=p.parse_args()
 if a.command=='audit':
  if not a.archive or not a.wav_dir or not a.events: p.error('audit requires --archive, --events and --wav-dir')
  audit(a)
 elif a.command=='transcribe':
  if not a.wav_dir:p.error('transcribe requires --wav-dir')
  transcribe(a)
 else:
  if not a.events:p.error('aggregate requires --events')
  aggregate(a)

if __name__=='__main__':main()