# IssueStack — Issue Purpose and Usage Inventory

**Repository:** [BestNameYet/IssueStack-](https://github.com/BestNameYet/IssueStack-)
**Snapshot date:** 2026-10-29 (repository state checked before staging this document)
**Scope:** All existing GitHub *issues*, including 13 original issue slots and the later exceptional Issue #30. Pull requests are distinguished separately.

> Interpret this as a documented inventory of purpose and observed usage, not an assertion that every workflow is fully deployed or operating end-to-end. Some issue titles still say "Reserved" even when their comments are functional.

## Original issue surfaces (#1–#13)

| Issue | Purpose | Observed current use / qualification |
| --- | --- | --- |
| [#1 — User Instruction Intake](https://github.com/BestNameYet/IssueStack-/issues/1) | Instruction intake and transfer ledger | Five reusable input comment slots accept typed task or procedure declarations; the first comment records verified transfers to Issue #2 (or Issue #13 for a declared procedure). A transfer is not completion. |
| [#2 — Job Queue](https://github.com/BestNameYet/IssueStack-/issues/2) | Executable task ledger and completion records | Stores job requirements, assigned workers, execution state, validation, evidence, deviation audits, and terminal receipts. Its first comment maps job IDs to Issue #3 scratchpads. |
| [#3 — Task Scratchpads](https://github.com/BestNameYet/IssueStack-/issues/3) | Per-job working context and handoff surface | One stable comment per job holds handshake evidence, plans, progress, test observations, review manifests and handoff notes. Completion archival is a separate check. |
| [#4 — Large-context Testbed](https://github.com/BestNameYet/IssueStack-/issues/4) | Large-comment retrieval and recall experiment | Fifteen large pseudo-random-text comments were used to test whether agents could locate and recall hidden content with constrained fetching. **Title still says unassigned**, which does not describe its comment use. |
| [#5 — Conversational UI](https://github.com/BestNameYet/IssueStack-/issues/5) | User/agent conversation transcript and projection source | Odd-position comments are user prompts, even-position comments are agent responses. The associated prompt-analysis JSON and bot-owned projections feed the two-pass UI pipeline. **Title still says unassigned.** |
| [#6 — Task Instruction Library](https://github.com/BestNameYet/IssueStack-/issues/6) | Indexed agent instruction pages | Permanent JSON comments store task procedures, schemas and examples; the [table of contents](https://github.com/BestNameYet/IssueStack-/issues/6#issuecomment-6426752191) maps subjects to their exact comment IDs. Root [AGENTS.md](https://github.com/BestNameYet/IssueStack-/blob/main/AGENTS.md) is the bootstrap. |
| [#7 — Second-pass Rearticulation](https://github.com/BestNameYet/IssueStack-/issues/7) | Paired prompt/answer semantic second return | Each comment relates an Issue #5 user/agent source pair and a typed second-pass agent return, which is validated before the UI projection. **Title still says unassigned.** |
| [#8 — Agent Nonce Registry](https://github.com/BestNameYet/IssueStack-/issues/8) | Agent identity and task tracking, with an unspecified second intended purpose | [Comment 6453773625](https://github.com/BestNameYet/IssueStack-/issues/8#issuecomment-6453773625) is the authoritative agent JSON source and generated table: nonce, name, current tasks, completed tasks and trust level. **A second future purpose is explicitly not specified.** Do not label it a context registry by inference. |
| [#9 — Reserved](https://github.com/BestNameYet/IssueStack-/issues/9) | No assigned operational purpose | Placeholder issue, no executable instruction defined. |
| [#10 — Reserved](https://github.com/BestNameYet/IssueStack-/issues/10) | No assigned operational purpose | Placeholder issue, no executable instruction defined. |
| [#11 — Reserved](https://github.com/BestNameYet/IssueStack-/issues/11) | No assigned operational purpose | Placeholder issue, no executable instruction defined. |
| [#12 — Reserved](https://github.com/BestNameYet/IssueStack-/issues/12) | No assigned operational purpose | Placeholder issue, no executable instruction defined. |
| [#13 — Declared Stepwise Procedures](https://github.com/BestNameYet/IssueStack-/issues/13) | Persistent typed multi-step procedures | Valid procedure declarations enter through Issue #1 and generate an Issue #13 comment, where bot instructions, an agent answer panel, and state progress through declared steps. These are separate from Issue #2 static jobs. |

## Additional GitHub issue

| Issue | Purpose | Observed use |
| --- | --- | --- |
| [#30 — Administrative exception record](https://github.com/BestNameYet/IssueStack-/issues/30) | Standalone record outside the original issue-slot architecture | Documents an agent's incorrect use of a standalone issue instead of the Issue #1 intake workflow. It is not another operating surface or a job queue. |

## GitHub numbering and pull requests

GitHub issues and pull requests share a single repository number sequence. **#14–#29 and #31 are pull requests, not additional reserved IssueStack operating slots.** Their subjects include UI/projection updates, instruction changes, registry work, and independent project implementations.

- [PR #31](https://github.com/BestNameYet/IssueStack-/pull/31) merged agent nonce registry strict-field validation and a pre-write stale-input guard on 2026-10-29.
- At this snapshot, the GitHub Issues API returned **31 numbered records: 14 actual issues and 17 pull requests**.
- The #8 context-registry experiment is not considered an active second purpose in this inventory. The current issue body expressly leaves the second intended purpose to be defined.

## Key operating distinctions

1. **Instruction receipt is not execution:** Issue #1 records transfer; Issue #2 tracks job execution and completion independently.
2. **Job completion is not archive completion:** Issue #3 scratchpad archival and queue-index updates require separate verification.
3. **Conversation is not an instruction library:** Issue #5 contains paired turns, Issue #7 holds second-pass records, Issue #6 contains permanent procedure instructions.
4. **Issue title is not sufficient:** read the issue body, relevant comments and GitHub workflow evidence before inferring purpose or operational success.
5. **Agent identities are not jobs:** Issue #8 nonce records list agents and tasks but do not replace Issue #2's typed queue or establish authority beyond approved scope.
6. **Reserved means not assigned:** Do not infer intended functions for #9–#12 or Issue #8's unspecified second purpose.

## Evidence and update protocol

- Source of truth: current issue bodies and permanent comment IDs, supplemented by repository [AGENTS.md](https://github.com/BestNameYet/IssueStack-/blob/main/AGENTS.md) and the [Issue #6 instruction TOC](https://github.com/BestNameYet/IssueStack-/issues/6#issuecomment-6426752191).
- This is a dated snapshot. When issue ownership, title, or actual workflow changes, refresh this document with links and a new verification date rather than silently treating historical notes as current.
- Counts include all issue records fetched via the GitHub Issues API at the snapshot; pull requests are not counted as operational issues.
