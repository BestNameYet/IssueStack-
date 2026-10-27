import collections, datetime, hashlib, json, re, stat, sys, zipfile
from pathlib import Path, PurePosixPath
BASE=Path(__file__).resolve().parents[1]
ARCHIVE=BASE/'source/facebook-heatherfowle1-2026-10-27-PlyBvwkU.zip'
EXPECTED='ab438c7c86a356404613f3c716705f566cdf28bd8209ccec0b36c54f3b472c63'
def sha(b): return hashlib.sha256(b).hexdigest()
def save(p,o):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def display(s):
 if not isinstance(s,str): return s
 try: return s.encode('latin1').decode('utf8')
 except (UnicodeEncodeError,UnicodeDecodeError): return s
def iso(ms): return datetime.datetime.fromtimestamp(ms/1000,datetime.timezone.utc).isoformat() if ms is not None else None
def md(s): return str(s).replace('|','\\|').replace('\n',' ')
def refs(obj,pointer=''):
 if isinstance(obj,dict):
  for k,v in obj.items():
   p=pointer+'/'+k
   if k=='uri' and isinstance(v,str): yield p,v
   else: yield from refs(v,p)
 elif isinstance(obj,list):
  for i,v in enumerate(obj): yield from refs(v,pointer+'/'+str(i))
def system(s):
 return bool(re.fullmatch(r"(You're now friends with .+\.|You're now connected on Messenger|You are now connected on Messenger|You added .+ on Messenger\.|.+ left the group\.|.+ added .+ to the group\.|You can now message and call each other.*)",s or ''))
raw=ARCHIVE.read_bytes()
assert len(raw)==18183730 and sha(raw)==EXPECTED
annotations=json.loads((BASE/'categories.json').read_text())
definitions=annotations['category_definitions']; overrides=annotations['annotations']
inventory=[]; groups={}; extracted=[]; json_count=0
with zipfile.ZipFile(ARCHIVE) as z:
 assert z.testzip() is None
 names=set(z.namelist()); assert len(names)==len(z.infolist())
 for info in z.infolist():
  p=PurePosixPath(info.filename)
  assert not p.is_absolute() and '..' not in p.parts and '\\' not in info.filename and not stat.S_ISLNK(info.external_attr>>16)
  if info.is_dir(): continue
  b=z.read(info)
  inventory.append({'path':info.filename,'bytes':len(b),'sha256':sha(b)})
  if info.filename.startswith('your_facebook_activity/messages/'):
   dest=BASE/'extracted'/info.filename;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
   assert dest.read_bytes()==b
   extracted.append(info.filename)
  if not info.filename.endswith('.json'): continue
  obj=json.loads(b);json_count+=1
  if not isinstance(obj,dict) or not isinstance(obj.get('messages'),list):continue
  key=str(p.parent); t=groups.setdefault(key,{'id':p.parent.name,'source_folder':key,'source_files':[],'source_records':[],'messages':[]})
  t['source_files'].append(info.filename)
  t['source_records'].append({'path':info.filename,'metadata':{k:v for k,v in obj.items() if k!='messages'}})
  for i,m in enumerate(obj['messages']):
   t['messages'].append({'source_file':info.filename,'source_index':i,'raw':m})
allrefs=[]; blank_names=[]; duplicate_total=0
for key,t in sorted(groups.items()):
 first=t['source_records'][0]['metadata']
 title=display(first.get('title',''))
 t['title']=title or 'Unnamed account — '+t['id']
 t['export_title']=first.get('title','')
 t['export_category']=PurePosixPath(key).parts[2]
 t['participants']=first.get('participants',[])
 t['participant_display']=[display(p.get('name')) or 'Unnamed account' for p in t['participants']]
 if not title:blank_names.append(t['id'])
 t['messages'].sort(key=lambda m:(m['raw'].get('timestamp_ms') is None,m['raw'].get('timestamp_ms',0),m['source_file'],m['source_index']))
 timestamps=[]
 for m in t['messages']:
  r=m['raw'];ms=r.get('timestamp_ms')
  m['timestamp_utc']=iso(ms)
  m['sender_display']=display(r.get('sender_name')) or 'Unnamed account'
  m['content_display']=display(r.get('content'))
  if ms is not None:timestamps.append(ms)
  for pointer,u in refs(r):
   status='empty_uri' if not u else ('external_url' if re.match(r'https?://',u) else ('present' if u in names else 'missing'))
   allrefs.append({'thread_id':t['id'],'source_file':m['source_file'],'source_index':m['source_index'],'pointer':pointer,'uri':u,'status':status})
 t['message_count']=len(t['messages'])
 t['first_message_utc']=iso(min(timestamps)) if timestamps else None
 t['last_message_utc']=iso(max(timestamps)) if timestamps else None
 t['attachment_reference_count']=sum(r['thread_id']==t['id'] for r in allrefs)
 hashes=collections.Counter(sha(json.dumps(m['raw'],sort_keys=True,ensure_ascii=False).encode()) for m in t['messages'])
 t['exact_duplicate_message_records']=sum(v-1 for v in hashes.values());duplicate_total+=t['exact_duplicate_message_records']
 # Keep every message, including duplicates, with source index and original JSON.
 if t['id'] in overrides: annotation=overrides[t['id']]
 elif all(system(m['raw'].get('content','')) for m in t['messages']):
  annotation={'categories':['system_only'],'summary':'Only platform connection events are present; no substantive conversation text is available.','confidence':'supported_by_available_text'}
 else:
  annotation={'categories':['limited_context','shared_media'],'summary':'Sparse attachment, media, or contact activity without enough substantive text to identify a conversation topic.','confidence':'limited_context'}
 assert all(c in definitions for c in annotation['categories'])
 t.update(annotation)
 t['category_evidence']=[{'source_file':p,'scope':'complete exported thread text and event structure'} for p in t['source_files']]
 t['display_transform']='Reversible Latin-1-to-UTF-8 repair when valid; original text remains in raw/source_records.'
