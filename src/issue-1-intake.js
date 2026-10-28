'use strict';

const {readDefinition, validateIntake} = require('./record-type-validator.js');
const {splitComment, addError} = require('./comment-error-tags.js');
const {ensureScratchpad} = require('./issue-3-scratchpads.js');
const {validateDeclaration,ensureDeclaredProcedure,DECLARATION} = require('./procedure-documents.js');

const ISSUE_INTAKE = 1;
const ISSUE_QUEUE = 2;
// Fixed GitHub IDs, not positions calculated after deletions. Never reorder.
const LEDGER_ID = 6392246635;
const SLOT_IDS = [6392297975,6392352070,6392385256,6392425260,6392431658];
const SLOT_PROMPT = 'Please enter instruction.';
const LEDGER_TITLE = '# IssueStack Transfer Ledger';
const ROUTING_MESSAGE = 'Please use comments 2 through 6.';
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const copy = value => JSON.parse(JSON.stringify(value));
const sourceOf = job => job?.['source[object<Source>]'] || job?.source;
const sourceId = job => sourceOf(job)?.['comment_id[number|null]'] ?? sourceOf(job)?.comment_id;
const nonceOf = job => job?.['nonce[string]'] ?? job?.nonce;
const statusOf = job => job?.['execution[object<Execution>]']?.['status[string]'] ?? job?.execution?.status ?? job?.queue?.status;

function slotNumber(commentId) {
  const offset = SLOT_IDS.indexOf(commentId);
  return offset < 0 ? null : offset + 2;
}

function initialLedger() {
  return [
    LEDGER_TITLE,
    '',
    'Instruction inputs: **edit comments 2 through 6**. Comment 1 is the transfer ledger.',
    'Please do not create additional comments on Issue #1.',
    '',
    '## Verified transfers',
    '',
    '## Rejected extra comments',
    ''
  ].join('\n');
}

async function writeVerified(github, owner, repo, commentId, body) {
  await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body});
  const actual = (await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (actual.body !== body) throw new Error('Read-back differs for comment '+commentId);
}

async function appendLedger(github, owner, repo, entry, receiptKey) {
  const ledger = (await github.rest.issues.getComment({owner,repo,comment_id:LEDGER_ID})).data;
  if (!ledger.body.startsWith(LEDGER_TITLE)) {
    throw new Error('Ledger comment 1 has not been initialized; refusal to overwrite historical content.');
  }
  // Verify the exact receipt line, not a substring of a different ID.
  if (ledger.body.split('\n').some(line=>line.trimEnd().endsWith('| receipt: '+receiptKey))) return;
  const transferHeader='## Verified transfers';
  const rejectedHeader='## Rejected extra comments';
  const current=ledger.body.replace(/\s*$/,'');
  let body;
  // A successfully installed Issue #13 procedure is a verified transfer, not
  // a rejected overflow comment. It must already have been read back by
  // ensureDeclaredProcedure before appendLedger is called.
  if (receiptKey.startsWith('TRANSFER:') || receiptKey.startsWith('PROCEDURE:')) {
    const where=current.indexOf(rejectedHeader);
    if(where<0 || !current.includes(transferHeader)) throw new Error('Transfer ledger sections missing.');
    body=current.slice(0,where).trimEnd()+'\n'+entry+'\n\n'+current.slice(where).trimStart()+'\n';
  } else if (receiptKey.startsWith('REJECT:')) {
    if (!current.includes(rejectedHeader)) throw new Error('Rejected comments section missing.');
    body=current+'\n'+entry+'\n';
  } else {
    throw new Error('Unknown ledger receipt category: '+receiptKey);
  }
  await writeVerified(github,owner,repo,LEDGER_ID,body);
}

function transferLine(slot, commentId, nonce, queueId, when, repoPath) {
  return '- '+when+' | slot '+slot+' | source #'+commentId+' | nonce '+
    JSON.stringify(nonce)+' | [Issue #2 job #'+queueId+'](https://github.com/'+repoPath+'/issues/2#issuecomment-'+queueId+') | receipt: TRANSFER:'+queueId;
}
function rejectedLine(id) {
  return '- Removed Issue #1 comment #'+id+'. '+ROUTING_MESSAGE+' | receipt: REJECT:'+id;
}

