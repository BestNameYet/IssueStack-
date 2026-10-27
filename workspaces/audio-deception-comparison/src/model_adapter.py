"""TruthDetection adapter. Download only when explicitly enabled; joblib is trusted-code serialization."""
import json
import os
import sys

REPO = "sangambhamare/TruthDetection"


def predict(audio_path):
    if not audio_path.lower().endswith(".wav"):
        return {"status": "unsupported_audio_format", "model": REPO, "reason": "WAV required", "label": None, "score": None}
    if os.environ.get("ALLOW_TRUSTED_MODEL_DOWNLOAD") != "1":
        return {"status": "model_not_installed", "model": REPO, "reason": "Set ALLOW_TRUSTED_MODEL_DOWNLOAD=1 only after reviewing trusted joblib artifact", "label": None, "score": None}
    import joblib
    import librosa
    import numpy as np
    from huggingface_hub import hf_hub_download

    model_path = hf_hub_download(repo_id=REPO, filename="model.joblib", revision=os.environ.get("TRUTH_MODEL_REVISION", "main"))
    # joblib/pickle loading executes code: do not enable for untrusted artifacts.
    model = joblib.load(model_path)
    y, sr = librosa.load(audio_path, sr=None)
    if not len(y):
        return {"status": "invalid_audio", "model": REPO, "reason": "empty waveform", "label": None, "score": None}
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    features = np.mean(mfcc, axis=1).reshape(1, -1)
    predicted = int(model.predict(features)[0])
    return {"status": "ok", "model": REPO, "label": "True Story" if predicted == 1 else "Deceptive Story", "score": None, "raw_prediction": predicted, "score_calibrated": False}


if __name__ == "__main__":
    try:
        print(json.dumps(predict(sys.argv[1])))
    except Exception as exc:
        print(json.dumps({"status": "error", "model": REPO, "reason": str(exc), "label": None, "score": None}))
