#!/usr/bin/env python3
"""Recover 98 source-linked event records from the committed contextual Markdown report.
This imports no audio and does not invent speech. Field names agree with complete_audio.py.
"""
import re, json, argparse
from datetime import datetime
from pathlib import Path

def parse_text(text):
    chunks=re.split(r'(?=^## 20\d{2}-\d{2}-\d{2}T)',text,flags=re.M)
    records=[]
    for chunk in chunks:
        m=re.match(r'^## ([^\n]+) — ([^\n]+?) to ([^\n]*)\n',chunk)
        if not m:continue
        date,speaker,partner=m.groups()
        def field(label):
            x=re.search(r'^\*\*'+re.escape(label)+r':\*\*\s*`([^`]+)`',chunk,re.M)
            if not x:raise ValueError('Missing '+label+' in '+date)
            return x.group(1)
        original=field('Original audio');source=field('Deduplicated filename');wav=field('WAV');conversation=field('Source conversation')
        key=source.rsplit('.',1)[0]
        def parse_neighbors(segment):
            notes=[]
            rg=r'^- \*\*(.*?) · ([^*]+)\*\* \(([+-]?[\d.]+) min\): (.*)$'
            for match in re.finditer(rg,segment,re.M):
                who,when,delta,msg=match.groups()
                notes.append({'speaker':who,'time':when,'minutes_from_recording':float(delta),'text':msg})
            return notes
        before_section=re.search(r'### Messages before this recording\n(.*?)\n### What the speaker said',chunk,re.S)
        after_section=re.search(r'### Messages after this recording\n(.*?)(?:\n\*\*Contextual status:|\Z)',chunk,re.S)
        if not before_section or not after_section:raise ValueError('Missing neighbors '+date)
        before=parse_neighbors(before_section.group(1));after=parse_neighbors(after_section.group(1))
        transcript_section=re.search(r'### What the speaker said\n(.*?)\n### Messages after this recording',chunk,re.S)
        if not transcript_section:raise ValueError('Missing transcript section '+date)
        content=transcript_section.group(1)
        q=re.findall(r'^> ?(.*)$',content,re.M)
        transcript='\n'.join(q).strip() or None
        ms=int(round(datetime.fromisoformat(date).timestamp()*1000))
        records.append({'id':key[:16]+'-'+str(ms), 'audio_filename':source,
                'original_filename':original,'wav_filename':wav,'wav_relpath':'wav_16khz_mono/'+wav,
                'source_path':'media/'+source,'conversation':conversation,'timestamp_pacific':date,
                'speaker':speaker,'conversation_partner':partner,
                'existing_transcript':transcript,'transcription_status':'existing_unverified_asr' if transcript else 'needs_asr',
                'immediately_prior_messages':before,'immediately_following_messages':after})
    if len(records)!=98:raise ValueError(f'Expected 98 audio events, parsed {len(records)}')
    if len({r['source_path'] for r in records})!=87:raise ValueError('Expected 87 unique additional audio files')
    return records

def main():
    p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('out');a=p.parse_args()
    records=parse_text(Path(a.report).read_text(encoding='utf-8'))
    out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in records),encoding='utf-8')
    print(json.dumps({'events':len(records),'unique_audio_files':len(set(r['source_path'] for r in records))}))
if __name__=='__main__':main()