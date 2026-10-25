'use strict';

const INTAKE_ISSUE = 1;
const QUEUE_ISSUE = 2;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

function templateFromBody(body) {
  const fence = String.fromCharCode(96).repeat(3);
  const match = String(body || '').match(new RegExp(fence + 'json\\s*([\\s\\S]*?)\\s*' + fence, 'i'));
  if (!match) throw new Error('Issue #1 has no fenced JSON template; no comments will be modified.');
  let template;
  try { template = JSON.parse(match[1]); }
  catch { throw new Error('Issue #1 JSON template cannot be parsed; no comments will be modified.'); }
  if (!isObject(template) || typeof template.schema !== 'string' || !template.schema) {
    throw new Error('Issue #1 template has no usable schema identifier.');
  }
  if (!isObject(template.source) || template.source.issue !== INTAKE_ISSUE ||
      !isObject(template.execution) || !isObject(template.completion)) {
    throw new Error('Issue #1 template is missing mandatory routing/completion sections.');
  }
  return template;
}

function nullRecord(template) {
  if (isObject(template)) return Object.fromEntries(Object.keys(template).map(key => [key, nullRecord(template[key])]));
  return null;
}

function validateShape(value, model, path = '$') {
  if (isObject(model)) {
    if (!isObject(value)) return path + ': expected object';
    const expected = Object.keys(model);
    if (Object.keys(value).some(key => !Object.hasOwn(model, key)) || expected.some(key => !Object.hasOwn(value, key))) {
      return path + ': keys do not match the current record template';
    }
    for (const key of expected) {
      const problem = validateShape(value[key], model[key], path + '.' + key);
      if (problem) return problem;
    }
    return null;
  }
  if (Array.isArray(model)) return Array.isArray(value) ? null : path + ': expected array';
  if (model === null) return value === null ? null : path + ': reserved value must be null on intake';
  return typeof value === typeof model && (typeof value !== 'string' || value.trim())
    ? null : path + ': expected nonempty ' + typeof model;
}

function validateIntake(value, template) {
  if (!isObject(value)) return 'top-level JSON object required';
  if (value.schema !== template.schema) return 'record schema/version does not match the live Issue #1 template';
  const problem = validateShape(value, template);
  if (problem) return problem;
  if (value.source.issue !== INTAKE_ISSUE || value.source.comment_id !== null) return 'source metadata must be unfilled on intake';
  if (value.ordinal !== null) return 'ordinal override is not documented for intake';
  if (value.execution.status !== 'pending' || value.execution.enqueued_at !== null ||
      value.execution.started_at !== null || value.execution.finished_at !== null ||
      value.execution.worker !== null) return 'execution fields must have initial intake values';
  if (value.completion.success !== null || value.completion.receipt !== null ||
      value.completion.by_requirement.length || value.completion.validation.length ||
      value.completion.errors.length || value.completion.artifacts.length ||
      value.completion.summary !== null) return 'completion fields are reserved for workers';
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(value.nonce)) return 'nonce must be a unique identifier';
  for (const s of [value.nonce, value.interpretation.revised_instruction,
    ...Object.values(value.interpretation.user_intent)]) {
    if (typeof s !== 'string' || !s.trim() || /^<.*>$/.test(s.trim())) return 'replace all instruction/intent placeholders';
  }
  if (!Array.isArray(value.requirements) || !Array.isArray(value.constraints) ||
      !Array.isArray(value.decomposition)) return 'requirements, constraints and decomposition must be arrays';
  const ids = new Set();
  for (const r of value.requirements) {
    if (!isObject(r) || typeof r.id !== 'string' || !r.id.trim() || ids.has(r.id) ||
        typeof r.description !== 'string' || !r.description.trim() ||
        !Array.isArray(r.acceptance_criteria) || !r.acceptance_criteria.length ||
        r.acceptance_criteria.some(a => typeof a !== 'string' || !a.trim())) return 'invalid requirement ID, text, or acceptance criteria';
    ids.add(r.id);
  }
  for (const c of value.constraints) {
    if (!isObject(c) || typeof c.id !== 'string' || !c.id.trim() ||
        typeof c.description !== 'string' || !c.description.trim() ||
        !Array.isArray(c.applies_to_requirement_ids) ||
        c.applies_to_requirement_ids.some(id => !ids.has(id))) return 'invalid constraint or requirement reference';
  }
  if (!Array.isArray(value.completion.remaining_requirement_ids) ||
      new Set(value.completion.remaining_requirement_ids).size !== value.completion.remaining_requirement_ids.length ||
      value.completion.remaining_requirement_ids.some(id => !ids.has(id)) ||
      value.requirements.some(r => !value.completion.remaining_requirement_ids.includes(r.id))) {
    return 'remaining_requirement_ids must contain every outstanding requirement ID exactly once';
  }
  if (value.decomposition.length || value.planning.status !== 'not_started') return 'decomposition belongs to the job queue planner';
  if (!isObject(value.unrequested_changes) || Object.values(value.unrequested_changes).some(x => !Array.isArray(x) || x.length)) {
    return 'unrequested change audits must be empty at intake';
  }
  return null;
}

