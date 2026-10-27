"""Audio-only tests; do not deserialize untrusted models."""
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from model_adapter import predict

class AudioContract(unittest.TestCase):
    def test_invalid_extension(self):
        with tempfile.TemporaryDirectory() as t:
            f=pathlib.Path(t)/"a.mp3";f.write_bytes(b"synthetic")
            self.assertEqual(predict(f,t)["status"],"unsupported_audio_format")

    def test_missing_audio(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(predict(pathlib.Path(t)/"a.wav",t)["status"],"invalid_audio")

    def test_model_not_installed(self):
        with tempfile.TemporaryDirectory() as t:
            f=pathlib.Path(t)/"a.wav";f.write_bytes(b"RIFF synthetic")
            self.assertEqual(predict(f,t)["status"],"model_not_installed")

    def test_untrusted_artifact_not_loaded(self):
        with tempfile.TemporaryDirectory() as t:
            f=pathlib.Path(t)/"a.wav";f.write_bytes(b"RIFF synthetic")
            p=pathlib.Path(t)/"truth"/"model.joblib"
            p.parent.mkdir();p.write_bytes(b"untrusted synthetic")
            with patch.dict("os.environ",{"ALLOW_PICKLE_MODELS":"0"}):
                self.assertEqual(predict(f,t)["status"],"untrusted_model_not_approved")

if __name__=="__main__":
    unittest.main()
