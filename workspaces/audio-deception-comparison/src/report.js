export function makeReport({input, truth}) {
  if (!truth || typeof truth.status !== 'string') throw Error('TruthDetection status is required');
  return {
    schema: 'issuestack.audio-deception-comparison.v1',
    input: {kind:'audio', filename:input},
    models: {truthDetection:truth},
    comparison: {
      status: 'not_applicable_single_model',
      agreement: null,
      reason: 'Only one verified audio-only deception classifier is configured; no second prediction exists.'
    },
    limitations: [
      'An acoustic classifier does not establish whether a speaker is truthful.',
      'No video, facial, gesture or other non-audio features are accepted or imputed.',
      'Scores are uncalibrated unless separately validated on a representative dataset.',
      'The model was trained on a limited dataset and has not been independently validated for this input.'
    ]
  };
}
