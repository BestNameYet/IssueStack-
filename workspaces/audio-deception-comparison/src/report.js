export function makeReport({input, model}) {
  if (!model || typeof model.status !== 'string') throw new TypeError('Expected model status');
  return {
    schema: 'issuestack.audio-deception-comparison.v2',
    input: {modality:'audio', filename:input},
    models: {truthDetection:model},
    comparison: {status:'not_applicable_single_model', agreement:null,
      reason:'No other validated audio-only deception classifier selected'},
    limitations: [
      'A voice classifier does not establish objective truthfulness.',
      'Model-card scores are not validated or calibrated truth probabilities.',
      'The multimodal Lie to Me detector was excluded at the user request.'
    ]
  };
}