async function pruneOverflow(github, owner, repo, core) {
  const comments = await github.paginate(github.rest.issues.listComments,
    {owner,repo,issue_number:ISSUE_INTAKE,per_page:100});
  const permitted = new Set([LEDGER_ID,...SLOT_IDS]);
  for (const comment of comments) {
    if (permitted.has(comment.id)) continue;
    // Record the instruction before deleting it: never create a seventh comment.
    await appendLedger(github,owner,repo,rejectedLine(comment.id),'REJECT:'+comment.id);
    await github.rest.issues.deleteComment({owner,repo,comment_id:comment.id});
    core.info('Removed overflow Issue #1 comment '+comment.id+'. '+ROUTING_MESSAGE);
  }
}

function blockPending(job) {
  const blocked = copy(job);
  if (has(blocked,'execution[object<Execution>]')) {
    blocked['execution[object<Execution>]']['status[string]']='blocked';
    blocked['completion[object<Completion>]']['summary[string|null]']='Source slot was edited to an invalid record; job blocked.';
  } else if (has(blocked,'execution')) {
    blocked.execution.status='blocked';
    blocked.completion.summary='Source slot was edited to an invalid record; job blocked.';
  } else if (has(blocked,'queue')) {
    blocked.queue.status='failed';
    blocked.completion.summary='Source slot was edited to an invalid record; job blocked.';
  }
  return blocked;
}

// Source and status stay in one fixed comment. The source is base64-encoded
// for lossless recovery, NOT encrypted; issue comments are public.
const PROGRESS_MARKER = 'ISSUESTACK_INTAKE_PROGRESS_V1';
const progressSuffix = new RegExp('\\n<!-- '+PROGRESS_MARKER+' ([A-Za-z0-9+/=]+) -->\\s*$');
const workflowUrl = (context) => 'https://github.com/'+context.repo.owner+'/'+context.repo.repo+
  '/actions/runs/'+context.runId;