async function run({github, context, core}) {
  if (context.eventName !== 'issue_comment' || !['created', 'edited'].includes(context.payload.action) ||
      context.payload.issue?.number !== INTAKE_ISSUE || context.payload.issue?.pull_request) return;
  const owner = context.repo.owner, repo = context.repo.repo, commentId = context.payload.comment.id;
  // Only the repository owner may submit executable jobs.
  const source = (await github.rest.issues.getComment({owner, repo, comment_id:commentId})).data;
  if (source.user?.login !== owner) {
    core.info('Skipping unauthorized Issue #1 comment ' + commentId);
    return;
  }
  const intakeIssue = (await github.rest.issues.get({owner,repo,issue_number:INTAKE_ISSUE})).data;
  const model = templateFromBody(intakeIssue.body);
  let record, error;
  try { record = JSON.parse(source.body); }
  catch { error = 'invalid JSON'; }
  if (!error) error = validateIntake(record, model);

  const queuedComments = await github.paginate(github.rest.issues.listComments,
    {owner,repo,issue_number:QUEUE_ISSUE,per_page:100});
  const matchingSource = [];
  const matchingNonce = [];
  for (const c of queuedComments) {
    let job;
    try { job = JSON.parse(c.body); } catch { continue; }
    if (!isObject(job)) continue;
    if (job.source?.issue === INTAKE_ISSUE && job.source?.comment_id === commentId) matchingSource.push({comment:c, job});
    if (!error && job.nonce === record.nonce) matchingNonce.push({comment:c, job});
  }
  if (matchingSource.length > 1) throw new Error('Multiple existing queue jobs reference one source comment; manual repair required.');
  if (!error && matchingNonce.some(m => m.job.source?.comment_id !== commentId)) error = 'duplicate nonce belongs to another source comment';

  if (error) {
    // Edited invalid source cannot leave an unstarted queued job runnable.
    const prior = matchingSource[0];
    if (prior && prior.job.execution?.status === 'pending') {
      const blocked = clone(prior.job);
      blocked.execution.status = 'blocked';
      blocked.completion.summary = 'Source intake entry failed validation after edit; queue job blocked.';
      const body = JSON.stringify(blocked, null, 2);
      await github.rest.issues.updateComment({owner,repo,comment_id:prior.comment.id,body});
      const persisted = (await github.rest.issues.getComment({owner,repo,comment_id:prior.comment.id})).data;
      if (persisted.body !== body) throw new Error('Failed to verify blocked queued job');
    }
    const resetBody = JSON.stringify(nullRecord(model), null, 2);
    if (source.body !== resetBody) {
      await github.rest.issues.updateComment({owner,repo,comment_id:commentId,body:resetBody});
      const persisted = (await github.rest.issues.getComment({owner,repo,comment_id:commentId})).data;
      if (persisted.body !== resetBody) throw new Error('Failed to verify null-record replacement');
    }
    core.info('Intake ' + commentId + ' rejected (' + error + '); null record written.');
    return;
  }

  const existing = matchingSource[0];
  if (existing && !['pending','blocked'].includes(existing.job.execution?.status)) {
    core.info('Intake ' + commentId + ' already has an active or completed job; not overwriting its record.');
    return;
  }
  const job = clone(record);
  job.source.issue = INTAKE_ISSUE;
  job.source.comment_id = commentId;
  job.execution.enqueued_at = existing?.job.execution?.enqueued_at || new Date().toISOString();
  job.execution.status = 'pending';
  const body = JSON.stringify(job, null, 2);
  let queuedCommentId;
  if (existing) {
    queuedCommentId = existing.comment.id;
    if (existing.comment.body !== body) {
      await github.rest.issues.updateComment({owner,repo,comment_id:queuedCommentId,body});
    }
  } else {
    const posted = await github.rest.issues.createComment({owner,repo,issue_number:QUEUE_ISSUE,body});
    queuedCommentId = posted.data.id;
  }
  const confirmed = (await github.rest.issues.getComment({owner,repo,comment_id:queuedCommentId})).data;
  if (confirmed.body !== body) throw new Error('Queue publication read-back mismatch');
  core.info('Accepted Issue #1 comment ' + commentId + ' to Issue #2 comment ' + queuedCommentId + ' (' + model.schema + ').');
}

module.exports = {run, templateFromBody, nullRecord, validateShape, validateIntake};
