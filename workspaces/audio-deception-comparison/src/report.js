export function makeReport({input, truth, lie}) {
  const status = x => x?.status === 'ok';
  return {
    schema: 'issuestack.audio-deception-comparison.v1',
    input: {kind:'audio', filename:input},
    models: {truthDetection:truth, lieToMe:lie},
    comparison: {
      status: status(truth)&&status(lie)?'comparable':'insufficient_modalities_or_model_unavailable',
      agreement:status(truth)&&status(lie)?truth.label===lie.label:null
    },
    limitations: [
      'Neither classifier establishes whether a speaker is truthful.',
      'Scores are uncalibrated unless separately validated on a representative dataset.',
      'Never impute missing visual or linguistic features from audio.'
    ]
  };
}
