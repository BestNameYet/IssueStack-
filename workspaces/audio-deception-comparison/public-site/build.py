"""Build the public Heather review from checked-in source and verified audio."""
import argparse,base64,hashlib,json,pathlib,re,shutil,subprocess
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]

def build(public_url,output):
    records=json.loads((HERE/'records.json').read_text())
    assert [r['n'] for r in records]==list(range(1,24))
    assert sum(r['label']=='True' for r in records)==9
    assert sum(r['label']=='Deceptive' for r in records)==14
    assert all(r['partner']=='Sam' for r in records[16:])
    assert [r['n'] for r in records[16:] if r['label']=='True']==[18]
    html=(HERE/'index.html').read_text()
    assert html.index('id="conclusion"')<html.index('id="recordings"')
    assert html.index('data-record="18"')<html.index('data-record="17"')
    for number,quote in re.findall(r'data-record="(\d+)" data-quote="([^"]*)"',html):
        assert quote in records[int(number)-1]['transcript'], number
    assert not re.search(r'<audio[^>]*autoplay',html)
    # Keep generated output confined to the workspace.
    output=output.resolve()
    assert output.is_relative_to(HERE) and output!=HERE
    output.mkdir(parents=True,exist_ok=True)
    (output/'audio').mkdir(exist_ok=True)
    receipts=[]
    for r in records:
        source=(ROOT/r['source_audio']).resolve()
        assert source.is_relative_to(ROOT/'workspaces/audio-deception-comparison')
        assert hashlib.sha256(source.read_bytes()).hexdigest()==r['source_sha256'], str(source)
        target=(output/r['audio']).resolve()
        assert target.is_relative_to(output/'audio')
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)
        duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(target)]))
        assert duration>0
        r['duration']=f'{int(duration)//60}:{int(duration)%60:02}'
        receipts.append({'recording':r['n'],'source_sha256':r['source_sha256'],'mp3_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'duration_seconds':duration})
    for name in ['style.css','app.js','transcripts.txt','icon.svg']:
        shutil.copyfile(HERE/name,output/name)
    if public_url:
        assert public_url.startswith('https://')
    (output/'index.html').write_text(html.replace('__PUBLIC_URL__',public_url.rstrip('/')))
    (output/'records.json').write_text(json.dumps(records,ensure_ascii=False))
    (output/'share.png').write_bytes(base64.b64decode((HERE/'share.png.b64').read_text(),validate=False))
    (output/'.nojekyll').write_text('')
    (output/'build-receipt.json').write_text(json.dumps({'recordings':23,'true':9,'deceptive':14,'audio':receipts},indent=2))
    subprocess.run(['node','--check',str(output/'app.js')],check=True)
    print(json.dumps({'status':'passed','recordings':23,'true':9,'deceptive':14,'verified_audio_hashes':23,'output':str(output)}))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--public-url',default='')
    parser.add_argument('--output',type=pathlib.Path,default=HERE/'_site')
    args=parser.parse_args();build(args.public_url,args.output)
