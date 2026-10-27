"""Audio-only TruthDetection adapter. Never load an unchecked joblib artifact."""
import hashlib
import json
import os
from pathlib import Path
import sys

REPO = "sangambhamare/TruthDetection"
REVISION = "63f1f11bf76fdfc8b433a99a566b6b2683c98af4"
EXPECTED_SHA256 = "6253a168da06148d86ddf4d7473d1a6f8048ff15e40a22cfd4ece27cd864a6a9"
DEFAULT_PATH = Path("/models/truth/model.joblib")


def checked_artifact(path=DEFAULT_PATH):
    path = Path(path)
    if not path.is_file():
        return "model_not_installed", "Pinned TruthDetection model.joblib is not present in the container"
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        return "model_integrity_error", "Model file SHA-256 does not match the reviewed immutable source"
    if os.environ.get("ALLOW_TRUSTED_MODEL_LOAD") != "1":
        return "model_load_not_authorized", "joblib deserialization is disabled; explicitly set ALLOW_TRUSTED_MODEL_LOAD=1 after reviewing model safety"
    return None, None


def predict(audio_path):
    if not isinstance(audio_path, str) or not audio_path.lower().endswith(".wav"):
        return {"status": "unsupported_audio_format", "model": REPO, "reason": "WAV audio required", "label": None, "score": None}
    status, reason = checked_artifact()
    if status:
        return {"status": status, "model": REPO, "reason": reason, "label": None, "score": None}
    # Import and deserialize only after verifying exact model bytes and opt-in.
    import joblib
    import librosa
    import numpy as np
    model = joblib.load(DEFAULT_PATH)
    y, sr = librosa.load(audio_path, sr=None)
    if len(y) == 0:
        return {"status": "invalid_audio", "model": REPO, "reason": "empty waveform", "label": None, "score": None}
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    features = np.mean(mfcc, axis=1).reshape(1, -1)
    predicted = int(model.predict(features)[0])
    if predicted not in (0, 1):
        raise ValueError("unexpected TruthDetection prediction")
    label = "True Story" if predicted == 1 else "Deceptive Story"
    return {"status": "ok", "model": REPO, "revision": REVISION,
            "label": label, "score": None, "raw_prediction": predicted,
            "score_calibrated": False, "input_modality": "audio"}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("usage: model_adapter.py path/to/input.wav")
        print(json.dumps(predict(sys.argv[1])))
    except Exception as exc:
        print(json.dumps({"status": "error", "model": REPO,
                          "reason": str(exc), "label": None, "score": None}))
