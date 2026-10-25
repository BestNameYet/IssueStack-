'use strict';

// The first six GitHub comment IDs on Issue #1, pinned so deletion/reordering
// cannot silently promote a later comment into an authorized instruction slot.
const LEDGER_ID = 6392246635;
const SLOT_IDS = Object.freeze([
  6392297975, 6392352070, 6392385256, 6392425260, 6392431658
]);
const PROMPT = 'Please enter a new instruction.';
const REJECT = 'Use comments 2 through 6.';
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);

function sourceFor(record) {
  const source = record?.['source[object<Source>]'] || record?.source;
  return {issue:source?.['issue[number]'] ?? source?.issue,
    commentId:source?.['comment_id[number|null]'] ?? source?.comment_id};
}
function nonceFor(record) { return record?.['nonce[string]'] ?? record?.nonce; }

function entriesFromQueue(comments) {
  const entries = [];
  for (const comment of comments) {
    let job;
    try { job = JSON.parse(comment.body); } catch { continue; }
    if (!isObj(job)) continue;
    const source = sourceFor(job), nonce = nonceFor(job);
    if (source.issue !== 1 || !Number.isSafeInteger(source.commentId) ||
        typeof nonce !== 'string' || !nonce.length) continue;
    entries.push({queueId: comment.id, sourceId: source.commentId, nonce});
  }
  return entries.sort((a,b)=>a.queueId-b.queueId);
}

function renderLedger(queueComments, repositoryFullName) {
  const entries = entriesFromQueue(queueComments);
  const lines = [
    '# IssueStack — Verified Transfers',
    '',
    'This is comment 1, the transfer ledger. Use **comments 2 through 6** to enter new instructions.',
    'A transfer is listed only after the job comment exists in Issue #2 and has been verified.',
    'Job completion is tracked separately in Issue #2.',
    '',
    '## Transfers',
    ''
  ];
  const seen = new Set();
  for (const e of entries) {
    if (seen.has(e.queueId)) continue;
    seen.add(e.queueId);
    const slotNo = SLOT_IDS.indexOf(e.sourceId) + 2;
    const position = slotNo >= 2 ? 'slot ' + slotNo : 'historical source';
    const url = 'https://github.com/' + repositoryFullName + '/issues/';
    lines.push('- ' + position + ' — [source ' + e.sourceId + '](' + url + '1#issuecomment-' + e.sourceId +
      ') → [job ' + e.queueId + '](' + url + '2#issuecomment-' + e.queueId + ') — nonce \`' + e.nonce.replace(/[\r\n\`]/g, '') + '\`');
  }
  if (!entries.length) lines.push('_No verified transfers yet._');
  return lines.join('\n') + '\n';
}

module.exports={LEDGER_ID,SLOT_IDS,PROMPT,REJECT,entriesFromQueue,renderLedger,sourceFor,nonceFor};
