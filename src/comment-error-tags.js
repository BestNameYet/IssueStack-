'use strict';

// Visible bot-maintained diagnostics, appended below the original Issue #1 entry.
// Only a complete, trailing block is owned by the validator. Do not mutate
// or parse the text between these markers as part of the user's JSON.
const START = '!ISSUESTACK_ERROR_START';
const END = '!ISSUESTACK_ERROR_END';
const suffix = /(?:\r?\n){2}!ISSUESTACK_ERROR_START\r?\n([\s\S]*?)\r?\n!ISSUESTACK_ERROR_END[ \t]*(?:\r?\n)*$/;

function splitComment(body) {
  const source = String(body ?? '');
  const match = suffix.exec(source);
  return {recordText: match ? source.slice(0, match.index) : source,
    hasErrorTag: !!match, errorText: match ? match[1] : null};
}

function addError(body, error) {
  const recordText = splitComment(body).recordText;
  const message = String(error ?? 'Unknown validation error')
    .replace(/[\r\n\t]+/g, ' ').trim().slice(0, 1200);
  return recordText + '\n\n' + START + '\n' +
    'Validation error: ' + message + '\n' + END;
}

module.exports = {START, END, splitComment, addError};
