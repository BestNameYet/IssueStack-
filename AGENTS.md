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

## How to complete an Issue #2 task

This is the **required worker completion procedure** for an assigned Issue #2 job. Update the **existing job comment**, not the Issue #2 body, the Issue #1 reusable input slot, or the Issue #2 first-comment scratchpad index. Follow the schema of that particular job: current `issuestack.task.v3` records use the literal bracket-annotated field names shown below; older versioned records retain their original keys and must not be silently migrated.

1. **Identify and claim the job.** Read the exact Issue #2 job comment ID and its nonce, `requirements[array<Requirement>]`, `constraints[array<Constraint>]`, acceptance criteria, execution state, and remaining requirement IDs. Find its mapped Issue #3 scratchpad comment in Issue #2 **comment 1** (ID `6392250512`). Do not treat the reusable Issue #1 source comment as a persistent copy of the instruction. Claim a `pending` job only when authorized; write/read back `execution[object<Execution>].status[string] = "running"`, `started_at[string|null]` (ISO-8601 timestamp) and `worker[string|null]`. Do not re-execute an already claimed or completed nonce without explicit authorization.
2. **Plan, work, and log progress.** Populate `decomposition[array<WorkItem>]` with the defined typed work items and dependencies as appropriate, update `planning[object<Planning>]`, and perform the requested work. Use the designated Issue #3 comment throughout as the persistent scratchpad for concise progress, decisions, test observations, blockers, evidence, and handoffs; preserve its `ISSUESTACK_PAD_JOB:<job-comment-id>` identity marker. Temporary local files may facilitate execution, but the local environment alone is not the durable task record. Do not put secrets or hidden reasoning in GitHub comments.
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
