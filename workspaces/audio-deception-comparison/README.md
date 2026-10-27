# Audio-only deception classifier (IssueStack staging candidate)

This isolated workspace accepts **WAV audio only**. Exactly one experimentally trained acoustic deception model is configured. No detector that requires video, faces, gestures, body language, or other non-audio input is installed, imported, or represented as a second prediction. Consequently, a model-to-model comparison **cannot yet be computed**.

## Configured model and audited artifact

- [sangambhamare/TruthDetection](https://huggingface.co/sangambhamare/TruthDetection): 13 MFCC averages from WAV audio; scikit-learn Random Forest; labels `True Story` / `Deceptive Story`.
- Immutable Hugging Face revision: `63f1f11bf76fdfc8b433a99a566b6b2683c98af4`
- Weight filename: `model.joblib`
- Published SHA-256: `6253a168da06148d86ddf4d7473d1a6f8048ff15e40a22cfd4ece27cd864a6a9`
- The model card states MIT license and 91% accuracy, neither independently verified for this workspace. Its published inference code specifies `librosa.load(..., sr=None)` and 13 mean MFCCs.
- A pickle/joblib artifact is executable input. Pinning a hash does **not** make deserialization safe: review the precise file and run it only in an appropriate isolated environment.

## Build: install the verified model weights in the image

From this workspace directory:

```sh
docker build -t issuestack-audio-only .
```

The default `BUNDLE_TRUTH_MODEL=1` downloads `model.joblib` at the pinned immutable revision and checks its SHA-256 **without deserializing it**. If the download, hash validation or package installation fails, the image build fails. To build a lightweight test image without weights:

```sh
docker build --build-arg BUNDLE_TRUTH_MODEL=0 -t issuestack-audio-only-test .
```

## Run with consent and restricted privileges

```sh
mkdir -p input output
# Place a consensually recorded sample.wav into ./input
docker run --rm --network none --cap-drop ALL \
  -e ALLOW_TRUSTED_MODEL_LOAD=1 \
  -v "$PWD/input:/data/input:ro" -v "$PWD/output:/data/output" \
  issuestack-audio-only /data/input/sample.wav /data/output/report.json
```

The explicit environment setting authorizes deserialization of the pinned `joblib` model. Without it, the adapter reports `model_load_not_authorized`; without bundled weights, it reports `model_not_installed`. The image has no required always-on server. Reports and audio remain on external mounts.

```sh
docker run --rm --entrypoint npm issuestack-audio-only test
docker run --rm --entrypoint python issuestack-audio-only -m unittest discover -s tests -p 'test_*.py'
```

The versioned JSON report has `models.truthDetection` only and `comparison.status = "not_applicable_single_model"`, with `comparison.agreement = null`. No fabricated second result or missing-modality stand-in is included.

## Validation and limits

Source inspection and test code do **not** establish real inference. The staged candidate is not deployed to main. Record separately whether Docker built, the pinned weight was verified, unit tests passed, and an actual inference against a non-sensitive WAV succeeded. A label cannot establish the truthfulness of human speech; the source model's reported accuracy has not been independently replicated. False positives, language/accent bias and recording-condition sensitivity are possible. Never treat this as legal, employment or forensic evidence. Do not mount credentials into the container.

## GitHub Actions: isolated synthetic inference and persisted report

The staged [audio-only validation workflow](../../.github/workflows/audio-deception-comparison.yml) checks Node/Python contracts, builds Docker with pinned weight bytes, and tests that deserialization remains disabled by default. It then generates a **deterministic, artificial 220 Hz WAV** and explicitly opts into loading the checksum-verified model in a restricted container. The test requires `models.truthDetection.status == "ok"` and `raw_prediction` equal to 0 or 1; it checks the JSON schema and verifies that no second model or agreement is present. A sine wave is not speech: any label in this test is **technically meaningless for human truthfulness**.

The container's network is disabled, Linux capabilities are dropped, new privileges are forbidden, root filesystem is read-only, and the process runs as UID 65534 with constrained memory, CPUs and processes. This reduces but does not eliminate the risk of loading a `joblib` artifact. Production inference should only be enabled after reviewing the pinned serialization. **No person-recording is stored by CI.** The resulting `report.json` is mounted outside the container and uploaded as GitHub Actions artifact `truthdetection-synthetic-audio-smoke` with 7-day retention. View the run in the repository Actions tab and retrieve the named artifact to inspect the raw JSON; the transient image is not deployed or published to a registry.

For your own WAV, the Docker command above uses a local input/output volume. Do not use this classifier to assess guilt, witness credibility, employment suitability, or other consequential truth claims. Meaningful accuracy requires a separate, consenting, speaker-disjoint labeled evaluation set and calibration testing, neither provided here.
