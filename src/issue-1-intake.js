'use strict';

const {readDefinition, validateIntake} = require('./record-type-validator.js');
const {splitComment, addError} = require('./comment-error-tags.js');

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
  if (ledger.body.includes(receiptKey)) return;
  const body = ledger.body.replace(/\s*$/,'') + '\n' + entry + '\n';
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

async function run({github, context, core}) {
  if (context.eventName!=='issue_comment' || !['created','edited'].includes(context.payload.action) ||
      context.payload.issue?.number!==ISSUE_INTAKE || context.payload.issue?.pull_request) return;
  const {owner,repo} = context.repo;
  const commentId=context.payload.comment.id;
  // Only the repository owner can issue work. Overflow comments are removed
  // regardless of author; the bot and all other writers use the pinned slots.
  const source=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (commentId===LEDGER_ID) {core.info('Ledger is not an intake slot.');return;}
  if (slotNumber(commentId)===null) {
    await pruneOverflow(github,owner,repo,core);
    return;
  }
  if (source.user?.login!==owner) {core.info('Owner-only slot '+commentId+' ignored.');return;}

  // A placeholder is a ready-to-edit slot, not malformed JSON.
  if (source.body.trim()!==SLOT_PROMPT) {
    const issue=(await github.rest.issues.get({owner,repo,issue_number:ISSUE_INTAKE})).data;
    const {template,registry}=readDefinition(issue.body);
    const {recordText}=splitComment(source.body);
    let record,error;
    try {record=JSON.parse(recordText);}catch{error='Invalid JSON';}
    if (!error) error=validateIntake(record,template,registry);

    const queue=await github.paginate(github.rest.issues.listComments,
      {owner,repo,issue_number:ISSUE_QUEUE,per_page:100});
    const jobs=[];
    for (const q of queue) {
      let job;try{job=JSON.parse(q.body);}catch{continue;}
      if (job && typeof job==='object' && !Array.isArray(job))jobs.push({comment:q,job});
    }
    const sameNonce=error?[]:jobs.filter(o=>nonceOf(o.job)===record['nonce[string]']);
    if (!error && sameNonce.some(o=>sourceId(o.job)!==commentId)) error='Nonce already used by another instruction.';
    if (!error && sameNonce.length>1) error='Multiple jobs with this nonce; manual repair required.';

    if (error) {
      // Retain the user's payload plus one visible error tag.
      const prior=jobs.filter(o=>sourceId(o.job)===commentId && statusOf(o.job)==='pending');
      // A reusable slot may have multiple historical jobs. Do not invalidate
      // an unrelated earlier instruction merely because its slot was reused.
      // Blocking requires the currently submitted nonce to identify that job.
      const submittedNonce=record?.['nonce[string]'];
      for(const candidate of prior) {
        if(!submittedNonce || nonceOf(candidate.job)!==submittedNonce)continue;
        await writeVerified(github,owner,repo,candidate.comment.id,JSON.stringify(blockPending(candidate.job),null,2));
      }
      const annotated=addError(source.body,error);
      if(annotated!==source.body) await writeVerified(github,owner,repo,commentId,annotated);
      core.info('Invalid slot '+slotNumber(commentId)+' entry: '+error);
      return;
    }

    let queueId,queuedRecord;
    if (sameNonce.length) {
      queueId=sameNonce[0].comment.id;
      queuedRecord=sameNonce[0].job;
      // Prior accepted payload is immutable after publication.
      if(statusOf(queuedRecord)!=='pending') core.info('Existing job status: '+statusOf(queuedRecord));
    } else {
      queuedRecord=copy(record);
      queuedRecord['source[object<Source>]']['issue[number]']=ISSUE_INTAKE;
      queuedRecord['source[object<Source>]']['comment_id[number|null]']=commentId;
      queuedRecord['execution[object<Execution>]']['enqueued_at[string|null]']=new Date().toISOString();
      queuedRecord['execution[object<Execution>]']['status[string]']='pending';
      const body=JSON.stringify(queuedRecord,null,2);
      const posted=await github.rest.issues.createComment({owner,repo,issue_number:ISSUE_QUEUE,body});
      queueId=posted.data.id;
    }

    // The same transfer can be retried safely after a partial ledger/reset failure.
    const verified=(await github.rest.issues.getComment({owner,repo,comment_id:queueId})).data;
    const actual=JSON.parse(verified.body);
    if(nonceOf(actual)!==record['nonce[string]'] || sourceId(actual)!==commentId) {
      throw new Error('Queue verification failed; source slot was not reset.');
    }
    const enqueued=actual['execution[object<Execution>]']?.['enqueued_at[string|null]'] || new Date().toISOString();
    await appendLedger(github,owner,repo,
      transferLine(slotNumber(commentId),commentId,nonceOf(actual),queueId,enqueued,owner+'/'+repo),
      'TRANSFER:'+queueId);
    await writeVerified(github,owner,repo,commentId,SLOT_PROMPT);
    core.info('Verified transfer '+queueId+'; reset Issue #1 slot '+slotNumber(commentId));
    return;
  }
  core.info('Slot '+slotNumber(commentId)+' is available.');
  await pruneOverflow(github,owner,repo,core);
}

module.exports={run,slotNumber,initialLedger,transferLine,rejectedLine,LEDGER_ID,SLOT_IDS,SLOT_PROMPT};
