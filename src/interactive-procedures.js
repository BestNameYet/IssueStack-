'use strict';

/**
 * IssueStack interactive procedure protocol.
 * One stable Issue #13 comment ID = one procedure projection. The issue #2
 * task record is never used as a mutable two-panel display.
 */
const ISSUE=13, INDEX_ID=6392250512;
const PAD_START='<!-- ISSUESTACK_BOT_HISTORY_START -->';
const PAD_END='<!-- ISSUESTACK_BOT_HISTORY_END -->';
const BOT_START='<!-- ISSUESTACK_BOT_INSTRUCTION_START -->';
const BOT_END='<!-- ISSUESTACK_BOT_INSTRUCTION_END -->';
const ANSWER_START='<!-- ISSUESTACK_AGENT_ANSWER_START -->';
const ANSWER_END='<!-- ISSUESTACK_AGENT_ANSWER_END -->';
const STEPS=[
  {id:'trace',title:'Verify issue linkage',instruction:'Read the Issue #1 transfer ledger, Issue #2 job, Issue #2 scratchpad index, and Issue #3 scratchpad. Verify the nonce and permanent comment IDs. Record intended work and file changes in the scratchpad and read it back BEFORE changing Issue #2 or files.'},
  {id:'plan',title:'Plan and claim',instruction:'After the verified scratchpad handshake, claim the Issue #2 job if authorized, decompose requirements, and read back the typed job record. Provide an evidence link.'},
  {id:'execute',title:'Execute authorized work',instruction:'Perform only approved changes. Record progress and proposed deviations in Issue #3 before making additional file changes. Provide an evidence link.'},
  {id:'verify',title:'Verify and publish results',instruction:'Independently check every requirement and acceptance criterion, save the Issue #2 execution receipt, and verify its read-back. Do not claim success based only on this procedure answer.'},
  {id:'archive',title:'Check completion archive',instruction:'If the Issue #2 job is terminal, verify the Issue #3 scratchpad archive and mapping. Otherwise describe the remaining work. This procedure completion is not itself task completion.'}
];
const identity=(job,pad)=>'<!-- ISSUESTACK_PROCEDURE_JOB:'+job+':'+pad+' -->';
const marker=(id,revision,submission)=>'<!-- ISSUESTACK_STEP_EVENT:'+id+':'+revision+':'+submission+' -->';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const isObject=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);

