# Audio deception-model comparison (candidate)

This isolated IssueStack workspace is a **staged, unapproved implementation**. No production deployment or actual inference validation has been completed.

## Models and modalities

- [sangambhamare/TruthDetection](https://huggingface.co/sangambhamare/TruthDetection): 13 MFCC means from WAV audio, scikit-learn random forest serialized as `model.joblib`. Model card claims MIT; independently verify file revision, artifact trust and license before executing untrusted joblib.
- [sato2ru/lie-to-me-detector](https://huggingface.co/sato2ru/lie-to-me-detector): expects facial emotion, voice, body-language and linguistic features (`model.pkl`, `scaler.pkl`, `feature_cols.json`). This **audio-only** CLI intentionally returns `unsupported_missing_modalities` rather than fabricating visual or language features.

## Build and run

```sh
docker build -t issuestack-audio-compare .
docker run --rm -v "$PWD/input:/data/input:ro" -v "$PWD/output:/data/output" -v "$PWD/model-cache:/models/hf" issuestack-audio-compare /data/input/sample.wav /data/output/report.json
docker run --rm --entrypoint npm issuestack-audio-compare test
```

Model weights are **not baked into the image**. By default the TruthDetection adapter reports `model_not_installed`. Downloading/loading a `joblib` model may execute arbitrary code; review and pin the specific Hugging Face commit and artifact before enabling `ALLOW_TRUSTED_MODEL_DOWNLOAD=1`. To opt in, add `-e ALLOW_TRUSTED_MODEL_DOWNLOAD=1 -e TRUTH_MODEL_REVISION=<reviewed-commit-sha>` after completing this review. Persist Hugging Face cache via `/models/hf`. Network is required on first download.

Audio recordings remain on user-provided mounts; do not upload private recordings or commit generated results. The image needs no always-on server. Reports use `issuestack.audio-deception-comparison.v1` and explicitly indicate unavailable models and modalities.

## Validation status

Contract tests are provided. Docker build, real-model inference, licenses/dependency resolution, feature-column fidelity, audio-format conversion and representative-data benchmarking **remain unverified**. Neither model is a forensic truth detector; model-card performance claims are not independent evaluations. Do not use classifications to make legal, employment or other consequential decisions.
