'use strict';

const crypto = require('node:crypto');
const ROOT = 'workspaces/issue-comment-input-surface';
const INSTRUCTIONS = ROOT + '/instructions/';
const RECEIPTS = ROOT + '/receipts/';
const REPOSITORY = 'BestNameYet/IssueStack-';

const sha256 = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const keys = ['comment_id', 'issue_number', 'operation', 'text'];

function validateInstruction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length ||
      Object.keys(value).some(key => !keys.includes(key))) {
    throw new Error('Instruction must be one object with exactly four required properties');
  }
  if (!Number.isSafeInteger(value.issue_number) || value.issue_number < 1)
    throw new Error('Invalid issue_number');
  if (value.comment_id !== 'new' &&
      (!Number.isSafeInteger(value.comment_id) || value.comment_id < 1))
    throw new Error('Invalid comment_id');
  if (typeof value.text !== 'string' || !value.text.length)
    throw new Error('text must be a nonempty string');
  if (!['prepend', 'replace', 'append'].includes(value.operation))
    throw new Error('Invalid operation');
  return value;
}

function validatePath(path) {
  if (typeof path !== 'string' ||
      !/^workspaces\/issue-comment-input-surface\/instructions\/[A-Za-z0-9_.-]+\.json$/.test(path) ||
      path.includes('..')) {
    throw new Error('Instruction must be a JSON file directly under ' + INSTRUCTIONS);
  }
  return path;
}

function composeBody(before, instruction) {
  validateInstruction(instruction);
  if (instruction.comment_id === 'new') return instruction.text;
  if (instruction.operation === 'prepend') return instruction.text + before;
  if (instruction.operation === 'append') return before + instruction.text;
  return instruction.text;
}

async function enumerate({github, context}) {
  if (context.repo.owner + '/' + context.repo.repo !== REPOSITORY)
    throw new Error('Unexpected repository');
  if (context.actor !== context.repo.owner)
    throw new Error('Only repository owner-authored instructions may execute');
  if (context.eventName === 'workflow_dispatch') {
    return [validatePath(context.payload.inputs?.instruction_file)];
  }
  if (context.eventName !== 'push' || context.ref !== 'refs/heads/main')
    throw new Error('Unsupported workflow trigger or branch');
  const before = context.payload.before;
  if (!/^[0-9a-f]{40}$/i.test(before) || /^0+$/.test(before))
    throw new Error('Cannot safely inventory changed instructions from this push');
  const response = await github.rest.repos.compareCommits({
    ...context.repo, base: before, head: context.sha, per_page: 300
  });
  const files = response.data.files || [];
  if (files.length >= 300)
    throw new Error('Comparison may be truncated; refusing partial instruction execution');
  return [...new Set(files.filter(f =>
    ['added', 'modified', 'renamed'].includes(f.status) &&
    f.filename.startsWith(INSTRUCTIONS) && f.filename.endsWith('.json'))
    .map(f => validatePath(f.filename)))].sort();
}

async function readFile(github, context, path, ref) {
  const result = await github.rest.repos.getContent({
    ...context.repo, path, ...(ref ? {ref} : {})
  });
  if (Array.isArray(result.data) || result.data.type !== 'file' ||
      result.data.encoding !== 'base64' || !result.data.content)
    throw new Error('Not a readable repository file: ' + path);
  return {
    text: Buffer.from(result.data.content.replace(/\s/g, ''), 'base64').toString('utf8'),
    sha: result.data.sha
  };
}

