"""Download only reviewed immutable TruthDetection model bytes. Never deserialize."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from huggingface_hub import HfApi, hf_hub_download

MODEL_ID="sangambhamare/TruthDetection"

def install(base, revision):
    if not re.fullmatch(r"[0-9a-fA-F]{40}", revision):
        raise ValueError("Model revision must be a 40-character immutable commit SHA")
    info=HfApi().model_info(MODEL_ID, revision=revision)
    if info.sha.lower()!=revision.lower():
        raise ValueError("Remote revision changed")
    location=Path(base)/"truth"
    location.mkdir(parents=True,exist_ok=True)
    filename=hf_hub_download(repo_id=MODEL_ID,filename="model.joblib",revision=revision,local_dir=location)
    h=hashlib.sha256()
    with open(filename,"rb") as f:
        for block in iter(lambda: f.read(1024*1024),b""):
            h.update(block)
    manifest={"schema":"issuestack.audio-model-bundle.v1","repo":MODEL_ID,
              "revision":revision,"artifact":"truth/model.joblib","sha256":h.hexdigest(),
              "requires_explicit_trust_to_deserialize":True}
    (Path(base)/"bundle-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    return manifest

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--truth-revision",required=True)
    p.add_argument("--output",default="/opt/models")
    args=p.parse_args()
    print(json.dumps(install(args.output,args.truth_revision)))

if __name__=="__main__":
    main()