const parseProgress = (body) => {
  const m=progressSuffix.exec(String(body||''));
  if(!m)return null;
  let state;
  try {state=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));}catch{return null;}
  if(state?.version!==1||typeof state.run_id!=='number'||typeof state.source!=='string'||
      !Array.isArray(state.events))return null;
  return state;
};
function renderProgress(state){
  const phase=state.phase==='succeeded'?'completed':state.phase==='failed'?'failed':'running';
  const header='## IssueStack intake — workflow '+phase;
  const eventLines=state.events.map(e=>'- '+e);
  const encoded=Buffer.from(JSON.stringify(state),'utf8').toString('base64');
  return [header,'',
    '- Workflow: [run #'+state.run_id+']('+state.run_url+')',
    '- Source slot: #'+state.slot_id,
    ...eventLines,
    '',
    'Original submitted JSON is retained in the machine-readable comment record until cleanup.',
    '',
    '<!-- '+PROGRESS_MARKER+' '+encoded+' -->'].join('\n');
}
function safeError(error){
  if(error?.intakeValidation===true)return String(error.message).replace(/[\r\n\t]/g,' ').slice(0,300);
  const code=Number(error?.status||error?.response?.status);
  return 'Operation failed'+(Number.isInteger(code)?' (HTTP '+code+')':'')+
    '. Inspect the linked workflow run for details; no success was inferred.';
}
function validationError(message){
  const err=new Error(message);err.intakeValidation=true;return err;
}
async function progressWriter({github,context,commentId,sourceText}){
  const {owner,repo}=context.repo;
  const state={
    version:1,run_id:Number(context.runId)||0,run_url:workflowUrl(context),
    slot_id:commentId,source:sourceText,phase:'running',stage:'initialize',
    events:['Workflow running; validating submitted instruction.'],finished_at:null
  };
  const publish=async()=>{
    const observed=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
    const previous=parseProgress(observed.body);
    // Prevent a stale workflow from clobbering a newer user edit or another run.
    if(previous){
      if(previous.run_id!==state.run_id||previous.source!==state.source){
        throw Error('Stale intake status: another run owns slot '+commentId);
      }
    }else if(observed.body!==sourceText){
      throw Error('Source slot changed since intake started');
    }
    await writeVerified(github,owner,repo,commentId,renderProgress(state));
  };
  await publish();
  return {
    state,
    async stage(stage){state.stage=stage;},
    async append(line){
      state.events.push(line);await publish();
    },
    async finish(){
      state.stage='complete';state.phase='succeeded';state.finished_at=new Date().toISOString();
      state.events.push('Transfer verified; progress display retained for five minutes.');
      await publish();
    },
    async fail(error){
      state.phase='failed';state.finished_at=new Date().toISOString();
      state.events.push('Error at '+state.stage+': '+safeError(error));
      state.events.push('Workflow details: '+state.run_url);
      await publish();
    }
  };
}
async function run({github,context,core}){
  if(context.eventName!=='issue_comment'||!['created','edited'].includes(context.payload.action)||
      context.payload.issue?.number!==ISSUE_INTAKE||context.payload.issue?.pull_request)return;
  const {owner,repo}=context.repo,commentId=context.payload.comment.id;
  const source=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if(commentId===LEDGER_ID){core?.info?.('Ledger is not an intake slot');return;}
  if(slotNumber(commentId)===null){await pruneOverflow(github,owner,repo,core);return;}
  if(source.user?.login!==owner){core?.info?.('Owner-only slot ignored');return;}
  if(source.body.trim()===SLOT_PROMPT){core?.info?.('Slot available');await pruneOverflow(github,owner,repo,core);return;}
  if(parseProgress(source.body)){
    core?.info?.('Slot is already being processed or displayed; do not replay');
    return;
  }
  const {recordText}=splitComment(source.body);
  // Preserve submitted text verbatim in the status record, including existing
  // validator diagnostics, before making any queue or scratchpad changes.
  const progress=await progressWriter({github,context,commentId,sourceText:source.body});
  try{
    await progress.stage('parse');
    let submitted;
    try{submitted=JSON.parse(recordText);}catch{throw validationError('Invalid JSON');}
    if(submitted?.schema===DECLARATION){
      await progress.stage('procedure_validation');
      const error=validateDeclaration(submitted);
      if(error)throw validationError(error);
      await progress.stage('issue13_create_verify');
      const id=await ensureDeclaredProcedure({github,owner,repo,declaration:submitted,sourceId:commentId,core});
      await progress.append('Issue #13 procedure found at commentID ['+id+'](https://github.com/'+owner+'/'+repo+'/issues/13#issuecomment-'+id+').');
      await progress.stage('ledger');
      const entry='- '+new Date().toISOString()+' | slot '+slotNumber(commentId)+' | source #'+commentId+
        ' | nonce '+JSON.stringify(submitted.nonce)+' | [Issue #13 procedure #'+id+
        '](https://github.com/'+owner+'/'+repo+'/issues/13#issuecomment-'+id+') | receipt: PROCEDURE:'+id;
      await appendLedger(github,owner,repo,entry,'PROCEDURE:'+id);
      await progress.append('Issue #1 procedure transfer receipt verified: PROCEDURE:'+id+'.');
      await progress.finish();
      return;
    }
    await progress.stage('task_validation');
    const issue=(await github.rest.issues.get({owner,repo,issue_number:ISSUE_INTAKE})).data;
    const {template,registry}=readDefinition(issue.body);
    const error=validateIntake(submitted,template,registry);
    if(error)throw validationError(error);
    await progress.stage('queue_deduplication');
    const queue=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:ISSUE_QUEUE,per_page:100});
    const jobs=[];
    for(const q of queue){let job;try{job=JSON.parse(q.body);}catch{continue;}
      if(job&&typeof job==='object'&&!Array.isArray(job))jobs.push({comment:q,job});
    }
    const nonce=submitted['nonce[string]'];
    const sameNonce=jobs.filter(o=>nonceOf(o.job)===nonce);
    if(sameNonce.some(o=>sourceId(o.job)!==commentId))throw validationError('Nonce already used by another instruction.');
    if(sameNonce.length>1)throw validationError('Multiple jobs with this nonce; manual repair required.');
    let queueId,queuedRecord;
    if(sameNonce.length){
      queueId=sameNonce[0].comment.id;
      queuedRecord=sameNonce[0].job;
      core?.info?.('Retry-safe recovery of queued job '+queueId);
    }else{
      await progress.stage('issue2_creation');
      queuedRecord=copy(submitted);
      queuedRecord['source[object<Source>]']['issue[number]']=ISSUE_INTAKE;
      queuedRecord['source[object<Source>]']['comment_id[number|null]']=commentId;
      queuedRecord['execution[object<Execution>]']['enqueued_at[string|null]']=new Date().toISOString();
      queuedRecord['execution[object<Execution>]']['status[string]']='pending';
      const posted=await github.rest.issues.createComment({
        owner,repo,issue_number:ISSUE_QUEUE,body:JSON.stringify(queuedRecord,null,2)
      });
      queueId=posted.data.id;
    }
    await progress.stage('issue2_readback');
    const verified=(await github.rest.issues.getComment({owner,repo,comment_id:queueId})).data;
    const actual=JSON.parse(verified.body);
    if(nonceOf(actual)!==nonce||sourceId(actual)!==commentId)throw Error('Issue #2 verification mismatch');
    await progress.append('Issue #2 comment found at commentID ['+queueId+
      '](https://github.com/'+owner+'/'+repo+'/issues/2#issuecomment-'+queueId+').');
    await progress.stage('issue3_create_verify');
    const padId=await ensureScratchpad({github,owner,repo,jobId:queueId,jobNonce:nonceOf(actual),core});
    await progress.append('Issue #3 scratchpad found at commentID ['+padId+
      '](https://github.com/'+owner+'/'+repo+'/issues/3#issuecomment-'+padId+').');
    await progress.stage('ledger');
    const enqueued=actual['execution[object<Execution>]']?.['enqueued_at[string|null]']||new Date().toISOString();
    await appendLedger(github,owner,repo,
      transferLine(slotNumber(commentId),commentId,nonceOf(actual),queueId,enqueued,owner+'/'+repo),
      'TRANSFER:'+queueId);
    await progress.append('Issue #1 ledger transfer verified: TRANSFER:'+queueId+'.');
    await progress.finish();
    core?.info?.('Verified transfer '+queueId+' with pad '+padId+'; delayed cleanup pending');
  }catch(error){
    try{await progress.fail(error);}catch(reportError){
      core?.error?.('Unable to persist intake error to Issue #1 slot: '+String(reportError?.message||reportError));
    }
    core?.error?.('Issue #1 intake failed at '+progress.state.stage+': '+String(error?.message||error));
    core?.setFailed?.('Issue #1 intake failed; inspect visible status and workflow logs.');
    if(!error?.intakeValidation)throw error;
  }
}
// Cleanup runs in a separate job, never in the serialized intake job.
// It is intentionally best-effort: status must not be deleted if the slot
// changed, the run is different, or the five-minute interval is incomplete.
async function finishOrphan({github,context,core}){
  if(context.payload.issue?.number!==1||!SLOT_IDS.includes(context.payload.comment?.id))return;
  const {owner,repo}=context.repo,id=context.payload.comment.id;
  const c=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  const state=parseProgress(c.body);
  if(!state||state.run_id!==(Number(context.runId)||0)||state.phase!=='running')return;
  state.phase='failed';state.stage='interrupted';state.finished_at=new Date().toISOString();
  state.events.push('Error: Intake job terminated before completion. Inspect workflow '+state.run_url+'.');
  await writeVerified(github,owner,repo,id,renderProgress(state));
  core?.warning?.('Recorded interrupted intake run '+state.run_id);
}
async function cleanup({github,context,core}){
  if(context.payload.issue?.number!==1||!SLOT_IDS.includes(context.payload.comment?.id))return;
  const {owner,repo}=context.repo,id=context.payload.comment.id;
  const c=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  const state=parseProgress(c.body);
  if(!state||state.run_id!==(Number(context.runId)||0))return;
  if(!['succeeded','failed'].includes(state.phase)||!Number.isFinite(Date.parse(state.finished_at)))return;
  if(Date.now()-Date.parse(state.finished_at)<300000){
    core?.warning?.('Five-minute retention has not elapsed; refusing early reset');
    return;
  }
  // Recheck immediately before write; an unconditional GitHub issue-comment
  // update has no compare-and-swap primitive, so concurrent owner edits are
  // still a documented risk, even with this stale-run guard.
  const latest=(await github.rest.issues.getComment({owner,repo,comment_id:id})).data;
  const newer=parseProgress(latest.body);
  if(!newer||newer.run_id!==state.run_id||newer.finished_at!==state.finished_at){
    core?.warning?.('Slot changed since cleanup read; preserve user content');return;
  }
  await writeVerified(github,owner,repo,id,SLOT_PROMPT);
  core?.info?.('Five-minute display expired; cleared slot '+id);
}
module.exports={run,cleanup,finishOrphan,parseProgress,renderProgress,
  appendLedger,slotNumber,initialLedger,transferLine,rejectedLine,LEDGER_ID,SLOT_IDS,SLOT_PROMPT};
