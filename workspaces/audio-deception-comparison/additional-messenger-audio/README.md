# Additional recordings: WAV conversion and contextual evidence

**Result:** 87 previously unevaluated source files converted to 16 kHz, mono, signed 16-bit WAV, without modifying originals. 23 already evaluated recordings are EXCLUDED from conversions and delivered WAVs. There are 110 total unique audio sources, 87 eligible for this additional-recordings review.

## Outputs

- `wav_16khz_mono/`: original filenames replaced by their collision-free SHA-256 IDs with `.wav` extension.
- `wav_conversion_manifest.csv`: maps WAV names to original source filenames, duration, stream check, speech-activity screening, and earlier report membership.
- `additional_recordings_contextual_report.md`: all additional recording events with nearby sender-attributed messages and existing speech transcripts where available.
- `additional_conversations/`: separate contextual reports for each conversation with additional audio.
- `additional_recording_event_index.csv`: sortable index.
- `contextual_audio_events.jsonl`: all source-linked events including those belonging to the prior Heather report.
- `additional_recordings_context.jsonl`: only additional events, with all context data.
- `transcription_priority.csv`: untranscribed recording queue with local WAV names and likely speech estimates.
- `summary.json`: validation and counts.

## Integrity and interpretive limits

All transcript passages are **pre-existing, unverified ASR** from the preceding reconstruction, not new recordings transcribed in this work. For files without speech transcription, contextualization is limited to dated messages immediately before and after, clearly separated from spoken contents. No TruthDetection classification was executed; its model weights are not installed in this environment. `webrtcvad` flags possible voice activity and can mistake background sounds or miss quiet speech. It **cannot** determine deception or reliably prove a human spoke. The labels `True Story` and `Deceptive Story` must remain empty until a verifiable model run is performed.

Read `summary.json` and inspect a handful of WAVs before relying on results. Use source-derived timestamps and filenames rather than approximate matches.