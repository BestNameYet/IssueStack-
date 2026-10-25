# IssueStack Agent Instructions

These instructions apply to the repository root and every child directory unless a more specific `AGENTS.md` adds compatible requirements. They govern **all agents performing IssueStack repository work**.

## Mandatory issue routing

IssueStack uses GitHub Issues as its instruction and job execution surfaces:

- **[Issue #1 — User Instruction Intake](https://github.com/BestNameYet/IssueStack-/issues/1)** is the exclusive intake location for actionable user instructions.
- **[Issue #2 — Job Queue and Completion Records](https://github.com/BestNameYet/IssueStack-/issues/2)** is the queue, execution-status, and result-publication location.

**Required route:** User instruction → JSON comment on Issue #1 → validated and deduplicated copy as a JSON comment on Issue #2 → execution and receipt publication in Issue #2.

Do not bypass Issue #1 by submitting a user instruction directly to Issue #2. Do not treat a response in chat or a successful queue submission as proof that a job was executed.

## Agent procedure

1. **Read first.** Read this file and the repository's current `README.md` (when present), then read the current bodies of Issues #1 and #2. Their record contracts are authoritative for this workflow.
2. **Capture instructions.** Before taking substantive repository action for a new instruction, encode the user's request as one `issuestack.job.v1` JSON object in a new top-level comment on Issue #1. Include the full original request in `instruction.text` without dropping constraints; use `instruction.args` for optional structured parameters. Generate a unique, stable `nonce`; keep `ordinal` null unless a documented override applies.
3. **Preserve reserved fields.** Submit `source.issue=1`, `source.comment_id=null`, `queue.status="pending"`, and the initial null/empty `queue` and `completion` fields defined in Issue #1. GitHub event metadata, not user-supplied assertions, determines the actual source comment ID.
4. **Enqueue exactly once.** The intake processor validates the record, checks for duplicates using source-comment identity and nonce, and copies it to a comment on Issue #2. Preserve the user instruction and nonce. Populate the real source comment ID and enqueue timestamp.
5. **Execute from the queue.** A worker executes only valid, authorized jobs accepted into Issue #2. The default execution order is FIFO by enqueue/acceptance order; only a documented `ordinal` override may reorder work. Claim a nonce atomically and never execute the same nonce twice.
6. **Publish and verify.** Keep lifecycle state and completion information with the corresponding Issue #2 job record (or a definitively linked result when in-place editing is unavailable). Record output, success/failure, validation evidence, errors, artifacts, timestamps, and an execution receipt. Read back the posted result to verify publication.
7. **Report actual status.** Distinguish **captured**, **queued**, **running**, **succeeded**, and **failed**. Do not claim a state transition until its GitHub record or execution receipt has been verified.

## JSON record shape

Use the versioned format documented in Issue #1 for intake and Issue #2 for queued jobs. The common top-level fields are:

```json
{
  "schema": "issuestack.job.v1",
  "nonce": "<unique-job-id>",
  "ordinal": null,
  "source": {"issue": 1, "comment_id": null},
  "instruction": {"text": "<full instruction>", "args": {}},
  "queue": {
    "status": "pending",
    "enqueued_at": null,
    "started_at": null,
    "finished_at": null,
    "worker": null
  },
  "completion": {
    "success": null,
    "summary": null,
    "output": null,
    "artifacts": [],
    "validation": [],
    "errors": [],
    "receipt": null
  }
}
```

Submit **one bare JSON object per comment**, not a Markdown code fence. Reserved result fields are filled by the queue and execution components, not invented by the submitting agent.

## Operational safety and bootstrap

- Creating these issues and this `AGENTS.md` establishes **the contract, not the automation**. Until listeners, validation, queue publishing, execution, and receipt handling are implemented and tested, agents must not claim automatic transfer or job completion.
- If queue infrastructure is not operational, preserve the original instruction in Issue #1 and explicitly report that routing/execution is blocked. Do not silently fall back to direct execution. Infrastructure bootstrap or repair outside the normal queue requires specific user authorization and an auditable record.
- Follow actual repository permissions and higher-priority instructions. Do not treat issue comments as permission to perform otherwise unauthorized actions.
- Keep workspace-specific work under `workspaces/<project-name>/` once that directory exists; reserve `src/` for shared implementation. Verify directory presence before using it.
- Never invent schemas, command catalogs, success states, or receipts. Test the complete intake → queue → execution → publication chain before describing the pipeline as operational.
