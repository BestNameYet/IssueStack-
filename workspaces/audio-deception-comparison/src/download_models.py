"""Build-time pinned model download with SHA-256 verification; never deserialize here."""
import hashlib
import json
from pathlib import Path
import shutil

from huggingface_hub import hf_hub_download

REPO = "sangambhamare/TruthDetection"
REVISION = "63f1f11bf76fdfc8b433a99a566b6b2683c98af4"
EXPECTED_SHA256 = "6253a168da06148d86ddf4d7473d1a6f8048ff15e40a22cfd4ece27cd864a6a9"
DEST = Path("/models/truth/model.joblib")


def install():
    source = Path(hf_hub_download(repo_id=REPO, filename="model.joblib", revision=REVISION))
    data = source.read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    if actual != EXPECTED_SHA256:
        raise ValueError("Downloaded artifact hash differs from pinned SHA-256")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    # Write only verified bytes. No pickle/joblib import or inference at build time.
    DEST.write_bytes(data)
    manifest = {"repo": REPO, "revision": REVISION, "filename": DEST.name,
                "sha256": actual, "size_bytes": len(data), "loaded": False}
    DEST.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    print(json.dumps(install()))
