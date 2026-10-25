'use strict';
const INDEX_ID=6392250512, ARCHIVE='scratchpads/archive.json';
const TITLE='# IssueStack Scratchpad Index';
const PAD_MARKER='ISSUESTACK_PAD_JOB:';
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const nonce=j=>j?.['nonce[string]']??j?.nonce;
const status=j=>j?.['execution[object<Execution>]']?.['status[string]']??j?.execution?.status??j?.queue?.status;
const success=j=>j?.['completion[object<Completion>]']?.['success[boolean|null]']??j?.completion?.success;
const complete=j=>(status(j)==='succeeded'&&success(j)===true)||(status(j)==='failed'&&success(j)===false);
const padMarker=id=>'<!-- '+PAD_MARKER+id+' -->';
const mapMarker=(job,pad,state)=>'<!-- ISSUESTACK_MAP:'+job+':'+pad+':'+state+' -->';
function parseMappings(body){
  if(!String(body).startsWith(TITLE))throw Error('Issue #2 first comment is not a scratchpad index');
  const map=new Map();
  for(const m of body.matchAll(/<!-- ISSUESTACK_MAP:(\d+):(\d+):(active|archived) -->/g)){
    const id=Number(m[1]);
    if(map.has(id))throw Error('Duplicate mapping for job '+id);
    map.set(id,{padId:Number(m[2]),state:m[3]});
  }
  return map;
}
function initialIndex(){
  return TITLE+'\n\n'+
    'Each Issue #2 job has a dedicated Issue #3 comment for shared working notes and agent handoffs.\n'+
    'Write working notes there rather than a local ephemeral scratchpad.\n'+
    'Completed scratchpads are snapshotted in scratchpads/archive.json.\n'+
    'Original first Issue #2 job archived as scratchpads/legacy-issue2-first-job-6392250512.json.\n\n'+
    '## Job-to-scratchpad mappings\n\n';
}
function parseJob(c){
  if(!c||c.id===INDEX_ID)return null;
  try{const j=JSON.parse(c.body);return j&&typeof j==='object'&&!Array.isArray(j)&&typeof nonce(j)==='string'?j:null;}
  catch{return null;}
}
async function verifiedUpdate(github,owner,repo,id,body){
  const old=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  if(old.body===body)return;
  await github.rest.issues.updateComment({owner,repo,comment_id:id,body});
  const saved=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  if(saved.body!==body)throw Error('Comment readback failed for '+id);
}
async function ensureScratchpad({github,owner,repo,jobId,jobNonce,core}){
  if(!Number.isSafeInteger(jobId)||typeof jobNonce!=='string'||!jobNonce)throw Error('Bad job identity');
  let idx=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
  let map=parseMappings(idx.body),padId=map.get(jobId)?.padId;
  if(!padId){
    // Retry-safe: recover pad creation if index write was interrupted.
    const pads=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:3,per_page:100});
    const found=pads.filter(c=>String(c.body).includes(padMarker(jobId)));
    if(found.length>1)throw Error('Duplicate scratchpads for job '+jobId);
    if(found.length)padId=found[0].id;
    else{
      const body='# Job '+jobId+' scratchpad\n\n'+padMarker(jobId)+'\n\n'+
        'Job: https://github.com/'+owner+'/'+repo+'/issues/2#issuecomment-'+jobId+'\n'+
        'Nonce: '+jobNonce.replace(/[\r\n<>]/g,' ').slice(0,160)+'\n\n'+
        '## Working notes\n\nRecord reasoning summaries, decisions, attempts, test results, blockers, and handoffs here. Retain the identity marker.\n';
      const created=await github.rest.issues.createComment({owner,repo,issue_number:3,body});
      padId=created.data.id;
    }
  }
  const pad=(await github.rest.issues.getComment({owner,repo,comment_id:padId})).data;
  if(!String(pad.body).includes(padMarker(jobId)))throw Error('Scratchpad verification failed');
  idx=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
  map=parseMappings(idx.body);
  if(map.has(jobId)&&map.get(jobId).padId!==padId)throw Error('Mapping conflict for job '+jobId);
  if(!map.has(jobId)){
    const url='https://github.com/'+owner+'/'+repo+'/issues/';
    const row='- [Job #'+jobId+']('+url+'2#issuecomment-'+jobId+') ↔ '+
      '[Scratchpad #'+padId+']('+url+'3#issuecomment-'+padId+') — **active** '+
      mapMarker(jobId,padId,'active');
    await verifiedUpdate(github,owner,repo,INDEX_ID,idx.body.replace(/\s*$/,'')+'\n'+row+'\n');
  }
  core?.info?.('Job '+jobId+' scratchpad: '+padId);
  return padId;
}
async function readArchive(github,owner,repo){
  const response=(await github.rest.repos.getContent({owner,repo,path:ARCHIVE})).data;
  if(Array.isArray(response)||!response.content)throw Error('Archive file unavailable');
  const data=JSON.parse(Buffer.from(response.content.replace(/\s/g,''),'base64').toString('utf8'));
  if(data.schema!=='issuestack.scratchpad.archive.v1'||!Array.isArray(data.entries))throw Error('Bad archive format');
  return {sha:response.sha,data};
}
async function archiveCompleted({github,owner,repo,jobComment,core}){
  const job=parseJob(jobComment);
  if(!job||!complete(job))return false;
  const index=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
  const link=parseMappings(index.body).get(jobComment.id);
  if(!link){core?.info?.('No linked pad for completed job '+jobComment.id);return false;}
  const archive=await readArchive(github,owner,repo);
  if(!archive.data.entries.some(e=>e.job_comment_id===jobComment.id)){
    const pad=(await github.rest.issues.getComment({owner,repo,comment_id:link.padId})).data;
    if(!String(pad.body).includes(padMarker(jobComment.id)))throw Error('Pad identity mismatch');
    const entry={job_comment_id:jobComment.id,scratchpad_comment_id:link.padId,
      nonce:nonce(job),status:status(job),archived_at:new Date().toISOString(),content:pad.body};
    const next={schema:archive.data.schema,entries:[...archive.data.entries,entry]};
    await github.rest.repos.createOrUpdateFileContents({owner,repo,path:ARCHIVE,sha:archive.sha,
      message:'Archive Issue #3 scratchpad for Issue #2 job '+jobComment.id,
      content:Buffer.from(JSON.stringify(next,null,2)+'\n','utf8').toString('base64')});
    const saved=(await readArchive(github,owner,repo)).data.entries.find(e=>e.job_comment_id===jobComment.id);
    if(!saved||saved.content!==pad.body||saved.scratchpad_comment_id!==link.padId)throw Error('Archive verification failed');
  }
  const current=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
  const old=mapMarker(jobComment.id,link.padId,'active'),updated=mapMarker(jobComment.id,link.padId,'archived');
  if(current.body.includes(old)){
    const text=current.body.replace(old,updated).replace('— **active** '+updated,'— **completed / archived** '+updated);
    await verifiedUpdate(github,owner,repo,INDEX_ID,text);
  }else if(!current.body.includes(updated))throw Error('Index mapping disappeared');
  core?.info?.('Archived scratchpad '+link.padId+' for job '+jobComment.id);
  return true;
}
async function onJobCompletion({github,context,core}){
  const {owner,repo}=context.repo;
  if(context.eventName==='issue_comment'){
    if(context.payload.issue?.number!==2||context.payload.issue?.pull_request||
      !['created','edited'].includes(context.payload.action)||context.payload.comment?.id===INDEX_ID)return;
    const c=(await github.rest.issues.getComment({owner,repo,comment_id:context.payload.comment.id})).data;
    await archiveCompleted({github,owner,repo,jobComment:c,core});
  }else{
    // Catch GITHUB_TOKEN-authored completion edits, which do not fire Actions.
    const all=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:2,per_page:100});
    for(const c of all)await archiveCompleted({github,owner,repo,jobComment:c,core});
  }
}
module.exports={INDEX_ID,ARCHIVE,TITLE,initialIndex,parseMappings,parseJob,complete,ensureScratchpad,archiveCompleted,onJobCompletion};