rows=sorted(groups.values(),key=lambda t:(t['first_message_utc'] or '',t['id']))
assert len(rows)==82 and sum(t['message_count'] for t in rows)==971
assert len(set(t['id'] for t in rows))==82
assert set(overrides)<=set(t['id'] for t in rows)
counts=collections.Counter(c for t in rows for c in t['categories'])
missing=[r for r in allrefs if r['status']=='missing']
verification={'source_sha256':EXPECTED,'zip_crc':'passed','archive_files':len(inventory),'json_files_parsed':json_count,'extracted_message_area_files':len(extracted),'conversation_files':sum(len(t['source_files']) for t in rows),'conversations':len(rows),'messages':sum(t['message_count'] for t in rows),'multi_part_threads':sum(len(t['source_files'])>1 for t in rows),'exact_duplicate_message_records_preserved':duplicate_total,'blank_thread_titles':blank_names,'attachment_reference_status':dict(collections.Counter(r['status'] for r in allrefs)),'missing_attachment_references':missing,'categories':dict(sorted(counts.items())),'categorization_coverage':len(rows),'all_original_message_records_preserved':True,'all_extracted_bytes_match_source':True,'timestamps':'UTC; original timestamp_ms retained','external_link_targets':'not fetched','semantic_scope':'Text/event categorization; no image, audio or linked-site content interpretation.'}
save(BASE/'conversations.json',{'schema':'conversation-catalog.v1','source_sha256':EXPECTED,'conversations':rows})
save(BASE/'inventory.json',{'source':ARCHIVE.name,'source_sha256':EXPECTED,'archive_files':inventory,'extracted_paths':extracted,'attachment_references':allrefs})
save(BASE/'verification.json',verification)
save(BASE/'categories.json',{'category_definitions':definitions,'annotations':overrides,'assignment_method':'Explicit source-text summaries for substantive threads; event-only and sparse-media fallbacks. Categories describe conversation content, not participant traits. Multiple labels allowed.','assignments':{t['id']:{'categories':t['categories'],'confidence':t['confidence']} for t in rows}})
header=['# Conversation catalog','','82 conversations · 971 messages · source archive preserved unchanged.','','[All summaries](summaries.md) · [Full chronological JSON](conversations.json) · [Verification](verification.json) · [Original ZIP](source/'+ARCHIVE.name+')','','Labels describe the exported messages. Blank account names remain unknown. Multiple tags may apply; category totals overlap. Dates are UTC.','','## Categories','']
for c,count in sorted(counts.items()):
 header+=['- **'+c.replace('_',' ')+'**: '+str(count)+' conversations. '+definitions[c]]
header+=['','## Conversations by date','','| Conversation | Export folder | Messages | Attachment refs | Date range (UTC) | Topics |','| --- | --- | ---: | ---: | --- | --- |']
for t in rows:
 date_range=(t['first_message_utc'] or 'unknown')[:10]+' to '+(t['last_message_utc'] or 'unknown')[:10]
 header.append('| ['+md(t['title'])+'](summaries.md#thread-'+t['id']+') | '+t['export_category']+' | '+str(t['message_count'])+' | '+str(t['attachment_reference_count'])+' | '+date_range+' | '+', '.join(t['categories'])+' |')
(BASE/'index.md').write_text('\n'.join(header)+'\n',encoding='utf8')
summary=['# Conversation summaries','','Source text and attachments are preserved separately. These summaries describe messages and do not verify allegations.','']
for t in rows:
 summary+=['<a id="thread-'+t['id']+'"></a>','## '+t['title'],'',t['summary'],'','- Participants: '+', '.join(t['participant_display']),'- Export folder: '+t['export_category'],'- Dates (UTC): '+str(t['first_message_utc'])+' to '+str(t['last_message_utc']),'- Messages: '+str(t['message_count'])+'; attachment references: '+str(t['attachment_reference_count']),'- Topics: '+', '.join(t['categories']),'- Category confidence: '+t['confidence'],'- Original files: '+', '.join('[message JSON '+str(i+1)+'](extracted/'+p+')' for i,p in enumerate(t['source_files'])),'']
(BASE/'summaries.md').write_text('\n'.join(summary),encoding='utf8')
# Round-trip verification against every original message, including order-independent counts.
with zipfile.ZipFile(ARCHIVE) as z:
 output=json.loads((BASE/'conversations.json').read_text())
 for t in output['conversations']:
  for m in t['messages']:
   original=json.loads(z.read(m['source_file']))['messages'][m['source_index']]
   assert m['raw']==original
  times=[m['raw']['timestamp_ms'] for m in t['messages'] if m['raw'].get('timestamp_ms') is not None]
  assert times==sorted(times)
root=BASE.parents[2]
files=[]
for p in sorted(BASE.rglob('*')):
 if p.is_file() and p.name!='review-manifest.json':
  b=p.read_bytes();files.append({'path':str(p.relative_to(root)),'bytes':len(b),'sha256':sha(b),'job_id':6437031149})
workflow=root/'.github/workflows/import-conversations-6437031149.yml'
if workflow.exists():
 b=workflow.read_bytes();files.append({'path':str(workflow.relative_to(root)),'bytes':len(b),'sha256':sha(b),'job_id':6437031149})
save(root/'config/file-metadata.json',{'schema':'file-metadata.v1','files':files,'self_record':'Metadata and review manifest excluded from self-hash; immutable commit and review manifest identify them.'})
print(json.dumps(verification,indent=2))