async function getOptionalFile(github, context, path) {
  try { return await readFile(github, context, path); }
  catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function putFile(github, context, path, body, previousSha) {
  const result = await github.rest.repos.createOrUpdateFileContents({
    ...context.repo, path,
    message: 'Record Issue-comment input execution: ' + path,
    content: Buffer.from(body, 'utf8').toString('base64'),
    ...(previousSha ? {sha: previousSha} : {})
  });
  return result.data.content?.sha;
}

async function trackMetadata(github, context, path, content, purpose) {
  const metaPath = 'config/file-metadata.json';
  const file = await readFile(github, context, metaPath);
  const metadata = JSON.parse(file.text);
  if (!Array.isArray(metadata.files))
    throw new Error('Invalid file metadata structure');
  const nextRecord = {
    path, size_bytes: Buffer.byteLength(content, 'utf8'),
    sha256: sha256(content), purpose
  };
  const index = metadata.files.findIndex(entry => entry.path === path);
  if (index < 0) metadata.files.push(nextRecord);
  else metadata.files[index] = {...metadata.files[index], ...nextRecord};
  await putFile(github, context, metaPath, JSON.stringify(metadata, null, 2) + '\n', file.sha);
}

async function writeInstruction({github, context, core, instructionFile}) {
  validatePath(instructionFile);
  if (context.repo.owner + '/' + context.repo.repo !== REPOSITORY ||
      context.actor !== context.repo.owner)
    throw new Error('Instruction execution must originate from repository owner');
  const source = await readFile(github, context, instructionFile, context.sha);
  const instruction = validateInstruction(JSON.parse(source.text));
  const issue = (await github.rest.issues.get({
    ...context.repo, issue_number: instruction.issue_number
  })).data;
  if (issue.pull_request) throw new Error('Target must be an Issue, not a pull request');

  let oldBody = '';
  let existing = null;
  if (instruction.comment_id !== 'new') {
    existing = (await github.rest.issues.getComment({
      ...context.repo, comment_id: instruction.comment_id
    })).data;
    if (existing.issue_url !== issue.url)
      throw new Error('Specified comment does not belong to Issue #' + instruction.issue_number);
    oldBody = existing.body;
  }
  const newBody = composeBody(oldBody, instruction);
  const action = existing ? 'edited' : 'created';
  const receiptPath = RECEIPTS + sha256(context.sha + '\n' + instructionFile) + '.json';
  const priorReceipt = await getOptionalFile(github, context, receiptPath);
  if (priorReceipt) {
    const state = JSON.parse(priorReceipt.text);
    if (state.status === 'completed') {
      core.info('Instruction already completed; no second write or dispatch: ' + receiptPath);
      core.setOutput('applied', 'false');
      return {skipped: true, receiptPath};
    }
    throw new Error('Existing pending/invalid receipt; refusing non-idempotent retry: ' + receiptPath);
  }
  const record = {
    schema: 'issuestack.issue-comment-write-receipt.v1',
    status: 'pending', source_commit: context.sha, instruction_file: instructionFile,
    issue_number: instruction.issue_number, requested_comment_id: instruction.comment_id,
    operation: instruction.operation, action,
    old_body_sha256: existing ? sha256(oldBody) : null,
    intended_body_sha256: sha256(newBody),
    comment_id: existing?.id || null
  };
  const pendingContent = JSON.stringify(record, null, 2) + '\n';
  let receiptSha = await putFile(github, context, receiptPath, pendingContent);
  await trackMetadata(github, context, receiptPath, pendingContent,
    'Durable pending/completed execution receipt for a single Issue-comment instruction');

  // The pending receipt precedes any external mutation. If a subsequent step fails,
  // retry is blocked until the receipt is reconciled, avoiding duplicate appends.
  if (existing) {
    const latest = (await github.rest.issues.getComment({
      ...context.repo, comment_id: existing.id
    })).data;
    if (latest.body !== oldBody)
      throw new Error('Comment changed between preflight and write; pending receipt retained');
  }
  const writeResult = existing
    ? await github.rest.issues.updateComment({
        ...context.repo, comment_id: existing.id, body: newBody
      })
    : await github.rest.issues.createComment({
        ...context.repo, issue_number: instruction.issue_number, body: newBody
      });
  const commentId = writeResult.data.id;
  const saved = (await github.rest.issues.getComment({
    ...context.repo, comment_id: commentId
  })).data;
  if (saved.body !== newBody || saved.issue_url !== issue.url)
    throw new Error('Comment write verification failed; pending receipt retained');

  const completed = {...record, status: 'completed', comment_id: commentId,
    completed_body_sha256: sha256(saved.body)};
  const completedContent = JSON.stringify(completed, null, 2) + '\n';
  receiptSha = await putFile(github, context, receiptPath, completedContent, receiptSha);
  await trackMetadata(github, context, receiptPath, completedContent,
    'Durable pending/completed execution receipt for a single Issue-comment instruction');

  const event = {
    issue_number: instruction.issue_number, comment_id: commentId, action,
    body: newBody, previous_body: existing ? oldBody : null, receipt_path: receiptPath
  };
  core.setOutput('applied', 'true');
  core.setOutput('issue_number', String(instruction.issue_number));
  core.setOutput('comment_id', String(commentId));
  core.setOutput('action', action);
  core.setOutput('export_marker', String(newBody.includes('<!-- issue3-scratchpad-export-run:v1 -->')));
  core.setOutput('event', JSON.stringify(event));
  core.info('Verified Issue #' + instruction.issue_number + ' comment ' + commentId +
    ' ' + action + ' and committed receipt ' + receiptPath);
  return {event, receiptPath, receiptSha};
}

function adaptContext(context, encoded, allowed) {
  if (!encoded) return context;
  if (context.repo.owner + '/' + context.repo.repo !== REPOSITORY ||
      context.actor !== context.repo.owner)
    throw new Error('Only owner-authored workflow calls may synthesize Issue-comment events');
  const event = JSON.parse(encoded);
  if (!event || !Number.isSafeInteger(event.issue_number) ||
      !Number.isSafeInteger(event.comment_id) ||
      !['created', 'edited'].includes(event.action) ||
      !allowed.issues.includes(event.issue_number) ||
      !allowed.actions.includes(event.action) ||
      typeof event.body !== 'string' ||
      (event.action === 'edited' && typeof event.previous_body !== 'string'))
    throw new Error('Invalid routed Issue-comment event');
  // github-script's Context exposes repo/eventName/sha through prototype getters.
  // Object spread does not retain them, so materialize the interface explicitly.
  return {
    repo: {owner: context.repo.owner, repo: context.repo.repo},
    actor: context.actor, eventName: 'issue_comment',
    sha: context.sha, ref: context.ref,
    payload: {
      action: event.action,
      issue: {number: event.issue_number},
      comment: {id: event.comment_id, body: event.body},
      ...(event.action === 'edited' ? {changes: {body: {from: event.previous_body}}} : {})
    }
  };
}

module.exports = {validateInstruction, validatePath, composeBody, enumerate,
  writeInstruction, adaptContext};
