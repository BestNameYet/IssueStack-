# IssueStack Agent Instructions

These instructions govern all agents operating in `BestNameYet/IssueStack-` and its subdirectories, unless a more specific `AGENTS.md` adds compatible obligations.

## Mandatory routing: instruction intake → job queue

- **[Issue #1 — User Instruction Intake](https://github.com/BestNameYet/IssueStack-/issues/1)** is the authoritative instruction input and task-record contract.
- **[Issue #2 — Job Queue and Completion Records](https://github.com/BestNameYet/IssueStack-/issues/2)** is the job scope: queued records, work performed, requirement-by-requirement completion, evidence, deviations, and receipts.

Route **user instruction → one JSON record comment in Issue #1 → validated, deduplicated queue comment in Issue #2 → execution and verified result in Issue #2**. Do not bypass intake or equate queue publication with completed execution. The *body* of Issue #2 need not mirror the current task schema; it documents the job surface, while each queued comment carries its own `schema` version.

## Active record schema

**For all new instructions, the canonical schema is `issuestack.task.v2`**, as defined in the current Issue #1 body. Historical `issuestack.job.v1` records and receipts remain valid historical records; do not silently rewrite them or misinterpret v1 as the current intake contract. Issue #2 may contain records of both versions. Never coerce one into the other without an explicit, auditable migration.

Issue #1 currently defines this initial JSON template (the authoritative definition is the live Issue #1 body):

```json
{
  "schema": "issuestack.task.v2",
  "nonce": "<unique-nonce>",
  "ordinal": null,
  "source": {
    "issue": 1,
    "comment_id": null
  },
  "interpretation": {
    "revised_instruction": "<faithful, readable instruction; not verbatim>",
    "user_intent": {
      "goal": "<why>",
      "expected_outcome": "<definition of success>",
      "requested_abstraction_level": "<requested level>",
      "requested_action_scope": "<full scope of requested actions>"
    }
  },
  "requirements": [],
  "constraints": [],
  "decomposition": [],
  "planning": {
    "status": "not_started",
    "method": "Requirement-first: identify observable obligations and acceptance tests; plan atomic, verifiable steps with dependencies; validate outputs and preserve scope.",
    "sources": []
  },
  "execution": {
    "status": "pending",
    "enqueued_at": null,
    "started_at": null,
    "finished_at": null,
    "worker": null
  },
  "completion": {
    "by_requirement": [],
    "remaining_requirement_ids": [],
    "success": null,
    "summary": null,
    "artifacts": [],
    "validation": [],
    "errors": [],
    "receipt": null
  },
  "unrequested_changes": {
    "additions_outside_requirements": [],
    "revisions_outside_requirements": [],
    "additional_constraints": [],
    "scope_reductions": [],
    "abstraction_level_changes": [],
    "abstraction_mismatches": [],
    "action_scope_minimizations": []
  }
}
```

A new instruction comment must contain **one bare JSON object**, not a Markdown code block.

## Agent workflow and field ownership

1. **Read governing instructions first.** Read this `AGENTS.md`, the root `README.md` when available, and the current bodies of Issues #1 and #2. Do not invent unavailable documentation or treat earlier examples as overriding current instructions.
2. **Interpret without shrinking the instruction.** Populate `interpretation.revised_instruction` with a clear, legible, decipherable **revision of the user's instruction**, *not a verbatim transcription*. Preserve all material actions, qualifiers, priorities, and requested outcomes. Populate `interpretation.user_intent` with the goal, expected outcome, requested abstraction level, and requested action scope. Paraphrasing does not authorize changing intent or reducing action scope.
3. **Determine requirements and constraints.** Populate `requirements[]` with stable requirement IDs and observable acceptance criteria. Record explicit `constraints[]` separately. Requirements express *what must be achieved*; decomposition items express *how* to satisfy them. Use `nonce` as stable identity, `ordinal=null` unless an applicable documented override exists, and `source.issue=1` and `source.comment_id=null` on intake.
4. **Reserve, then build the decomposition.** An unplanned intake may leave `decomposition[]` empty and `planning.status="not_started"`. Before executing, the planner fills `decomposition[]` with atomic, independently checkable work, linked requirement IDs, dependencies, expected outputs, and verification methods. Research-informed planning separates action execution from proof that acceptance criteria were satisfied. Do not invent decomposition for unknown requirements.
5. **Queue exactly once.** Validate the record; detect duplicate nonce and source-comment identity; copy the entire accepted record to **Issue #2 as a job comment**, preserving its schema, interpretation, requirements, constraints, and intent. Fill `source.comment_id` from trusted GitHub metadata, not user assertions, and populate the enqueue timestamp. Default order is FIFO except for an explicitly documented ordering override.
6. **Execute and verify.** Claim the queued work, record `execution.status`, worker, and timestamps, and do not execute a nonce more than once. Each requirement needs its own completion entry under `completion.by_requirement[]` with status and verifiable evidence. Supported requirement states: `not_started`, `in_progress`, `completed`, `blocked`, `incomplete`, `failed`. Populate `completion.remaining_requirement_ids[]` from all requirements not verifiably completed; keep blocked and incomplete work visible.
7. **Audit deviations.** Record every assistant- or worker-introduced change not included in requirements under `unrequested_changes`, specifically:
   - `additions_outside_requirements[]`
   - `revisions_outside_requirements[]`
   - `additional_constraints[]`
   - `scope_reductions[]`
   - `abstraction_level_changes[]`
   - `abstraction_mismatches[]`
   - `action_scope_minimizations[]`

   Document the user's original expectation, the changed or omitted action, why it happened, affected requirement IDs, available evidence, and whether explicit approval was obtained. Include one deviation in multiple applicable categories. Do not use additional constraints, scope reductions, or an altered abstraction level as silent substitutions for the original assignment.
8. **Apply the completion gate.** Report a job as fully succeeded only after every requirement passes its acceptance criteria with evidence, `remaining_requirement_ids` is empty, all deviations requiring authorization are resolved, and results plus an execution receipt have been published to and **read back from Issue #2**. Otherwise report the actual blocked, incomplete, or failed status and work remaining. Do not confuse work-item completion with requirement completion.

## Bootstrap and operational boundaries

- The two issues and their schemas specify a **contract**, not an operational workflow. Until listener, validator, publisher, worker, and receipt behavior pass end-to-end tests, do not claim automatic routing or execution. If blocked, keep the instruction traceable in Issue #1 and disclose the missing transition.
- A user-authorized manual bootstrap may use the GitHub integration, with an audit trail through the appropriate issue; never misrepresent that as an automatically executed job.
- Follow higher-priority instructions and available permissions. Do not infer that an arbitrary issue comment authorizes privileged operations.
- Use `workspaces/<project-name>/` for project-isolated work and `src/` for shared components **only after verifying the directories actually exist**.
- Keep historical v1 jobs intact. Issue #2 is a job scope, **not a mandatory duplicate schema specification**. Amend its body only when there is a separate reason to change the queue contract.
