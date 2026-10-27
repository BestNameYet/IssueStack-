"""Contract tests do not import ML dependencies, download, or deserialize models."""
import hashlib
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from model_adapter import checked_artifact, predict, REPO, EXPECTED_SHA256


class AdapterContractTests(unittest.TestCase):
    def test_requires_wav(self):
        result = predict("input.mp4")
        self.assertEqual(result["status"], "unsupported_audio_format")
        self.assertEqual(result["model"], REPO)

    def test_absent_weights_are_not_a_prediction(self):
        with tempfile.TemporaryDirectory() as tmp:
            status, reason = checked_artifact(Path(tmp) / "absent.joblib")
        self.assertEqual(status, "model_not_installed")
        self.assertIn("not present", reason)

    def test_mismatched_digest_is_blocked_before_deserialization(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "model.joblib"
            path.write_bytes(b"unsafe/unreviewed bytes")
            with patch.dict(os.environ, {"ALLOW_TRUSTED_MODEL_LOAD": "1"}):
                status, _ = checked_artifact(path)
        self.assertEqual(status, "model_integrity_error")

    def test_opt_in_is_required_even_after_integrity_verification(self):
        # Avoid fabricating the actual 761 kB model; simulate only the digest
        # comparison. No third-party deserialization occurs in unit tests.
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "fake.joblib"
            path.write_bytes(b"fixture")
            with patch("model_adapter.EXPECTED_SHA256", hashlib.sha256(b"fixture").hexdigest()):
                with patch.dict(os.environ, {}, clear=True):
                    status, _ = checked_artifact(path)
        self.assertEqual(status, "model_load_not_authorized")


if __name__ == "__main__":
    unittest.main()
