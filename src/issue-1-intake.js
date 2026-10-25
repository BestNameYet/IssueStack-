'use strict';

const {readDefinition, validateIntake} = require('./record-type-validator.js');
const {splitComment, addError} = require('./comment-error-tags.js');
const {LEDGER_ID, SLOT_IDS, PROMPT, REJECT, renderLedger, sourceFor, nonceFor} = require('./issue-1-slots.js');

const INTAKE_ISSUE = 1;
const QUEUE_ISSUE = 2;
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const clone = x => JSON.parse(JSON.stringify(x));

async function writeAndVerify({github, owner, repo, commentId, body}) {
  const current = (await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (current.body === body) return false;
  await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body});
  const readback = (await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (readback.body !== body) throw new Error('Comment write verification failed for ' + commentId);
  return true;
}

async function listQueue(github,owner,repo) {
  return github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:QUEUE_ISSUE,per_page:100});
}
async function refreshLedger({github,owner,repo,queue}) {
  const ledger = renderLedger(queue,owner+'/'+repo);
  await writeAndVerify({github,owner,repo,commentId:LEDGER_ID,body:ledger});
  return ledger;
}

async function run({github, context, core}) {
  if (context.eventName !== 'issue_comment' ||
      !['created','edited'].includes(context.payload.action) ||
      context.payload.issue?.number !== INTAKE_ISSUE ||
      context.payload.issue?.pull_request) return;
  const owner=context.repo.owner, repo=context.repo.repo, commentId=context.payload.comment.id;
  const source=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (source.user?.login === 'github-actions[bot]') return;

  // The ledger is never an executable instruction, even when manually edited.
  if (commentId === LEDGER_ID) {
    await refreshLedger({github,owner,repo,queue:await listQueue(github,owner,repo)});
    core.info('Restored Issue #1 transfer ledger.');
    return;
  }

  // Existing historical comments after slot 6 are not promoted into slots.
  // For new/edited overflow comments replace the content with an explanation.
  if (!SLOT_IDS.includes(commentId)) {
    await writeAndVerify({github,owner,repo,commentId,body:REJECT});
    core.info('Rejected out-of-range Issue #1 comment '+commentId+'. '+REJECT);
    return;
  }
  // Only repository owner edits inside the five fixed slots can enqueue work.
  if (source.user?.login !== owner) {
    core.info('Non-owner instruction slot edit ignored: '+commentId);
    return;
  }
  if (source.body.trim() === PROMPT) return;

  const {recordText}=splitComment(source.body);
  const intakeIssue=(await github.rest.issues.get({owner,repo,issue_number:INTAKE_ISSUE})).data;
  const {template,registry}=readDefinition(intakeIssue.body);
  let record,error;
  try {record=JSON.parse(recordText);}
  catch {error='Invalid JSON';}
  if (!error) error=validateIntake(record,template,registry);

  const queued=await listQueue(github,owner,repo);
  const nonce=!error ? record['nonce[string]'] : null;
  const matching=[];
  for (const comment of queued) {
    let job;
    try {job=JSON.parse(comment.body);} catch {continue;}
    if (!isObject(job) || nonceFor(job)!==nonce || nonce===null) continue;
    matching.push({comment,job});
  }
  if (!error && matching.length>1) error='Duplicate nonce found in multiple queued records';
  if (!error && matching.length && sourceFor(matching[0].job).commentId!==commentId) {
    error='Nonce already belongs to another source comment';
  }
  if (!error && matching.length &&
      (matching[0].job['schema[string]'] ?? matching[0].job.schema)!==template['schema[string]']) {
    error='Nonce belongs to a different record version';
  }

  if (error) {
    // Slots are reusable: a previous queued job sharing the source ID
    // is unrelated to this attempted new instruction. Never cancel it.
    await writeAndVerify({github,owner,repo,commentId,body:addError(source.body,error)});
    core.info('Invalid slot '+commentId+': '+error);
    return;
  }

  // A repeated nonce from the same slot is the SAME job, not new work.
  let queueId;
  if (matching.length) {
    queueId=matching[0].comment.id;
  } else {
    const job=clone(record);
    job['source[object<Source>]']['issue[number]']=INTAKE_ISSUE;
    job['source[object<Source>]']['comment_id[number|null]']=commentId;
    job['execution[object<Execution>]']['status[string]']='pending';
    job['execution[object<Execution>]']['enqueued_at[string|null]']=new Date().toISOString();
    const body=JSON.stringify(job,null,2);
    const posted=await github.rest.issues.createComment({owner,repo,issue_number:QUEUE_ISSUE,body});
    queueId=posted.data.id;
  }

  const verified=(await github.rest.issues.getComment({owner,repo,comment_id:queueId})).data;
  let accepted;
  try {accepted=JSON.parse(verified.body);} catch {throw new Error('Invalid queued JSON after transfer');}
  if (nonceFor(accepted)!==nonce || sourceFor(accepted).commentId!==commentId ||
      sourceFor(accepted).issue!==INTAKE_ISSUE) {
    throw new Error('Queue readback failed for source '+commentId+' and nonce '+nonce);
  }

  // Ledger must verify before the source slot is cleared for reuse.
  const currentQueue=await listQueue(github,owner,repo);
  if (!currentQueue.some(c=>c.id===queueId)) throw new Error('Verified job missing from queue listing');
  await refreshLedger({github,owner,repo,queue:currentQueue});
  await writeAndVerify({github,owner,repo,commentId,body:PROMPT});
  core.info('Transferred slot '+(SLOT_IDS.indexOf(commentId)+2)+' source '+commentId+
    ' to Issue #2 job '+queueId+', logged it, and reset slot to prompt.');
}

module.exports={run,refreshLedger,writeAndVerify};
