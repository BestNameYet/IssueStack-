'use strict';

// The record template is in Issue #1; named types are in src/types/.
const {readDefinition, validateShape, validateIntake} = require('./record-type-validator.js');
const {splitComment, addError} = require('./comment-error-tags.js');
const INTAKE_ISSUE = 1;
const QUEUE_ISSUE = 2;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

function sourceIdentity(job) {
  const source = job?.['source[object<Source>]'] || job?.source;
  return {issue:source?.['issue[number]'] ?? source?.issue,
          commentId:source?.['comment_id[number|null]'] ?? source?.comment_id};
}
function nonceOf(job) {return job?.['nonce[string]'] ?? job?.nonce;}
function statusOf(job) {return job?.['execution[object<Execution>]']?.['status[string]'] ?? job?.execution?.status ?? job?.queue?.status;}
function versionOf(job) {return job?.['schema[string]'] ?? job?.schema;}
function updateJobStatus(job, status, summary) {
  const copy=clone(job);
  if (copy['execution[object<Execution>]']) {
    copy['execution[object<Execution>]']['status[string]']=status;
    copy['completion[object<Completion>]']['summary[string|null]']=summary;
  } else if (copy.execution) {
    copy.execution.status=status;
    copy.completion.summary=summary;
  } else {
    copy.queue.status=status;
    copy.completion.summary=summary;
  }
  return copy;
}

async function run({github, context, core}) {
  if (context.eventName !== 'issue_comment' || !['created','edited'].includes(context.payload.action) ||
      context.payload.issue?.number !== INTAKE_ISSUE || context.payload.issue?.pull_request) return;
  const owner=context.repo.owner, repo=context.repo.repo, commentId=context.payload.comment.id;
  const source=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
  if (source.user?.login !== owner) {core.info('Non-owner intake ignored: '+commentId); return;}

  const issue=(await github.rest.issues.get({owner,repo,issue_number:INTAKE_ISSUE})).data;
  const {template, registry}=readDefinition(issue.body);
  const {recordText, hasErrorTag} = splitComment(source.body);
  let candidate,error;
  try {candidate=JSON.parse(recordText);}
  catch {error='Invalid JSON';}
  if (!error) error=validateIntake(candidate,template,registry);

  const queued=await github.paginate(github.rest.issues.listComments,{owner,repo,issue_number:QUEUE_ISSUE,per_page:100});
  const sameSource=[],sameNonce=[];
  for (const comment of queued) {
    let job;try {job=JSON.parse(comment.body);} catch {continue;}
    if (!isObject(job)) continue;
    const sourceRef=sourceIdentity(job);
    if (sourceRef.issue===INTAKE_ISSUE && sourceRef.commentId===commentId) sameSource.push({comment,job});
    if (!error && nonceOf(job)===candidate['nonce[string]']) sameNonce.push({comment,job});
  }
  if (sameSource.length>1) throw new Error('Duplicate queued jobs for same source; manual repair needed.');
  if (!error && sameNonce.some(ref=>sourceIdentity(ref.job).commentId!==commentId)) error='Nonce already assigned to another comment';
  if (!error && sameSource.length && nonceOf(sameSource[0].job)!==candidate['nonce[string]']) error='Existing source comment cannot change its job nonce';
  if (!error && sameSource.length && versionOf(sameSource[0].job)!==template['schema[string]']) error='Existing queue record is an earlier schema version; do not overwrite';

  if (error) {
    const existing=sameSource[0];
    if (existing && statusOf(existing.job)==='pending') {
      const body=JSON.stringify(updateJobStatus(existing.job,'blocked','Source entry invalidated by schema validation.'),null,2);
      await github.rest.issues.updateComment({owner,repo,comment_id:existing.comment.id,body});
      const confirmed=(await github.rest.issues.getComment({owner,repo,comment_id:existing.comment.id})).data;
      if (confirmed.body!==body) throw new Error('Unable to verify blocked queue job');
    }
    const body=addError(source.body,error);
    if (source.body!==body) {
      await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body});
      const confirmed=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
      if (confirmed.body!==body) throw new Error('Unable to verify tagged validation error');
    }
    core.info('Rejected Issue #1 comment '+commentId+': '+error+' (original entry retained).');
    return;
  }

  const existing=sameSource[0];
  if (existing && !['pending','blocked'].includes(statusOf(existing.job))) {
    const message='Queue job '+existing.comment.id+' is '+statusOf(existing.job)+'; source edits cannot replace active or completed work.';
    const body=addError(source.body,message);
    if (source.body!==body) {
      await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body});
      const confirmed=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
      if (confirmed.body!==body) throw new Error('Unable to verify tagged job-state warning');
    }
    core.info(message);
    return;
  }
  const job=clone(candidate);
  job['source[object<Source>]']['issue[number]']=INTAKE_ISSUE;
  job['source[object<Source>]']['comment_id[number|null]']=commentId;
  job['execution[object<Execution>]']['enqueued_at[string|null]'] =
    existing?.job?.['execution[object<Execution>]']?.['enqueued_at[string|null]'] || new Date().toISOString();
  job['execution[object<Execution>]']['status[string]']='pending';
  const body=JSON.stringify(job,null,2);
  let queuedId;
  if (existing) {
    queuedId=existing.comment.id;
    if (existing.comment.body!==body) await github.rest.issues.updateComment({owner,repo,comment_id:queuedId,body});
  } else {
    const posted=await github.rest.issues.createComment({owner,repo,issue_number:QUEUE_ISSUE,body});
    queuedId=posted.data.id;
  }
  const verified=(await github.rest.issues.getComment({owner,repo,comment_id:queuedId})).data;
  if (verified.body!==body) throw new Error('Failed to verify queue publication');
  if (hasErrorTag) {
    // A corrected instruction no longer carries an obsolete validator diagnostic.
    await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body:recordText});
    const cleaned=(await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
    if (cleaned.body!==recordText) throw new Error('Unable to verify stale error tag removal');
  }
  core.info('Accepted '+commentId+' as Issue #2 job '+queuedId+' ('+template['schema[string]']+').');
}

module.exports={run,readDefinition,nullRecord,validateShape,validateIntake};
