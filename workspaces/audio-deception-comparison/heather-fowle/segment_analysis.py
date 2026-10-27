"""Windowed inference using the exact pinned 13-mean-MFCC TruthDetection model.

Executed only in the restricted Github Actions container. Source WAVs read-only.
"""
import csv
import hashlib
import json
import os
from pathlib import Path

import joblib
import librosa
import numpy as np

ROOT = Path('/data/input')
OUT = Path('/data/output')
INV = Path('/data/inventory.json')
MODEL = Path('/models/truth/model.joblib')
EXPECTED = '6253a168da06148d86ddf4d7473d1a6f8048ff15e40a22cfd4ece27cd864a6a9'
REVISION = '63f1f11bf76fdfc8b433a99a566b6b2683c98af4'

assert os.environ.get('ALLOW_TRUSTED_MODEL_LOAD') == '1'
assert hashlib.sha256(MODEL.read_bytes()).hexdigest() == EXPECTED
model = joblib.load(MODEL)
entries = json.loads(INV.read_text())
assert len(entries) == 7
assert len(set(Path(e['wav']).name for e in entries)) == 7
assert set(map(int, model.classes_)) == {0, 1}, model.classes_

def predict(wave, sr):
    features = np.mean(librosa.feature.mfcc(y=wave, sr=sr, n_mfcc=13), axis=1).reshape(1, -1)
    label_raw = int(model.predict(features)[0])
    item = {
        'raw_prediction': label_raw,
        'label': 'True Story' if label_raw == 1 else 'Deceptive Story',
        'forest_vote_true': None,
        'forest_vote_deceptive': None,
        'votes_are_calibrated': False,
    }
    if hasattr(model, 'predict_proba'):
        votes = model.predict_proba(features)[0]
        p = {int(cls): float(v) for cls, v in zip(model.classes_, votes)}
        item['forest_vote_true'] = round(p[1], 6)
        item['forest_vote_deceptive'] = round(p[0], 6)
    return item

def windows(total, width, stride):
    if total <= width:
        return [(0.0, total)]
    stops = list(np.arange(0, total - width + 0.0000001, stride).round(4))
    last = round(total - width, 4)
    if last - stops[-1] > 0.05:
        stops.append(last)
    return [(float(st), round(min(total, float(st) + width), 4)) for st in stops]

all_windows = []
whole = []
for n, entry in enumerate(entries, 17):
    name = Path(entry['wav']).name
    assert name.endswith('.wav') and '/' not in name
    fp = ROOT / name
    assert fp.is_file()
    y, sr = librosa.load(str(fp), sr=None, mono=True)
    assert sr == 16000 and len(y) > 0
    duration = len(y) / sr
    source_sha = hashlib.sha256(fp.read_bytes()).hexdigest()
    full = predict(y, sr)
    expected_whole = [0, 1, 0, 0, 0, 0, 0][n - 17]
    whole.append(dict(number=n, filename=name, seconds=round(duration, 4), sha256=source_sha,
                      expected_previous_prediction=expected_whole,
                      exact_previous_result_reproduced=(full['raw_prediction'] == expected_whole), **full))
    for mode, width, stride in [('30s', 30.0, 5.0), ('10s', 10.0, 5.0)]:
        for start, end in windows(duration, width, stride):
            section = y[int(round(start * sr)):int(round(end * sr))]
            assert len(section) > 0
            result = predict(section, sr)
            all_windows.append({
                'recording': n, 'filename': name, 'mode': mode,
                'requested_window_seconds': width, 'step_seconds': stride,
                'start_seconds': start, 'end_seconds': end,
                'duration_seconds': round(end - start, 4),
                'partial_recording': (end - start + 0.01 < width),
                **result,
            })

assert len(whole) == 7
assert all(item['exact_previous_result_reproduced'] for item in whole), 'Whole-recording prediction mismatch'
assert all(w['raw_prediction'] in (0, 1) for w in all_windows)
OUT.mkdir(parents=True, exist_ok=True)
report = {
    'schema': 'issuestack.heather-seven-window-analysis.v1',
    'model': 'sangambhamare/TruthDetection',
    'model_revision': REVISION,
    'model_sha256': EXPECTED,
    'source': 'Existing IssueStack WAV audio and wav-inventory.json (seven previously evaluated files)',
    'method': 'Per-window 13 MFCC averages; pinned RandomForest; modes 30s/5s and 10s/5s; remainder-aligned end windows.',
    'probability_note': 'Forest class votes are not calibrated probabilities of truthful speech.',
    'recordings': whole, 'windows': all_windows,
}
(OUT / 'segment_results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
with (OUT / 'segment_results.csv').open('w', newline='') as file:
    columns = ['recording', 'filename', 'mode', 'start_seconds', 'end_seconds',
               'duration_seconds', 'partial_recording', 'raw_prediction', 'label',
               'forest_vote_true', 'forest_vote_deceptive', 'votes_are_calibrated']
    writer = csv.DictWriter(file, fieldnames=columns)
    writer.writeheader()
    writer.writerows([{k: row.get(k) for k in columns} for row in all_windows])
print(json.dumps({'source_files': len(whole), 'windows': len(all_windows),
                  'whole_predictions_matched': sum(x['exact_previous_result_reproduced'] for x in whole),
                  'modes': {m:sum(x['mode']==m for x in all_windows) for m in ('30s','10s')}}))
