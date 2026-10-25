# IssueStack Agent Instructions

These instructions govern all agents operating in `BestNameYet/IssueStack-` and its subdirectories, unless a more specific `AGENTS.md` adds compatible obligations.

## Mandatory routing: instruction intake → job queue

- **[Issue #1 — User Instruction Intake](https://github.com/BestNameYet/IssueStack-/issues/1)** is the authoritative instruction input and task-record contract.
- **[Issue #2 — Job Queue and Completion Records](https://github.com/BestNameYet/IssueStack-/issues/2)** is the job scope: queued records, work performed, requirement-by-requirement completion, evidence, deviations, and receipts.

Route **user instruction → one JSON record comment in Issue #1 → validated, deduplicated queue comment in Issue #2 → execution and verified result in Issue #2**. Do not bypass intake or equate queue publication with completed execution. The *body* of Issue #2 need not mirror the current task schema; it documents the job surface, while each queued comment carries its own `schema` version.

## Current task schema: `issuestack.task.v3`

Issue #1 defines the active record template, while named object types are stored in `src/types/issuestack.task.v3.json`; read both. The latest schema uses **literal bracket-annotated key names**. `issuestack.job.v1` and `issuestack.task.v2` records remain historical; preserve them without automatic conversion. The body of Issue #2 defines the job scope and does not need to be rewritten for every schema version.

**Mandatory exact-type invariant:** Every JSON object must have exactly its named type's keys, with zero missing and zero additional keys; every value must have the type declared by its field's bracket suffix. This is recursive at every level, including objects contained in arrays. Keys with different literal names identify different object types, even when their values share the same primitive types. Only the current `schema[string]` version is accepted on new intake comments.

Examples of the notation:

```text
schema[string]
source[object<Source>]
requirements[array<Requirement>]
receipt[object<Receipt>|null]
```

The type of an array element is **one named object type**, not merely `object`:

```json
{
  "id[string]": "R1",
  "description[string]": "Implement a verifiable requirement",
  "acceptance_criteria[array<AcceptanceCriterion>]": [
    {"text[string]": "A concrete acceptance condition must be satisfied"}
  ]
}
```

That example is one `Requirement` object, not an entire task record. The `Requirement` type defines the exact three field declarations shown; `AcceptanceCriterion` defines `text[string]`. A different field name, an omitted field, an added field, or an incorrect JSON value type is a hard validation failure. An empty array is valid structurally but every present item must match its declared named object type. For scalar lists, use typed object wrappers such as `Reference` with `id[string]`; untyped arrays and mixed-type arrays are prohibited.

New instruction comments must contain one **bare JSON object** in the active format, without Markdown fences. Null is permitted only when the declaration explicitly says `null` or `|null`. When validation fails, preserve the original comment and append one visible diagnostic delimited by `!ISSUESTACK_ERROR_START` and `!ISSUESTACK_ERROR_END`. The handler does not parse the enclosed text and does not repeat identical bot edits. Corrected records have stale diagnostics removed after successful queue reconciliation; invalid edits still block matching pending jobs.

## Agent procedure and field ownership

1. Read this file, the current repository README when available, and the current Issue #1 template, its versioned type registry in `src/types/`, and Issue #2's job scope.
2. Capture user requests as an intelligible **rewritten instruction** in `interpretation[object<Interpretation>].revised_instruction[string]`, not verbatim text. Under `user_intent[object<UserIntent>]`, preserve the goal, expected outcome, requested abstraction level, and full requested action scope.
3. Define each required outcome as a `Requirement` object in `requirements[array<Requirement>]`, with an ID, description, and individually typed acceptance criteria. Track separate typed `Constraint` objects in `constraints[array<Constraint>]`.
4. At intake, leave `decomposition[array<WorkItem>]` empty and `planning[object<Planning>].status[string]` equal to `not_started`. The Issue #2 planner decomposes requirements into atomic, independently verified actions, linking them by `Reference` objects. A completed work item does not imply a completed requirement.
5. Copy a validated record exactly once from Issue #1 into Issue #2, preserving its version, nonce, interpretation, and requirements. Populate trusted GitHub source comment ID and enqueue timestamp only in the queue copy. Maintain FIFO acceptance ordering unless an approved ordering rule applies.
6. Workers update `execution[object<Execution>]` and `completion[object<Completion>]`. Each `RequirementCompletion` item records a requirement ID, state, and evidence. All not-yet-verified requirement IDs remain in typed `remaining_requirement_ids[array<Reference>]`, including blocked, incomplete, and failed work.
7. Audit unrequested additions, modifications, extra constraints, scope reductions, abstraction changes/mismatches, and action-scope minimizations under `unrequested_changes[object<DeviationAudit>]`. Each `Deviation` object must have the exact fields specified by the named type catalog and document the original expectation, actual change, rationale, affected IDs, approval state, and evidence.
8. Report success only after all requirements have verified completion evidence, no remaining requirements, approvals for all material deviations, and a published/read-back execution receipt. Otherwise report the actual incomplete, blocked, or failed state, not a fabricated success.

Never add undocumented keys to the record to accommodate new work. Define a new named object type and **increment the version** before accepting new fields; do not silently loosen versioned validation.

## Mandatory three-issue handshake — scratchpad before changes

**Every worker must complete a verified three-issue handshake after an Issue #1 instruction is transferred to an Issue #2 job and its Issue #3 scratchpad, and before making any substantive change to the Issue #2 job comment or any execution-related repository file.** This includes the first worker claim/status change, edits to planning, decomposition, completion or receipts, and resumed work. The intake listener's automated creation of the queue job, scratchpad and index is the prerequisite to this worker handshake, not a worker edit subject to this gate.

1. **Trace the instruction through all three issues.** Read the assigned Issue #2 job comment and its nonce, schema, source issue/comment ID, requirements, constraints and current status. In Issue #1, check the permanent transfer-ledger comment **`6392246635`** for the matching source slot ID, nonce and Issue #2 job comment ID. The source input comment is reusable and may already have been reset to `Please enter instruction.`; its current body is **not** the enduring instruction. In Issue #2, read the first-comment scratchpad index **`6392250512`** to get and confirm the job-comment-ID → Issue #3 scratchpad-comment-ID mapping. Read that specific Issue #3 comment and verify `ISSUESTACK_PAD_JOB:<job-comment-id>` matches the job. Treat mismatched, missing, duplicate or unverified IDs as a **blocked handshake**; do not guess or substitute another scratchpad.
2. **Publish a pre-change statement of intent in the mapped Issue #3 comment.** Before claiming or otherwise editing the Issue #2 job, append a dated handshake entry to the **existing** Issue #3 scratchpad comment. Include the repository and all applicable issue numbers and permanent **comment IDs**: Issue #1 source input slot and transfer ledger, Issue #2 job and first-comment index, and the assigned Issue #3 scratchpad. Include the job nonce, verified transfer/mapping references, current job status and requirements; state what the worker intends to do, anticipated sequencing and verification, and **each file path it expects to create, alter, rename or delete with the nature/purpose of its proposed change**. Explicitly say when no file changes are expected. Preserve the scratchpad identity marker and existing notes; never publish credentials or hidden chain-of-thought.
3. **Read back and verify the handshake before changes.** Fetch the exact Issue #3 comment after updating it and confirm that the identity marker, relevant comment IDs, nonce, intentions and planned file changes were durably saved. **Only after this successful read-back** may the worker claim the Issue #2 job, update its planning/execution/completion fields or begin substantive file mutations. Merely submitting the scratchpad edit does not open the gate. If the write or read-back fails, report `blocked` in the user-facing result without making the gated changes.
4. **Maintain the handshake throughout execution.** Record meaningful progress, observed results, decisions, blockers and handoffs in the same Issue #3 scratchpad. **Before** an additional or materially revised file change, an unexpected Issue #2 job edit, or a departure from the documented plan, first append the revised intent, affected paths and rationale to the scratchpad and read it back; obtain approval separately where the deviation audit requires it. Do not overwrite earlier notes or break the job-to-pad mapping. Keep Issue #2's typed execution/evidence/receipt fields current *after* the scratchpad gate, not instead of it.
5. **Follow the lifecycle through the source, job and scratchpad.** Correlate Issue #1's transfer-ledger receipt, Issue #2's queue status and execution receipt, and Issue #3's working notes and eventual archive. At the end, record actual validation and receipt read-backs in the scratchpad; independently check the archived entry in `scratchpads/archive.json` and the `ISSUESTACK_MAP:<job-id>:<pad-id>:archived` index marker. Distinguish instruction transfer, execution success and scratchpad archival in any status report; absence of one cannot be inferred from another.

**Example pre-change scratchpad entry (these IDs identify one real job and must be replaced for every other job):**

```text
Handshake / before job edits
Source: Issue #1 slot comment 6392297975; ledger comment 6392246635
Queue: Issue #2 job comment 6393373331; index comment 6392250512
Scratchpad: Issue #3 comment 6393373530
Nonce: issuestack-handshake-agents-20261024-v1
Checked: transfer ledger and job nonce/source match; index and pad identity match
Intent: amend AGENTS.md to add the pre-change handshake policy; verify commit
Planned file change: AGENTS.md — add handshake instructions and reorder worker steps
Before editing Issue #2 or writing files: publish this note and read back this pad
Next: claim the pending Issue #2 job, edit only the documented file, verify outcomes
```

## Interactive procedures — two JSON panels in one permanent comment

[Issue #13 — Interactive Procedure Projections](https://github.com/BestNameYet/IssueStack-/issues/13) is the **live, mutable step display** for a job. The Issue #1 handoff now creates one such comment after creating/verifying the Issue #2 job and its linked Issue #3 scratchpad. For an existing Issue #2 job, the procedure listener can also create the projection on an authorized job-comment edit. A permanent Issue #13 comment ID identifies the procedure instance; its ID **never changes as steps advance**. Do not insert live procedure text or new fields into the strict Issue #2 `issuestack.task.v3` JSON job.

The procedure comment contains exactly two separately tagged JSON panels:

- **Bot-owned instruction** between `<!-- ISSUESTACK_BOT_INSTRUCTION_START -->` and `<!-- ISSUESTACK_BOT_INSTRUCTION_END -->`, including the job/pad linkage, nonce, `revision`, `step_id`, the current `instruction`, accepted answer shape, and `last_error`. The worker reads this panel but must not alter it.
- **Agent-owned answer** between `<!-- ISSUESTACK_AGENT_ANSWER_START -->` and `<!-- ISSUESTACK_AGENT_ANSWER_END -->`. An empty object (`{}`) means waiting. To submit, edit the **same GitHub comment** and replace **only the JSON in this panel** with one valid answer. Preserve both tag boundaries, the outer procedure identity marker and the bot panel. Submit one response per current revision with a new unique `submission_id`.

**Example agent answer JSON for a current `trace` step at revision 0:**

```json
{
  "revision": 0,
  "step_id": "trace",
  "submission_id": "trace-20261025-001",
  "answer": {
    "summary": "Verified Issue #1 source, Issue #2 job and mapped Issue #3 scratchpad; wrote/read back intentions and proposed file changes before job edits.",
    "evidence_uri": "https://github.com/BestNameYet/IssueStack-/issues/3#issuecomment-6393473753"
  }
}
```

The `answer` object requires exactly `summary` (non-empty string) and `evidence_uri` (nonempty string or null); the outer answer requires exactly `revision` (number), `step_id` (string), `submission_id` (unique stable string) and `answer`. The answer is an agent **report** and is not automatically proof that the underlying acceptance criterion was independently verified. Continue to use the Issue #2 typed requirement-level evidence, deviations and receipts.

On each authorized Issue #13 comment edit, `.github/workflows/interactive-procedures.yml` calls `src/interactive-procedures.js`. The listener verifies the actor, active job/pad mapping, nonce, bot-owned panel integrity, expected revision and answer shape. It first appends a step receipt to the designated Issue #3 scratchpad's **`<!-- ISSUESTACK_BOT_HISTORY_START -->` / `<!-- ISSUESTACK_BOT_HISTORY_END -->`** history section (preserving all other scratchpad notes), reads back that append, and then updates the same Issue #13 comment to display the next step with an empty answer. The scratchpad journal, not the replaceable projection, is authoritative for recovery. A failed answer stays on the same step and reports validation feedback through the bot panel's `last_error`. Retries do not append duplicate step events. The scheduled or manually dispatched workflow reconciles interrupted transitions.

**Important boundary:** The static ChatGPT progress display is an optional, read-only presentation of this GitHub state. The agent's execution and answer submission require GitHub comment editing, not a ChatGPT UI control. A procedure reaching `complete` means the protocol has recorded all step answers; it **does not** automatically mark the Issue #2 job or scratchpad archive complete. Maintain the original three-issue handshake, verified receipts and required independent completion checks.

## How to complete an Issue #2 task

This is the **required worker completion procedure** for an assigned Issue #2 job. Update the **existing job comment**, not the Issue #2 body, the Issue #1 reusable input slot, or the Issue #2 first-comment scratchpad index. Follow the schema of that particular job: current `issuestack.task.v3` records use the literal bracket-annotated field names shown below; older versioned records retain their original keys and must not be silently migrated.

1. **Identify, verify the handshake, then claim the job.** Read the exact Issue #2 job comment ID and its nonce, `requirements[array<Requirement>]`, `constraints[array<Constraint>]`, acceptance criteria, execution state, and remaining requirement IDs. Find its mapped Issue #3 scratchpad comment in Issue #2 **comment 1** (ID `6392250512`). Do not treat the reusable Issue #1 source comment as a persistent copy of the instruction. First complete and read back the **Mandatory three-issue handshake** above in the mapped Issue #3 scratchpad, including file-change intentions; do this **before** the following claim or any other substantive Issue #2 edit. Claim a `pending` job only when authorized; write/read back `execution[object<Execution>].status[string] = "running"`, `started_at[string|null]` (ISO-8601 timestamp) and `worker[string|null]`. Do not re-execute an already claimed or completed nonce without explicit authorization.
2. **Plan, work, and log progress (scratchpad-first).** Having already verified the handshake, populate `decomposition[array<WorkItem>]` with the defined typed work items and dependencies as appropriate, update `planning[object<Planning>]`, and perform the requested work. Use the designated Issue #3 comment throughout as the persistent scratchpad for concise progress, decisions, test observations, blockers, evidence, and handoffs; preserve its `ISSUESTACK_PAD_JOB:<job-comment-id>` identity marker. Temporary local files may facilitate execution, but the local environment alone is not the durable task record. Do not put secrets or hidden reasoning in GitHub comments.
3. **Verify every requirement against its acceptance criteria.** For each required ID, add/update exactly one `RequirementCompletion` object in `completion[object<Completion>].by_requirement[array<RequirementCompletion>]`: `requirement_id[string]`, `status[string]`, `evidence[array<Evidence>]` (each Evidence has `description[string]` and `uri[string|null]`), `blocker[string|null]`, `next_action[string|null]`, and `verified_at[string|null]`. Record actual tests in `validation[array<ValidationCheck>]`, using `check[string]`, `passed[boolean]`, and `evidence[array<Evidence>]`. Record deliverables in `artifacts[array<Artifact>]` (`description[string]`, `uri[string]`), and actual errors in `errors[array<ErrorEntry>]` (`message[string]`). Keep all unverified, blocked, or failed requirement IDs in `remaining_requirement_ids[array<Reference>]` using objects of the form `{"id[string]":"R1"}`; remove an ID **only after** its result is independently verified. Never invent evidence.
4. **Check scope and determine the result.** Audit the exact existing `unrequested_changes[object<DeviationAudit>]` categories and resolve material unrequested additions, changed requirements, scope reductions, and abstraction mismatches with required approval. A **successful** task requires every requested requirement verified, all acceptance tests satisfied, `remaining_requirement_ids[array<Reference>]` empty, and material deviations resolved. If work can continue, keep the job `running` or `blocked` with outstanding requirements and next steps; do **not** claim completion. A terminal **failure** may use `execution.status[string] = "failed"` with `completion.success[boolean|null] = false`, clearly documented unmet requirements and errors. Never mark a partial result as successful.
5. **Publish the terminal job record.** For success set `execution[object<Execution>].status[string] = "succeeded"` and `completion[object<Completion>].success[boolean|null] = true`; for terminal failure use `"failed"` and `false`. In either terminal case set `execution.finished_at[string|null]`, `completion.summary[string|null]`, and the full typed `completion.receipt[object<Receipt>|null]`: `nonce[string]`, `source_issue[number]`, `source_comment_id[number]`, `queue_issue[number]`, `queue_comment_id[number]`, `executor[string]`, `started_at[string|null]`, `finished_at[string|null]`, and `run_id[string|null]` (null when genuinely unavailable). Preserve the original nonce, source GitHub comment ID and Issue #2 job comment ID. **Update the existing Issue #2 job comment and fetch it again** to verify the fields, status, evidence and receipt actually persisted. A successful API submission is not proof.
6. **Verify scratchpad archiving.** Terminal status invokes the Issue #2 completion workflow, which copies the mapped Issue #3 scratchpad into the shared `scratchpads/archive.json` and marks the mapping in Issue #2 comment 1 `completed / archived`. Check the archived entry for the **same Issue #2 job ID, Issue #3 scratchpad ID and content**, and read back the index marker `ISSUESTACK_MAP:<job-id>:<scratchpad-id>:archived`. GitHub Actions edits made with `GITHUB_TOKEN` do **not** trigger another issue-comment run; hourly reconciliation (or the documented manual workflow dispatch) handles those completions. If archiving is not yet verified, report it as **archive pending or blocked** and do not claim end-to-end archival succeeded. Preserve the original Issue #3 comment.

**Completion gate:** Job execution success, a verified completion receipt, and scratchpad archival are separate observable facts. State each accurately; do not claim a task and its archive are fully closed before their respective read-backs. Only the two consistent terminal pairs (`succeeded`/`true` or `failed`/`false`) trigger the current archive handler. A `blocked` or `running` record is not terminal.

## Permanent Issue #1 comment slots

Issue #1 uses exactly six **fixed GitHub comment IDs**. **Comment 1** (`6392246635`) is the transfer ledger, not an intake entry. **Comments 2–6** (`6392297975`, `6392352070`, `6392385256`, `6392425260`, `6392431658`) are the only reusable instruction inputs. Their GitHub IDs remain permanent even after other comments are deleted; never infer slots from a shifted position or accept comments with other IDs.

When a typed record in a permitted slot passes validation, publish it to Issue #2, **read back and verify** the nonce and source ID, append its timestamp/source ID/queue comment ID to comment 1, verify the ledger update, and **only then** overwrite the original slot with `Please enter instruction.` The ledger records *completed transfers*, not completed execution jobs. A reused slot carries a new nonce; existing Issue #2 jobs stay intact. An invalid slot entry retains its tagged inline error until corrected.

Any additional Issue #1 comments beyond those six IDs are rejected and deleted using the workflow's `GITHUB_TOKEN`, with a durable rejection entry in ledger comment 1 stating `Please use comments 2 through 6.` Do not create new Issue #1 comments for errors, confirmations, or rejection notices. Preserve historical completed-job records in Issue #2 when repurposing the original slot comments.

## Per-job shared scratchpads

**Use Issue #3 as the designated shared scratchpad surface for each job in Issue #2.** Each new validated instruction transferred from Issue #1 to Issue #2 receives its own Issue #3 *comment*, not a shared unstructured note and not a local-only scratchpad. The existing Issue #1 listener creates/verifies that scratchpad and records the mapping in **Issue #2 comment 1** (ID `6392250512`) before resetting its input slot. The mapping is by the permanent **Issue #2 job comment ID**, not by the reusable Issue #1 slot ID. It includes the corresponding Issue #3 scratchpad comment ID.

Agents working on a job should first retrieve its Issue #2 comment, find the matching Issue #3 comment from the Issue #2 index, then write and review working notes there throughout the task. Use it for progress, decisions, observations, compact reasoning summaries, tests, blockers, evidence, and handoff state. Prefer this durable, task-specific shared scratchpad over an ephemeral local working file for substantive task context. Do not store secrets, raw credentials, private chain-of-thought, or other sensitive material in GitHub issue comments. Local temporary files may still be used for tool execution and generated artifacts, but must not become the only record of transferable task state.

When a job is marked terminal in Issue #2 (`succeeded` with `completion.success=true`, or `failed` with `completion.success=false`), the separate Issue #2 completion workflow snapshots its Issue #3 scratchpad into the common file `scratchpads/archive.json`, verifies the archive write, and marks the Issue #2 index mapping completed/archived. The archive is idempotent by Issue #2 job ID. Completion edits authored with `GITHUB_TOKEN` do not fire `issue_comment` workflows, so the completion workflow also performs scheduled reconciliation of terminal jobs. The Issue #3 comment remains available for reference after archiving. The original first Issue #2 job was preserved at `scratchpads/legacy-issue2-first-job-6392250512.json` before converting that comment to the index.

## GitHub Actions bot-authored comments

The Issue #1 intake listener runs on user-created and user-edited issue comments only. It authenticates its own comment writes using the workflow's built-in `GITHUB_TOKEN`, explicitly passed to `actions/github-script`. GitHub does not create new workflow runs from the `issue_comment` events caused by writes authenticated with that token. Do not replace it with a PAT or GitHub App token for validator writebacks, as those credentials could create recursive workflow events. The workflow also excludes `github-actions[bot]` as a defensive actor guard. The tagged diagnostic parser must continue to ignore bot-maintained error sections for manually edited comments. Never substitute an artificial re-trigger for the required user-initiated edit event.

## Mandatory GitHub Actions workflow modification mechanism

**When an agent creates or modifies a GitHub Actions workflow, it MUST use the connected GitHub integration to perform the repository write.** This covers creating, updating, deleting, replacing, renaming, or otherwise changing workflow files in `.github/workflows/` and associated workflow definitions. It is not sufficient merely to describe, generate, or propose a workflow file.

- Use the GitHub integration's supported repository-file operations to publish each authorized workflow change. **Do not substitute** shell commands, local Git, direct GitHub REST/GraphQL calls outside the integration, browser/UI edits, or the IssueStack issue-command surface for the workflow-file write.
- Before changing a workflow, read the current repository documentation and the applicable file state through the connected integration. Follow the Issue #1 → Issue #2 instruction/job routing above; that routing does not replace the requirement that the actual workflow write use the integration.
- After publication, retrieve the changed workflow through the GitHub integration and inspect the returned file contents, path and commit. Where execution behavior is relevant, run available documented tests and inspect execution receipts. A successful submission alone does not prove workflow correctness.
- If the integration cannot complete or verify the write, report the operation as **blocked**, not completed; do not bypass the integration via an alternate write mechanism without a subsequent explicit change to this policy authorized by the user.

## Bootstrap and operational boundaries

- The two issues and their schemas specify a **contract**, not an operational workflow. Until listener, validator, publisher, worker, and receipt behavior pass end-to-end tests, do not claim automatic routing or execution. If blocked, keep the instruction traceable in Issue #1 and disclose the missing transition.
- A user-authorized manual bootstrap may use the GitHub integration, with an audit trail through the appropriate issue; never misrepresent that as an automatically executed job.
- Follow higher-priority instructions and available permissions. Do not infer that an arbitrary issue comment authorizes privileged operations.
- Use `workspaces/<project-name>/` for project-isolated work and `src/` for shared components **only after verifying the directories actually exist**.
- Keep historical v1 jobs intact. Issue #2 is a job scope, **not a mandatory duplicate schema specification**. Amend its body only when there is a separate reason to change the queue contract.
