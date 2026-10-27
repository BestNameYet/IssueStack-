# Seven-recording interactive review

## Purpose and architecture

This package implements setup job [6451109030](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6451109030). It installs a substantive audio-review procedure supporting the existing analysis assignment [6449290116](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6449290116).

The static setup job uses Issue #1 -> Issue #2 plus its Issue #3 scratchpad. The independently authored declaration uses Issue #1 -> Issue #13 only. No worker tool execution is performed by the procedure handler: an authorized operator reads the instruction, performs the work, and submits a typed result. The bot validates and records it and projects the next step.

The existing sequential JSON engine is retained. Adding a new UI/server or changing the runtime was unnecessary for this first operational procedure. The earlier two-step demo at Issue #13 comment 6395079815 remains historical.

## Introduction and installation

1. Read current AGENTS.md, Issue #6 indexed procedure/intake instructions and this package. The root README.md was absent at setup; the audio workspace README was read.
2. Validate seven-recordings.v1.json using src/procedure-documents.js validateDeclaration.
3. Read one of the permanent intake slots (6392297975, 6392352070, 6392385256, 6392425260, 6392431658) and use it only if its body is exactly "Please enter instruction." Do not create a new Issue #1 comment.
4. Edit that slot to the bare declaration JSON. For this installed instance retain nonce heather-sam-seven-interactive-review-6451109030-v1. An intentional new independent instance needs a new nonce.
5. Verify the same nonce/source ID in the new Issue #13 hidden state, initial revision 0 and first instruction; verify PROCEDURE:<comment-id> in ledger 6392246635 and slot reset. Publication alone is insufficient.
6. Same-nonce replay must use the original source slot and unchanged declaration. It resumes the existing instance and does not reset accepted returns. Do not reuse the nonce from another slot.

## Eight steps

| Step | Operator | Output |
| --- | --- | --- |
| verify_sources | Agent | Seven source identities, artifact hashes, offsets, counts and follow-up items |
| configure_review | User through agent | Explicit review order and configuration |
| align_transcripts | Agent | Versioned alignment, original/edited text, unresolved words |
| extract_claims | Agent | Timestamped contextual claims with original source references |
| join_windows | Agent | All intersecting stored windows and coverage audit |
| review_findings | User through agent | Explicit acceptance or correction requests |
| assemble_report | Agent | Chronological report, CSV/JSON and audio-linked preview |
| verify_delivery | Agent | Independent final checks and change-review status |

Proposed configuration: all recordings 17-23; both existing 10-second and 30-second windows at 5-second steps; claim-level units; original plus corrected text. User chooses chronological order or transitions first (17/18/22). The procedure requests confirmation of this configuration. Existing results are reused. No website deployment or server launch is part of this procedure.

## How to answer a step

Read the current permanent Issue #13 comment immediately before editing. Use its projected revision, step_id and return_schema. Preserve every byte outside the JSON inside ISSUESTACK_AGENT_ANSWER_START and ISSUESTACK_AGENT_ANSWER_END, including the fences and tag text.

Submit exactly these four keys:
- revision: current integer revision.
- step_id: current exact step ID.
- submission_id: a fresh unique identifier for that attempted answer.
- return_value: recursively matches the declared return schema.

After the authorized edit, wait for the issue_comment workflow. Reread the same comment ID. Acceptance means revision increased by exactly one, the exact submitted value/ID is in returns with accepted_at, the answer is reset, and the next step is projected. A tool write receipt or workflow success alone does not prove acceptance.

The workflow accepts owner-initiated Issue #13 edits; bot GITHUB_TOKEN writebacks do not trigger recursive runs. Do not substitute another credential for bot writebacks.

## Rejection, pause, recovery and concurrency

- Wrong types, stale revisions and reused submission IDs leave the step unchanged and show last_error. Read the current comment, correct only the answer and use a fresh submission ID.
- A protected-region edit is restored byte-for-byte to the prior comment. This is after-the-fact enforcement, not a lock; hidden HTML state is public in raw Markdown.
- Pause by submitting nothing. Resume by rereading the same comment and accepted history. Never reconstruct state from chat memory or reset a prior step.
- After a timeout, first reread. If the submission was accepted, proceed from the new revision. If still pending, inspect the exact workflow logs and current state before a bounded retry. Never fire several edits concurrently.
- The engine has no branch/back/cancel or semantic policy interpreter. In particular a correctly typed false value or empty array can pass type validation. The operator must apply the substantive conditions in each instruction before submitting.
- At user review steps, do not submit a rejection as an accepted typed step: preserve requests in the mapped job scratchpad, correct artifacts while retaining earlier versions and leave the step pending until the user explicitly accepts. Never generate a user answer.
- Run one procedure operator at a time. Current runtime reads latest comment plus event previousBody; concurrent edits are outside this acceptance test and must be treated as unsafe to advance.
- The full state lives in one GitHub comment. Keep large alignments/claims/reports in durable versioned artifacts and return URI/hash/counts rather than embedding the full dataset. Check rendered comment size before submission.
- Use immutable source copies before GitHub Actions artifacts expire (current input artifacts expire 2026-11-10). Artifact expiry blocks source-dependent steps until the same bytes are recovered and verified; never silently regenerate classifier labels.

## Source verification and interpretation

live-verification.json records the actual source-index return. ZIP digests were checked against GitHub metadata. Both downloaded JSON artifact manifests agree on all seven WAV identities; this does not claim independent WAV-byte rehashing. All 103 window intervals and 744 timed words were checked against artifact durations. Eight zero-duration words need listening review. Original transcript names/times come from wav-inventory.json; its rounded durations differ slightly from the analyzed WAV durations.

Speech and topic names must come from source audio and messages. Preserve original and edited wording separately. Display "TruthDetection: True Story" or "TruthDetection: Deceptive Story" against the exact stored interval and keep window IDs on claim joins. Do not fabricate new labels for isolated sentences. Source hashes, scope and unresolved items remain in the audit; the narrative presents speech, context and recorded outputs directly.

## Validation and evidence

CI runs:
    node --test src/interactive-procedures.test.js src/issue-1-intake.test.js
    node --test workspaces/audio-deception-comparison/procedures/verify-procedure.cjs

The added workflow runs on pushes to the isolated staging branch and relevant package changes. It uses Node 22 and read-only repository permission. It does not run inference, convert audio or deploy anything.

The live isolated test was introduced through Issue #1 with nonce audio-procedure-verification-6451109030-v1, at Issue #13 comment 6451189152. live-verification.json contains full before/submitted/after snapshots for wrong type, acceptance, stale revision, duplicate submission, protected-region restoration, resumption and completion, plus intake replay evidence. Automated tests validate those persisted snapshots but do not manufacture them. They supplement the exact GitHub readbacks.

## Completion and review

Procedure status complete means all eight typed returns were accepted, not automatic semantic correctness, publication approval, or closure of either static job. Follow the Issue #2/#3 handshake separately for job edits.

This package is staged for an exact-change retain/revert decision before promotion to main. The live installation is provisional and source-identical to the staged declaration. Historical test and transfer records must remain as audit evidence. Reverting the package does not erase public GitHub history; archive or mark the operational instance unused under an expressly authorized cleanup plan rather than tampering with hidden state. No deployed website or original audio is changed.
