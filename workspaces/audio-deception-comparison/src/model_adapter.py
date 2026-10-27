"""TruthDetection audio-only inference; joblib deserialization requires informed opt-in."""
import argparse
import json
import os
from pathlib import Path

MODEL_ID = "sangambhamare/TruthDetection"

def report(status, **extra):
    return {"model":MODEL_ID, "input_modality":"audio", "status":status,
            "raw_prediction":None, "normalized_label":None,
            "scores":None, "scores_calibrated":False, **extra}

def predict(audio, model_dir):
    audio = Path(audio)
    if audio.suffix.lower() != ".wav":
        return report("unsupported_audio_format", reason="WAV required")
    if not audio.is_file():
        return report("invalid_audio", reason="Input audio does not exist")
    artifact = Path(model_dir) / "truth" / "model.joblib"
    if not artifact.is_file():
        return report("model_not_installed", reason="Pinned model.joblib not bundled")
    if os.getenv("ALLOW_PICKLE_MODELS") != "1":
        return report("untrusted_model_not_approved",
                      reason="Review bundled joblib artifact; set ALLOW_PICKLE_MODELS=1 only if trusted")
    import numpy as np
    import librosa
    import joblib
    y, sr = librosa.load(str(audio), sr=None, mono=True, duration=30.0)
    if y.size == 0 or sr <= 0:
        return report("invalid_audio", reason="Empty or invalid waveform")
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    features = np.mean(mfcc, axis=1).reshape(1, 13)
    if not np.isfinite(features).all():
        return report("invalid_audio", reason="Nonfinite MFCC values")
    model = joblib.load(artifact)
    guess = model.predict(features)[0]
    raw = guess.item() if hasattr(guess, "item") else guess
    if raw not in (0, 1, "0", "1"):
        return report("unknown_label", raw_prediction=str(raw))
    label = "truthful" if raw in (1, "1") else "deceptive"
    scores = None
    if hasattr(model, "predict_proba") and hasattr(model, "classes_"):
        scores = [{"class":str(k), "uncalibrated_score":float(p)}
                  for k,p in zip(model.classes_, model.predict_proba(features)[0])]
    return report("ok", raw_prediction=str(raw), normalized_label=label,
                  scores=scores, preprocessing={"mfcc":13, "sample_rate":int(sr), "max_seconds":30})

def main():
    p=argparse.ArgumentParser()
    p.add_argument("audio")
    p.add_argument("--model-dir", default=os.getenv("MODEL_DIR", "/opt/models"))
    args=p.parse_args()
    try:
        output=predict(args.audio,args.model_dir)
    except Exception as exc:
        output=report("error",reason=type(exc).__name__+": "+str(exc)[:300])
    print(json.dumps(output, allow_nan=False))

if __name__=="__main__":
    main()