function block(body,start,end){
  const a=body.indexOf(start),b=body.indexOf(end);
  if(a<0||b<=a||body.indexOf(start,a+start.length)>=0||body.indexOf(end,b+end.length)>=0)throw Error('Missing or duplicated procedure panel tags');
  return body.slice(a+start.length,b).trim();
}
function pane(body,start,end){
  const s=block(body,start,end),m=/^\x60\x60\x60json\s*([\s\S]*?)\s*\x60\x60\x60$/.exec(s);
  if(!m)throw Error('Panel is not one fenced JSON object');
  const v=JSON.parse(m[1]);
  if(!isObject(v))throw Error('Panel JSON must be an object');
  return v;
}
function readProjection(body){
  const m=body.match(/<!-- ISSUESTACK_PROCEDURE_JOB:(\d+):(\d+) -->/g);
  if(!m||m.length!==1)throw Error('Invalid procedure identity marker');
  const ids=/<!-- ISSUESTACK_PROCEDURE_JOB:(\d+):(\d+) -->/.exec(m[0]);
  return {jobId:Number(ids[1]),padId:Number(ids[2]),bot:pane(body,BOT_START,BOT_END),answer:pane(body,ANSWER_START,ANSWER_END)};
}
function expectedBot(job,pad,nonce,revision,error=null){
  if(!Number.isSafeInteger(revision)||revision<0||revision>STEPS.length)throw Error('Bad procedure revision');
  const step=STEPS[revision],completed=!step;
  return {
    schema:'issuestack.procedure.v1',job_comment_id:job,scratchpad_comment_id:pad,nonce,
    revision,step_id:completed?'complete':step.id,step_number:completed?STEPS.length:revision+1,
    step_total:STEPS.length,status:completed?'complete':'awaiting_answer',
    title:completed?'Procedure finished':step.title,
    instruction:completed?'All procedure answers have been journaled. Confirm independently whether Issue #2 job and archive are complete.':step.instruction,
    expected_answer:completed?null:{revision:'number',step_id:'string',submission_id:'unique string',answer:{summary:'nonempty string',evidence_uri:'string or null'}},
    last_error:error
  };
}
function render(job,pad,nonce,revision,answer={},error=null){
  const bot=expectedBot(job,pad,nonce,revision,error);
  return [
    '# IssueStack interactive procedure — Job '+job,
    '',identity(job,pad),'',
    '**Agent instructions:** Edit ONLY the JSON between the AGENT ANSWER tags. Keep the bot instruction and identity marker unchanged. Use the indicated revision and step ID. One comment ID is used for all steps. Empty \`{}\` means no answer submitted.',
    '',
    BOT_START,'\x60\x60\x60json',JSON.stringify(bot,null,2),'\x60\x60\x60',BOT_END,'',
    ANSWER_START,'\x60\x60\x60json',JSON.stringify(answer,null,2),'\x60\x60\x60',ANSWER_END,'',
    'Completed steps are copied to the mapped Issue #3 scratchpad in the bot-history appendix. This projection does not update the Issue #2 job result.'
  ].join('\n')+'\n';
}
function journalEvents(body,id){
  const hasStart=body.includes(PAD_START),hasEnd=body.includes(PAD_END);
  if(hasStart!==hasEnd)throw Error('Incomplete bot-history tags');
  if(!hasStart)return [];
  const h=block(body,PAD_START,PAD_END),matches=[...h.matchAll(/<!-- ISSUESTACK_STEP_EVENT:(\d+):(\d+):([A-Za-z0-9._:-]+) -->/g)];
  const events=matches.filter(x=>Number(x[1])===id).map(x=>({revision:Number(x[2]),submission_id:x[3]}));
  events.forEach((e,i)=>{if(e.revision!==i)throw Error('Corrupt or non-contiguous procedure history');});
  return events;
}
function appendJournal(body,id,pad,revision,submission,step,answer){
  if(!body.includes('ISSUESTACK_PAD_JOB:'+id)&&!body.includes('ISSUESTACK_PAD_JOB:'))throw Error('Missing scratchpad identity');
  if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(submission))throw Error('Invalid submission ID');
  const previous=journalEvents(body,id);
  if(revision!==previous.length)throw Error('Journal revision conflict');
  const event={
    procedure_comment_id:id,revision,step_id:step,submission_id:submission,
    accepted_at:new Date().toISOString(),answer
  };
  const addition='\n'+marker(id,revision,submission)+'\n'+'\x60\x60\x60json\n'+JSON.stringify(event,null,2)+'\n\x60\x60\x60\n';
  if(!body.includes(PAD_START))return body.trimEnd()+'\n\n'+PAD_START+addition+PAD_END+'\n';
  return body.replace(PAD_END,addition+PAD_END);
}
function validateAnswer(answer,revision){
  const step=STEPS[revision];
  if(!step)return 'Procedure already complete';
  if(!isObject(answer)||Object.keys(answer).sort().join(',')!=='answer,revision,step_id,submission_id')return 'Answer must contain exactly revision, step_id, submission_id and answer';
  if(answer.revision!==revision||answer.step_id!==step.id)return 'Stale revision or wrong step ID';
  if(typeof answer.submission_id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(answer.submission_id))return 'Invalid submission_id';
  if(!isObject(answer.answer)||Object.keys(answer.answer).sort().join(',')!=='evidence_uri,summary')return 'answer requires exactly summary and evidence_uri';
  if(typeof answer.answer.summary!=='string'||!answer.answer.summary.trim())return 'answer.summary must be non-empty text';
  if(answer.answer.evidence_uri!==null&&(typeof answer.answer.evidence_uri!=='string'||!answer.answer.evidence_uri.trim()))return 'answer.evidence_uri must be a nonempty string or null';
  return null;
}
async function verifiedComment(github,owner,repo,id,body){
  const before=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  if(before.body!==body){
    await github.rest.issues.updateComment({owner,repo,comment_id:id,body});
    const after=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
    if(after.body!==body)throw Error('GitHub comment readback mismatch: '+id);
  }
}
async function getJobContext(github,owner,repo,jobId,padId){
  const index=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
  if(!index.body.includes('ISSUESTACK_MAP:'+jobId+':'+padId+':active')&&!index.body.includes('ISSUESTACK_MAP:'+jobId+':'+padId+':archived'))throw Error('Issue #2 scratchpad index does not match');
  const raw=(await github.rest.issues.getComment({owner,repo,comment_id:jobId})).data,job=JSON.parse(raw.body);
  const nonce=job['nonce[string]']??job.nonce;
  if(typeof nonce!=='string'||!nonce)throw Error('Job nonce missing');
  const pad=(await github.rest.issues.getComment({owner,repo,comment_id:padId})).data;
  if(!pad.body.includes('ISSUESTACK_PAD_JOB:'+jobId))throw Error('Scratchpad marker mismatch');
  return {nonce,job,pad};
}
async function ensureProcedure({github,owner,repo,jobId,padId,core}){
  const {nonce}=await getJobContext(github,owner,repo,jobId,padId);
  const comments=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:ISSUE,per_page:100});
  const found=comments.filter(c=>String(c.body).includes(identity(jobId,padId)));
  if(found.length>1)throw Error('Duplicate procedure projections for job '+jobId);
  if(found.length){readProjection(found[0].body);return found[0].id;}
  const created=await github.rest.issues.createComment({owner,repo,issue_number:ISSUE,body:render(jobId,padId,nonce,0)});
  const c=(await github.rest.issues.getComment({owner,repo,comment_id:created.data.id})).data;
  const parsed=readProjection(c.body);
  if(parsed.jobId!==jobId||parsed.padId!==padId)throw Error('Procedure creation readback failed');
  core?.info?.('Created interactive procedure '+c.id+' for job '+jobId);
  return c.id;
}
async function processComment({github,owner,repo,comment,core}){
  const {jobId,padId,bot,answer}=readProjection(comment.body);
  const {nonce,pad}=await getJobContext(github,owner,repo,jobId,padId);
  const events=journalEvents(pad.body,comment.id),revision=events.length;
  if(revision>STEPS.length)throw Error('Too many procedure events');
  // The journal is authoritative on restart: recover projection after a
  // successful append but failed comment update, without accepting twice.
  if(bot.revision<revision){
    const recovered=render(jobId,padId,nonce,revision);
    await verifiedComment(github,owner,repo,comment.id,recovered);
    core?.info?.('Recovered procedure projection '+comment.id+' at revision '+revision);
    return;
  }
  if(bot.revision!==revision)throw Error('Procedure projection ahead of journal');
  const expected=expectedBot(jobId,padId,nonce,revision,bot.last_error??null);
  if(JSON.stringify(bot)!==JSON.stringify(expected))throw Error('Bot-owned instruction panel was altered; refuse agent answer');
  if(Object.keys(answer).length===0)return;
  const error=validateAnswer(answer,revision);
  if(error){
    await verifiedComment(github,owner,repo,comment.id,render(jobId,padId,nonce,revision,answer,error));
    core?.warning?.('Rejected procedure answer: '+error);
    return;
  }
  const updated=appendJournal(pad.body,comment.id,padId,revision,answer.submission_id,answer.step_id,answer.answer);
  await verifiedComment(github,owner,repo,padId,updated);
  const readback=(await github.rest.issues.getComment({owner,repo,comment_id:padId})).data;
  if(readback.body!==updated||journalEvents(readback.body,comment.id).length!==revision+1)throw Error('Scratchpad journal append not verified');
  // Detect concurrent answer edits before writing the new projection.
  const current=(await github.rest.issues.getComment({owner,repo,comment_id:comment.id})).data;
  if(current.body!==comment.body)throw Error('Procedure answer changed during processing: reconciliation required');
  await verifiedComment(github,owner,repo,comment.id,render(jobId,padId,nonce,revision+1));
  core?.info?.('Accepted procedure '+comment.id+' step '+answer.step_id+' -> revision '+(revision+1));
}
async function run({github,context,core}){
  const {owner,repo}=context.repo;
  if(context.eventName==='issue_comment'){
    const issue=context.payload.issue?.number,action=context.payload.action;
    if(context.payload.issue?.pull_request||!['created','edited'].includes(action))return;
    if(context.actor!==owner){core?.info?.('Untrusted procedure actor ignored: '+context.actor);return;}
    if(issue===2){
      // Existing task bootstrapping. Intake creates all future projections in
      // the same transfer run because GITHUB_TOKEN publication suppresses events.
      const c=(await github.rest.issues.getComment({owner,repo,comment_id:context.payload.comment.id})).data;
      let job;try{job=JSON.parse(c.body);}catch{return;}
      if(!isObject(job)||typeof (job['nonce[string]']??job.nonce)!=='string')return;
      const index=(await github.rest.issues.getComment({owner,repo,comment_id:INDEX_ID})).data;
      const m=new RegExp('ISSUESTACK_MAP:'+c.id+':(\\d+):(active|archived)').exec(index.body);
      if(m)await ensureProcedure({github,owner,repo,jobId:c.id,padId:Number(m[1]),core});
      return;
    }
    if(issue!==ISSUE)return;
    const c=(await github.rest.issues.getComment({owner,repo,comment_id:context.payload.comment.id})).data;
    if(!c.body.includes('ISSUESTACK_PROCEDURE_JOB:'))return;
    await processComment({github,owner,repo,comment:c,core});
    return;
  }
  // Scheduled/manual reconciliation of accepted journal entries and pending
  // agent answers; GITHUB_TOKEN writes do not produce more issue_comment runs.
  const comments=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:ISSUE,per_page:100});
  for(const c of comments){
    if(!String(c.body).includes('ISSUESTACK_PROCEDURE_JOB:'))continue;
    try{await processComment({github,owner,repo,comment:c,core});}
    catch(e){core?.warning?.('Reconcile failed for '+c.id+': '+e.message);}
  }
}
module.exports={ISSUE,STEPS,BOT_START,BOT_END,ANSWER_START,ANSWER_END,PAD_START,PAD_END,
 identity,readProjection,render,journalEvents,appendJournal,validateAnswer,ensureProcedure,processComment,run};
