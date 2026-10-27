"""Timestamp words in the seven existing WAV recordings; no classifier inference.

Word offsets are exploratory ASR alignment, not manually certified.
"""
import hashlib
import json
from pathlib import Path
from faster_whisper import WhisperModel

ROOT=Path("workspaces/audio-deception-comparison/heather-fowle")
items=json.loads((ROOT/"wav-inventory.json").read_text())
assert len(items)==7 and len({r["wav"] for r in items})==7
model=WhisperModel("base.en",device="cpu",compute_type="int8",cpu_threads=4,num_workers=1)
rows=[]
for n,rec in enumerate(items,17):
    wav=ROOT/rec["wav"]
    assert wav.is_file()
    segments,info=model.transcribe(
        str(wav),beam_size=5,word_timestamps=True,vad_filter=False,
        condition_on_previous_text=False,temperature=0,
        language="en")
    words=[]
    for segment in segments:
        for w in (segment.words or []):
            token=w.word.strip()
            if token:
                words.append({
                    "word":token,
                    "start":round(float(w.start),3),
                    "end":round(float(w.end),3),
                    "asr_probability":round(float(w.probability),4)
                })
    assert words, f"No word timestamps for {n}"
    assert all(w["end"]>=w["start"]>=0 for w in words)
    rows.append({
        "recording":n,"date":rec["timestamp"],"source_ogg":rec["source"],
        "wav":rec["wav"],"wav_sha256":hashlib.sha256(wav.read_bytes()).hexdigest(),
        "model":"faster-whisper base.en","word_count":len(words),"words":words,
        "recognized_text":" ".join(w["word"] for w in words)
    })
    print(json.dumps({"recording":n,"word_count":len(words),
                      "first_word_sec":words[0]["start"],
                      "last_word_sec":words[-1]["end"]}),flush=True)
out=Path("word-timing-output")
out.mkdir(parents=True,exist_ok=True)
(out/"seven_word_timestamps.json").write_text(json.dumps(
    {"schema":"heather.seven.word-timestamps.v1",
     "method":"Faster-Whisper base.en word_timestamps=True; audio not changed",
     "note":"ASR-timed word hypotheses are not manually validated",
     "recordings":rows},ensure_ascii=False,indent=2)+"\n")
