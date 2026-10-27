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
## Candidate completion results — staging only (2026-10-27)

**Processing run:** https://github.com/BestNameYet/IssueStack-/actions/runs/40478574478 (success), artifact `12721604042` (7-day retention). This branch is a change-review candidate; main-branch publication remains subject to the IssueStack approval contract.

- **87** additional distinct audio files / **98** linked message events; **23** recordings from the earlier Heather evaluation excluded.
- **57** new ASR attempts: **54** generated transcript text and **3** returned no speech. **30** inherited transcripts still need independent speech verification.
- Pinned `sangambhamare/TruthDetection`: **84** recording-level outputs, comprising **21** `True Story` and **63** `Deceptive Story`. Three clips were withheld for speech review. These are program outputs, not independently established historical facts.
- One identical audio file was included under more than one Messenger sender, and some recordings have spoken identities different from the sending account. The detailed report distinguishes message sender from audio voice identity.
- The already-converted WAV files and original source archive were not modified on this branch. The workflow converted only the 87 additional files in its temporary runner environment, never the prior 23.

**Candidate outputs:** `contextual_review_all_87.md` (readable per-recording context and labels); `claims_87.jsonl` (summaries and contentions); `transcription_results.jsonl` (new ASR text and segment details); `truthdetection_results.jsonl` (per-file raw model output, hash, revision); `contextual_evaluation_records.jsonl` (original names, dates, events and context); `completion_summary.json` and `audit.json` (machine checks). Scripts are under `scripts/`; the processing workflow is `.github/workflows/other-messenger-audio-completion.yml`.

**Limitations:** ASR remains unverified, three clips need a human speech check, and model classifications do not verify factual truth. This repository is public; do not add further personal media without confirming distribution permissions.
