# IssueStack Agent Instructions

These instructions govern all agents operating in `BestNameYet/IssueStack-` and its subdirectories, unless a more specific `AGENTS.md` adds compatible obligations.

## Mandatory routing: instruction intake → job queue

- **[Issue #1 — User Instruction Intake](https://github.com/BestNameYet/IssueStack-/issues/1)** is the authoritative instruction input and task-record contract.
- **[Issue #2 — Job Queue and Completion Records](https://github.com/BestNameYet/IssueStack-/issues/2)** is the job scope: queued records, work performed, requirement-by-requirement completion, evidence, deviations, and receipts.

Route **static instruction → one `issuestack.task.v3` JSON record in Issue #1 → validated, deduplicated job in Issue #2 → execution and verified result in Issue #2**. Route **pre-existing declared procedure → `issuestack.procedure.v1` JSON in Issue #1 → syntax-verified procedure comment in Issue #13 → stepwise typed returns in that same Issue #13 comment**, without publishing a procedure job to Issue #2. Do not bypass intake or equate queue publication with completed execution. The *body* of Issue #2 need not mirror the current task schema; it documents the job surface, while each queued comment carries its own `schema` version.

## Current task schema: `issuestack.task.v3`

Issue #1 defines the active record template, while named object types are stored in `src/types/issuestack.task.v3.json`; read both. The latest schema uses **literal bracket-annotated key names**. `issuestack.job.v1` and `issuestack.task.v2` records remain historical; preserve them without automatic conversion. The body of Issue #2 defines the job scope and does not need to be rewritten for every schema version.

**Mandatory exact-type invariant:** Every JSON object must have exactly its named type's keys, with zero missing and zero additional keys; every value must have the type declared by its field's bracket suffix. This is recursive at every level, including objects contained in arrays. Keys with different literal names identify different object types, even when their values share the same primitive types. New **static task** comments use only the current `schema[string]` version. Declared procedures use the separate `schema: "issuestack.procedure.v1"` syntax below, and are never coerced into task.v3.

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

## Declared stepwise procedures — Issue #1 → Issue #13 only

**The two instruction kinds are mutually exclusive.** Static `issuestack.task.v3` comments are queued to Issue #2 and get Issue #3 scratchpads; they **must not** automatically instantiate a procedure. A procedure is an independently authored, existing stepwise JSON document explicitly declared in one of Issue #1's five pinned input slots using literal `"schema": "issuestack.procedure.v1"`. Issue #1 validates the entire procedure syntax and each return-type declaration first, then publishes it **only to Issue #13** and appends a `PROCEDURE:<comment-id>` transfer receipt to Issue #1's ledger. No Issue #2 job is created for that procedure.

**Required intake format — submit one bare JSON object in an Issue #1 input slot (no Markdown code fence):**

```json
{
  "schema": "issuestack.procedure.v1",
  "nonce": "procedure-example-001",
  "title": "Review a supplied result",
  "steps": [
    {
      "id": "inspect",
      "instruction": "Inspect the supplied item and report whether it passes.",
      "returns": {
        "type": "object",
        "properties": {
          "passed": { "type": "boolean" },
          "notes": { "type": "string" }
        },
        "required": ["passed", "notes"],
        "additionalProperties": false
      }
    },
    {
      "id": "scores",
      "instruction": "Return integer scores from the completed inspection.",
      "returns": {
        "type": "array",
        "items": { "type": "integer" }
      }
    }
  ]
}
```

Each step is an object with **exactly** `id`, `instruction`, `returns`, in the supplied order. IDs must be distinct. A `returns` declaration supports `string`, `number`, `integer`, `boolean`, `null`, `array` (typed `items`) and `object` (typed `properties`, explicit `required`, and `additionalProperties: false`). Compound types can be nested. The intake processor rejects missing/extra fields, duplicate steps, malformed type declarations, excessive depth and invalid IDs; it preserves invalid input and annotates the Issue #1 slot instead of queuing an invalid procedure. Instructions and return types come from the submitted document, **not** from a hardcoded five-step lifecycle.

**One permanent Issue #13 comment per declared procedure.** The comment contains:
- Bot-owned step projection inside `<!-- ISSUESTACK_BOT_INSTRUCTION_START -->` / `<!-- ISSUESTACK_BOT_INSTRUCTION_END -->`, including the current instruction and its required `return_schema`.
- Agent-owned response inside `<!-- ISSUESTACK_AGENT_ANSWER_START -->` / `<!-- ISSUESTACK_AGENT_ANSWER_END -->`. Edit **only its JSON object** and leave all other text unchanged.
- Bot-owned *self-recording state* inside the **HTML comment** marked `ISSUESTACK_PROCEDURE_STATE_START` / `ISSUESTACK_PROCEDURE_STATE_END`. It contains the full original procedure definition, Issue #1 source comment ID, current revision, and all previous accepted step returns, submission IDs and timestamps. GitHub hides HTML comments from normal Markdown display, but they are **not private, immutable, or locked**; they remain visible/editable in raw Markdown. GitHub has no per-section or per-comment authoring lock that allows bots to edit hidden content while users can edit only the answer. The workflow enforces this boundary by comparing the old and new comment bodies on each owner-initiated edit and rejecting edits outside the answer region. Never store secrets in the hidden state.

**Example agent response to the `inspect` step at revision 0:**

```json
{
  "revision": 0,
  "step_id": "inspect",
  "submission_id": "inspect-001",
  "return_value": {
    "passed": true,
    "notes": "All acceptance checks passed."
  }
}
```

The `return_value` must conform **recursively** to the current step's declared `returns` schema. For the `scores` step, an example return is `[3, 4, 5]`, not a string such as `"3, 4, 5"`. An incorrect type, stale revision or reused submission ID is rejected, retaining the same current step and adding validation feedback. An accepted answer atomically updates the **same Issue #13 comment ID**, appends a complete record to the hidden state's `returns` array, increments `revision`, and renders only the next declared step. The full history is preserved in the self-record without depending on Issue #2.

The handler lives in `src/procedure-documents.js`; `.github/workflows/interactive-procedures.yml` processes authorized **Issue #13 edits only** and verifies writeback. Old historical Issue #13 demonstrations are preserved as historical comments but are not interpreted as new declared procedures. An optional ChatGPT progress view can read this projection; it must not be required for agent execution. End-of-procedure means all typed steps have returned, not that an unrelated Issue #2 job has been completed.

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

## Task.v3 field-specific guidance and few-shot examples

**Authority:** The current [Issue #1 task.v3 template](https://github.com/BestNameYet/IssueStack-/issues/1) and [versioned type registry](https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json) are controlling. This reference does not alter any validator, workflow, runtime, historical job, or procedure schema. Every field name shown is literal, including its `[type]` suffix. All example IDs `9012345x` and `example.invalid` URLs are intentionally **fictional**; they are illustrations, not actual evidence or receipts.

**Ownership:** The submitting agent authors the nonce, interpretation, requirements and constraints and initializes the v3 record. Workflow-supplied values are the trusted source comment ID and enqueue timestamp. A worker authors planning/decomposition and execution/completion/evidence/deviation fields **only after** the documented Issue #1 → Issue #2 → Issue #3 handshake and verified scratchpad intent. The worker fills the terminal receipt with **real** trusted source/job metadata and actual timestamps. Work item completion never automatically verifies its parent requirement.

**Reading the matrix:** All fields in the current named type registry and all root fields are enumerated. Each example value is fully type-correct; nested arrays contain complete named objects. A row is an illustrative field value, not a stand-alone valid queue record. Consult the four complete-record examples for state-dependent empty arrays and nulls.

### Root record

*Writer: Submitter for intent/constraints, workflow for trusted metadata, worker for planning/execution/completion.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `schema[string]` | Task schema version, always current v3 | `"issuestack.task.v3"` |
| `nonce[string]` | Unique submission/deduplication nonce, retained in job receipt | `"example-r1-001"` |
| `ordinal[number|null]` | Ordering override only if specified; otherwise null | `null` |
| `source[object<Source>]` | Intake Issue and workflow-trusted source comment ID ;; | `{"issue[number]":1,"comment_id[number\|null]":null}` |
| `interpretation[object<Interpretation>]` | Clear rewritten user directive and full intended scope ;; | `{"revised_instruction[string]":"Implement and verify malformed-input rejection.","user_intent[object<UserIntent>]":{"goal[string]":"Keep invalid records out of the queue.","expected_outcome[string]":"Invalid payload rejected; valid payload transfers once.","requested_abstraction_level[string]":"Implemented code and regression tests.","requested_action_scope[string]":"Edit parser and tests, run checks, publish report."}}` |
| `requirements[array<Requirement>]` | Required outcomes with acceptance criteria ;; | `[{"id[string]":"R1","description[string]":"Reject malformed input without losing original text.","acceptance_criteria[array<AcceptanceCriterion>]":[{"text[string]":"Invalid JSON retains source text and shows a tagged diagnostic."}]}]` |
| `constraints[array<Constraint>]` | Original limits, approvals and scope boundaries ;; | `[{"id[string]":"C1","description[string]":"Preserve all previously completed jobs.","source[string]":"User instruction","applies_to_requirement_ids[array<Reference>]":[{"id[string]":"R1"}]}]` |
| `decomposition[array<WorkItem>]` | Worker-derived work units; [] initially ;; | `[{"id[string]":"W1","description[string]":"Add malformed-input regression coverage.","requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"depends_on[array<Reference>]":[{"id[string]":"R1"}],"expected_output[string]":"Three regression cases saved.","verification_method[string]":"Run test suite and read back file.","status[string]":"verified","worker[string\|null]":"Example worker","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `planning[object<Planning>]` | Plan, sources and current plan state ;; | `{"status[string]":"in_progress","method[string]":"Read schema, implement tests, inspect results.","sources[array<ResearchSource>]":[{"title[string]":"IssueStack v3 type registry","url[string]":"https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"}]}` |
| `execution[object<Execution>]` | Workflow enqueue and worker lifecycle state ;; | `{"status[string]":"running","enqueued_at[string\|null]":null,"started_at[string\|null]":"2026-10-25T08:02:00.000Z","finished_at[string\|null]":null,"worker[string\|null]":"Example worker"}` |
| `completion[object<Completion>]` | Requirement-level evidence, incomplete work and receipt ;; | `{"by_requirement[array<RequirementCompletion>]":[{"requirement_id[string]":"R1","status[string]":"verified","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}],"blocker[string\|null]":null,"next_action[string\|null]":null,"verified_at[string\|null]":"2026-10-25T08:08:00.000Z"}],"remaining_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"success[boolean\|null]":null,"summary[string\|null]":null,"artifacts[array<Artifact>]":[{"description[string]":"Validator test report","uri[string]":"https://example.invalid/demo/report"}],"validation[array<ValidationCheck>]":[{"check[string]":"Malformed JSON integration test","passed[boolean]":true,"evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"errors[array<ErrorEntry>]":[{"message[string]":"Test runner denied permission before tests."}],"receipt[object<Receipt>\|null]":null}` |
| `unrequested_changes[object<DeviationAudit>]` | Audit of work outside the requested scope ;; | `{"additions_outside_requirements[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"revisions_outside_requirements[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"additional_constraints[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"scope_reductions[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"abstraction_level_changes[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"abstraction_mismatches[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}],"action_scope_minimizations[array<Deviation>]":[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]}` |

### `Reference` object

*Writer: Submitting agent or worker, depending on field.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `id[string]` | Referenced R ID, except WorkItem dependencies point to W IDs | `"R1"` |

### `AcceptanceCriterion` object

*Writer: Submitting agent.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `text[string]` | A reproducible pass/fail criterion | `"Invalid JSON retains source text and shows a tagged diagnostic."` |

### `Evidence` object

*Writer: Worker after real check.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `description[string]` | Named observed evidence supporting an acceptance condition | `"Regression run confirms malformed input preserved."` |
| `uri[string|null]` | URL of real evidence, or null if no URL exists | `"https://example.invalid/demo/run"` |

### `ResearchSource` object

*Writer: Agent/worker after consulting source.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `title[string]` | Human-readable consulted document title | `"IssueStack v3 type registry"` |
| `url[string]` | Real source URL, never fabricated | `"https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"` |

### `Requirement` object

*Writer: Submitting agent.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `id[string]` | Stable R-prefixed outcome ID | `"R1"` |
| `description[string]` | Mandatory result, not a mere worker action | `"Reject malformed input without losing original text."` |
| `acceptance_criteria[array<AcceptanceCriterion>]` | Individually measurable acceptance conditions ;; | `[{"text[string]":"Invalid JSON retains source text and shows a tagged diagnostic."}]` |

### `Constraint` object

*Writer: Submitting agent.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `id[string]` | Stable constraint identifier | `"C1"` |
| `description[string]` | Required restriction or mechanism | `"Preserve all previously completed jobs."` |
| `source[string]` | Provenance of this constraint | `"User instruction"` |
| `applies_to_requirement_ids[array<Reference>]` | Relevant R references ;; | `[{"id[string]":"R1"}]` |

### `WorkItem` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `id[string]` | Stable W-prefixed atomic task identifier | `"W1"` |
| `description[string]` | Executable independent action | `"Add malformed-input regression coverage."` |
| `requirement_ids[array<Reference>]` | R outcomes this item contributes to ;; | `[{"id[string]":"R1"}]` |
| `depends_on[array<Reference>]` | Earlier W dependencies or [] if independent ;; | `[{"id[string]":"R1"}]` |
| `expected_output[string]` | Concrete deliverable from action | `"Three regression cases saved."` |
| `verification_method[string]` | Test/inspection to confirm action | `"Run test suite and read back file."` |
| `status[string]` | Work state: pending, running, blocked, verified, failed | `"verified"` |
| `worker[string|null]` | Real assigned worker, null before claim | `"Example worker"` |
| `evidence[array<Evidence>]` | Observed work-unit evidence ;; | `[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]` |

### `RequirementCompletion` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `requirement_id[string]` | Exactly one R ID from original requirements | `"R1"` |
| `status[string]` | verified, blocked, incomplete or failed requirement | `"verified"` |
| `evidence[array<Evidence>]` | Proof against each relevant acceptance criterion ;; | `[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]` |
| `blocker[string|null]` | Specific obstacle, or null when none | `null` |
| `next_action[string|null]` | Practical recovery step while incomplete; null otherwise | `null` |
| `verified_at[string|null]` | Time independently verified or null if not verified | `"2026-10-25T08:08:00.000Z"` |

### `Artifact` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `description[string]` | Name/purpose of produced deliverable | `"Validator test report"` |
| `uri[string]` | Real durable deliverable link | `"https://example.invalid/demo/report"` |

### `ValidationCheck` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `check[string]` | Precisely named test or readback performed | `"Malformed JSON integration test"` |
| `passed[boolean]` | Actual observed pass/fail; do not invent | `true` |
| `evidence[array<Evidence>]` | Test logs, inspected files and actual links ;; | `[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]` |

### `ErrorEntry` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `message[string]` | Concrete error and impact | `"Test runner denied permission before tests."` |

### `Receipt` object

*Writer: Worker copies trusted identifiers, actual times and results.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `nonce[string]` | Original task nonce, unchanged | `"example-r1-001"` |
| `source_issue[number]` | Trusted originating issue ID | `1` |
| `source_comment_id[number]` | Trusted source comment ID from queued copy | `90123456` |
| `queue_issue[number]` | Queue issue number, normally 2 | `2` |
| `queue_comment_id[number]` | Permanent existing job comment ID | `90123457` |
| `executor[string]` | Actual executor who performed work | `"Example worker"` |
| `started_at[string|null]` | Actual start ISO time or null if unavailable | `"2026-10-25T08:02:00.000Z"` |
| `finished_at[string|null]` | Actual terminal ISO time or null if unavailable | `"2026-10-25T08:09:00.000Z"` |
| `run_id[string|null]` | Genuine Actions run ID or null when absent | `null` |

### `Deviation` object

*Writer: Worker and real approver.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `id[string]` | Stable D ID | `"D1"` |
| `original_expectation[string]` | Exact requested scope before change | `"Produce tested implementation."` |
| `actual_or_proposed_change[string]` | Specific difference from user request | `"Produced only a plan."` |
| `rationale[string]` | Reason offered, not itself approval | `"Runner unavailable."` |
| `affected_requirement_ids[array<Reference>]` | Every affected R ID ;; | `[{"id[string]":"R1"}]` |
| `approval_status[string]` | approved, pending or rejected from real authorization | `"pending"` |
| `evidence[array<Evidence>]` | Audit and approval observations or links ;; | `[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]` |

### `Source` object

*Writer: Submitter sets issue, workflow sets comment ID.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `issue[number]` | Originating issue number, normally 1 | `1` |
| `comment_id[number|null]` | Workflow-supplied permanent source input ID, null at intake | `null` |

### `UserIntent` object

*Writer: Submitting agent.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `goal[string]` | The user’s underlying objective | `"Keep invalid records out of the queue."` |
| `expected_outcome[string]` | Observable final result | `"Invalid payload rejected; valid payload transfers once."` |
| `requested_abstraction_level[string]` | Requested kind of deliverable, e.g. code or analysis | `"Implemented code and regression tests."` |
| `requested_action_scope[string]` | Full set of authorized actions, not reduced to advice | `"Edit parser and tests, run checks, publish report."` |

### `Interpretation` object

*Writer: Submitting agent.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `revised_instruction[string]` | Faithful, actionable restatement of all requested work | `"Implement and verify malformed-input rejection."` |
| `user_intent[object<UserIntent>]` | Goal, expected output, requested granularity and actions ;; | `{"goal[string]":"Keep invalid records out of the queue.","expected_outcome[string]":"Invalid payload rejected; valid payload transfers once.","requested_abstraction_level[string]":"Implemented code and regression tests.","requested_action_scope[string]":"Edit parser and tests, run checks, publish report."}` |

### `Planning` object

*Writer: Submitter initializes; worker updates.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `status[string]` | Planning phase: not_started at intake, later in_progress, ready or completed | `"in_progress"` |
| `method[string]` | Concrete intended decomposition and verification method | `"Read schema, implement tests, inspect results."` |
| `sources[array<ResearchSource>]` | Actually consulted source records ;; | `[{"title[string]":"IssueStack v3 type registry","url[string]":"https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"}]` |

### `Execution` object

*Writer: Workflow initializes; worker updates.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `status[string]` | Lifecycle: pending, running, blocked, succeeded or failed | `"running"` |
| `enqueued_at[string|null]` | Verified timestamp from intake workflow only | `null` |
| `started_at[string|null]` | Real claim ISO timestamp or null until claimed | `"2026-10-25T08:02:00.000Z"` |
| `finished_at[string|null]` | Real terminal time, null while active | `null` |
| `worker[string|null]` | Actual executor identity or null if unclaimed | `"Example worker"` |

### `Completion` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `by_requirement[array<RequirementCompletion>]` | Record each verified, blocked or failed requirement ;; | `[{"requirement_id[string]":"R1","status[string]":"verified","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}],"blocker[string\|null]":null,"next_action[string\|null]":null,"verified_at[string\|null]":"2026-10-25T08:08:00.000Z"}]` |
| `remaining_requirement_ids[array<Reference>]` | Every R ID not independently verified, even failures ;; | `[{"id[string]":"R1"}]` |
| `success[boolean|null]` | true only succeeded; false only terminal failure; null otherwise | `null` |
| `summary[string|null]` | Accurate outcome, limitations and remaining work | `null` |
| `artifacts[array<Artifact>]` | Actual durable deliverables ;; | `[{"description[string]":"Validator test report","uri[string]":"https://example.invalid/demo/report"}]` |
| `validation[array<ValidationCheck>]` | Checks actually attempted, including failures ;; | `[{"check[string]":"Malformed JSON integration test","passed[boolean]":true,"evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `errors[array<ErrorEntry>]` | Real errors, [] if none ;; | `[{"message[string]":"Test runner denied permission before tests."}]` |
| `receipt[object<Receipt>|null]` | Full typed receipt on terminal outcome, null while active | `null` |

### `DeviationAudit` object

*Writer: Worker.*

| Literal field | Meaning and when to populate | Valid JSON example |
|---|---|---|
| `additions_outside_requirements[array<Deviation>]` | Extra work not requested ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `revisions_outside_requirements[array<Deviation>]` | Changed unrelated content or behavior ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `additional_constraints[array<Deviation>]` | Introduced boundaries not supplied by user ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `scope_reductions[array<Deviation>]` | Missing or narrowed requested work ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `abstraction_level_changes[array<Deviation>]` | Changed detail level ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `abstraction_mismatches[array<Deviation>]` | Output level does not match user request ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |
| `action_scope_minimizations[array<Deviation>]` | Executable user action turned into proposal/partial step ;; | `[{"id[string]":"D1","original_expectation[string]":"Produce tested implementation.","actual_or_proposed_change[string]":"Produced only a plan.","rationale[string]":"Runner unavailable.","affected_requirement_ids[array<Reference>]":[{"id[string]":"R1"}],"approval_status[string]":"pending","evidence[array<Evidence>]":[{"description[string]":"Regression run confirms malformed input preserved.","uri[string\|null]":"https://example.invalid/demo/run"}]}]` |

### Complete intake, before transfer

Use the full original template. Decomposition is empty, trusted IDs and queue/worker timestamps are null, and unverified R1 stays in the remaining list.

```json
{
  "schema[string]": "issuestack.task.v3",
  "nonce[string]": "example-r1-001",
  "ordinal[number|null]": null,
  "source[object<Source>]": {
    "issue[number]": 1,
    "comment_id[number|null]": null
  },
  "interpretation[object<Interpretation>]": {
    "revised_instruction[string]": "Implement and verify malformed-input rejection.",
    "user_intent[object<UserIntent>]": {
      "goal[string]": "Keep invalid records out of the queue.",
      "expected_outcome[string]": "Invalid payload rejected; valid payload transfers once.",
      "requested_abstraction_level[string]": "Implemented code and regression tests.",
      "requested_action_scope[string]": "Edit parser and tests, run checks, publish report."
    }
  },
  "requirements[array<Requirement>]": [
    {
      "id[string]": "R1",
      "description[string]": "Reject malformed input without losing original text.",
      "acceptance_criteria[array<AcceptanceCriterion>]": [
        {
          "text[string]": "Invalid JSON retains source text and shows a tagged diagnostic."
        }
      ]
    }
  ],
  "constraints[array<Constraint>]": [
    {
      "id[string]": "C1",
      "description[string]": "Preserve all previously completed jobs.",
      "source[string]": "User instruction",
      "applies_to_requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ]
    }
  ],
  "decomposition[array<WorkItem>]": [],
  "planning[object<Planning>]": {
    "status[string]": "not_started",
    "method[string]": "Read schema, implement tests, inspect results.",
    "sources[array<ResearchSource>]": []
  },
  "execution[object<Execution>]": {
    "status[string]": "pending",
    "enqueued_at[string|null]": null,
    "started_at[string|null]": null,
    "finished_at[string|null]": null,
    "worker[string|null]": null
  },
  "completion[object<Completion>]": {
    "by_requirement[array<RequirementCompletion>]": [],
    "remaining_requirement_ids[array<Reference>]": [
      {
        "id[string]": "R1"
      }
    ],
    "success[boolean|null]": null,
    "summary[string|null]": null,
    "artifacts[array<Artifact>]": [],
    "validation[array<ValidationCheck>]": [],
    "errors[array<ErrorEntry>]": [],
    "receipt[object<Receipt>|null]": null
  },
  "unrequested_changes[object<DeviationAudit>]": {
    "additions_outside_requirements[array<Deviation>]": [],
    "revisions_outside_requirements[array<Deviation>]": [],
    "additional_constraints[array<Deviation>]": [],
    "scope_reductions[array<Deviation>]": [],
    "abstraction_level_changes[array<Deviation>]": [],
    "abstraction_mismatches[array<Deviation>]": [],
    "action_scope_minimizations[array<Deviation>]": []
  }
}
```

### Complete success record after verification

All criteria verified, remaining IDs empty; `succeeded`/`true` pair, real receipt required, separate scratchpad archive check.

```json
{
  "schema[string]": "issuestack.task.v3",
  "nonce[string]": "example-r1-001",
  "ordinal[number|null]": null,
  "source[object<Source>]": {
    "issue[number]": 1,
    "comment_id[number|null]": 90123456
  },
  "interpretation[object<Interpretation>]": {
    "revised_instruction[string]": "Implement and verify malformed-input rejection.",
    "user_intent[object<UserIntent>]": {
      "goal[string]": "Keep invalid records out of the queue.",
      "expected_outcome[string]": "Invalid payload rejected; valid payload transfers once.",
      "requested_abstraction_level[string]": "Implemented code and regression tests.",
      "requested_action_scope[string]": "Edit parser and tests, run checks, publish report."
    }
  },
  "requirements[array<Requirement>]": [
    {
      "id[string]": "R1",
      "description[string]": "Reject malformed input without losing original text.",
      "acceptance_criteria[array<AcceptanceCriterion>]": [
        {
          "text[string]": "Invalid JSON retains source text and shows a tagged diagnostic."
        }
      ]
    }
  ],
  "constraints[array<Constraint>]": [
    {
      "id[string]": "C1",
      "description[string]": "Preserve all previously completed jobs.",
      "source[string]": "User instruction",
      "applies_to_requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ]
    }
  ],
  "decomposition[array<WorkItem>]": [
    {
      "id[string]": "W1",
      "description[string]": "Add malformed-input regression coverage.",
      "requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ],
      "depends_on[array<Reference>]": [],
      "expected_output[string]": "Three regression cases saved.",
      "verification_method[string]": "Run test suite and read back file.",
      "status[string]": "verified",
      "worker[string|null]": "Example worker",
      "evidence[array<Evidence>]": [
        {
          "description[string]": "Actual test showed rejection and original input retained.",
          "uri[string|null]": "https://example.invalid/demo/run"
        }
      ]
    }
  ],
  "planning[object<Planning>]": {
    "status[string]": "completed",
    "method[string]": "Read schema, implement tests, inspect results.",
    "sources[array<ResearchSource>]": [
      {
        "title[string]": "IssueStack v3 type registry",
        "url[string]": "https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"
      }
    ]
  },
  "execution[object<Execution>]": {
    "status[string]": "succeeded",
    "enqueued_at[string|null]": "2026-10-25T08:00:00.000Z",
    "started_at[string|null]": "2026-10-25T08:02:00.000Z",
    "finished_at[string|null]": "2026-10-25T08:09:00.000Z",
    "worker[string|null]": "Example worker"
  },
  "completion[object<Completion>]": {
    "by_requirement[array<RequirementCompletion>]": [
      {
        "requirement_id[string]": "R1",
        "status[string]": "verified",
        "evidence[array<Evidence>]": [
          {
            "description[string]": "Actual test showed rejection and original input retained.",
            "uri[string|null]": "https://example.invalid/demo/run"
          }
        ],
        "blocker[string|null]": null,
        "next_action[string|null]": null,
        "verified_at[string|null]": "2026-10-25T08:08:00.000Z"
      }
    ],
    "remaining_requirement_ids[array<Reference>]": [],
    "success[boolean|null]": true,
    "summary[string|null]": "All criteria verified by actual test and readback.",
    "artifacts[array<Artifact>]": [
      {
        "description[string]": "Validator test report",
        "uri[string]": "https://example.invalid/demo/report"
      }
    ],
    "validation[array<ValidationCheck>]": [
      {
        "check[string]": "Malformed-input integration test",
        "passed[boolean]": true,
        "evidence[array<Evidence>]": [
          {
            "description[string]": "Actual test showed rejection and original input retained.",
            "uri[string|null]": "https://example.invalid/demo/run"
          }
        ]
      }
    ],
    "errors[array<ErrorEntry>]": [],
    "receipt[object<Receipt>|null]": {
      "nonce[string]": "example-r1-001",
      "source_issue[number]": 1,
      "source_comment_id[number]": 90123456,
      "queue_issue[number]": 2,
      "queue_comment_id[number]": 90123457,
      "executor[string]": "Example worker",
      "started_at[string|null]": "2026-10-25T08:02:00.000Z",
      "finished_at[string|null]": "2026-10-25T08:09:00.000Z",
      "run_id[string|null]": null
    }
  },
  "unrequested_changes[object<DeviationAudit>]": {
    "additions_outside_requirements[array<Deviation>]": [],
    "revisions_outside_requirements[array<Deviation>]": [],
    "additional_constraints[array<Deviation>]": [],
    "scope_reductions[array<Deviation>]": [],
    "abstraction_level_changes[array<Deviation>]": [],
    "abstraction_mismatches[array<Deviation>]": [],
    "action_scope_minimizations[array<Deviation>]": []
  }
}
```

### Complete blocked record

Unresolved R1 remains, blocker/next action captured, `blocked`/`null` pair and null terminal receipt; unapproved deviation is recorded rather than silently accepted.

```json
{
  "schema[string]": "issuestack.task.v3",
  "nonce[string]": "example-r1-001",
  "ordinal[number|null]": null,
  "source[object<Source>]": {
    "issue[number]": 1,
    "comment_id[number|null]": 90123456
  },
  "interpretation[object<Interpretation>]": {
    "revised_instruction[string]": "Implement and verify malformed-input rejection.",
    "user_intent[object<UserIntent>]": {
      "goal[string]": "Keep invalid records out of the queue.",
      "expected_outcome[string]": "Invalid payload rejected; valid payload transfers once.",
      "requested_abstraction_level[string]": "Implemented code and regression tests.",
      "requested_action_scope[string]": "Edit parser and tests, run checks, publish report."
    }
  },
  "requirements[array<Requirement>]": [
    {
      "id[string]": "R1",
      "description[string]": "Reject malformed input without losing original text.",
      "acceptance_criteria[array<AcceptanceCriterion>]": [
        {
          "text[string]": "Invalid JSON retains source text and shows a tagged diagnostic."
        }
      ]
    }
  ],
  "constraints[array<Constraint>]": [
    {
      "id[string]": "C1",
      "description[string]": "Preserve all previously completed jobs.",
      "source[string]": "User instruction",
      "applies_to_requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ]
    }
  ],
  "decomposition[array<WorkItem>]": [
    {
      "id[string]": "W1",
      "description[string]": "Add malformed-input regression coverage.",
      "requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ],
      "depends_on[array<Reference>]": [],
      "expected_output[string]": "Three regression cases saved.",
      "verification_method[string]": "Run test suite and read back file.",
      "status[string]": "blocked",
      "worker[string|null]": "Example worker",
      "evidence[array<Evidence>]": []
    }
  ],
  "planning[object<Planning>]": {
    "status[string]": "in_progress",
    "method[string]": "Read schema, implement tests, inspect results.",
    "sources[array<ResearchSource>]": [
      {
        "title[string]": "IssueStack v3 type registry",
        "url[string]": "https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"
      }
    ]
  },
  "execution[object<Execution>]": {
    "status[string]": "blocked",
    "enqueued_at[string|null]": "2026-10-25T08:00:00.000Z",
    "started_at[string|null]": "2026-10-25T08:02:00.000Z",
    "finished_at[string|null]": null,
    "worker[string|null]": "Example worker"
  },
  "completion[object<Completion>]": {
    "by_requirement[array<RequirementCompletion>]": [
      {
        "requirement_id[string]": "R1",
        "status[string]": "blocked",
        "evidence[array<Evidence>]": [],
        "blocker[string|null]": "CI token lacks read permission.",
        "next_action[string|null]": "Restore access, rerun test, and inspect outputs.",
        "verified_at[string|null]": null
      }
    ],
    "remaining_requirement_ids[array<Reference>]": [
      {
        "id[string]": "R1"
      }
    ],
    "success[boolean|null]": null,
    "summary[string|null]": "Blocked; requirement not verified.",
    "artifacts[array<Artifact>]": [],
    "validation[array<ValidationCheck>]": [
      {
        "check[string]": "Malformed-input test",
        "passed[boolean]": false,
        "evidence[array<Evidence>]": []
      }
    ],
    "errors[array<ErrorEntry>]": [
      {
        "message[string]": "Runner denied access before testing."
      }
    ],
    "receipt[object<Receipt>|null]": null
  },
  "unrequested_changes[object<DeviationAudit>]": {
    "additions_outside_requirements[array<Deviation>]": [],
    "revisions_outside_requirements[array<Deviation>]": [],
    "additional_constraints[array<Deviation>]": [],
    "scope_reductions[array<Deviation>]": [],
    "abstraction_level_changes[array<Deviation>]": [],
    "abstraction_mismatches[array<Deviation>]": [],
    "action_scope_minimizations[array<Deviation>]": [
      {
        "id[string]": "D1",
        "original_expectation[string]": "Produce tested implementation.",
        "actual_or_proposed_change[string]": "Produced only a plan.",
        "rationale[string]": "Runner unavailable.",
        "affected_requirement_ids[array<Reference>]": [
          {
            "id[string]": "R1"
          }
        ],
        "approval_status[string]": "pending",
        "evidence[array<Evidence>]": []
      }
    ]
  }
}
```

### Complete terminal failure record

Unmet R1 stays in remaining list, failing test recorded, `failed`/`false` pair and typed terminal receipt. Failure is not successful execution.

```json
{
  "schema[string]": "issuestack.task.v3",
  "nonce[string]": "example-r1-001",
  "ordinal[number|null]": null,
  "source[object<Source>]": {
    "issue[number]": 1,
    "comment_id[number|null]": 90123456
  },
  "interpretation[object<Interpretation>]": {
    "revised_instruction[string]": "Implement and verify malformed-input rejection.",
    "user_intent[object<UserIntent>]": {
      "goal[string]": "Keep invalid records out of the queue.",
      "expected_outcome[string]": "Invalid payload rejected; valid payload transfers once.",
      "requested_abstraction_level[string]": "Implemented code and regression tests.",
      "requested_action_scope[string]": "Edit parser and tests, run checks, publish report."
    }
  },
  "requirements[array<Requirement>]": [
    {
      "id[string]": "R1",
      "description[string]": "Reject malformed input without losing original text.",
      "acceptance_criteria[array<AcceptanceCriterion>]": [
        {
          "text[string]": "Invalid JSON retains source text and shows a tagged diagnostic."
        }
      ]
    }
  ],
  "constraints[array<Constraint>]": [
    {
      "id[string]": "C1",
      "description[string]": "Preserve all previously completed jobs.",
      "source[string]": "User instruction",
      "applies_to_requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ]
    }
  ],
  "decomposition[array<WorkItem>]": [
    {
      "id[string]": "W1",
      "description[string]": "Add malformed-input regression coverage.",
      "requirement_ids[array<Reference>]": [
        {
          "id[string]": "R1"
        }
      ],
      "depends_on[array<Reference>]": [],
      "expected_output[string]": "Three regression cases saved.",
      "verification_method[string]": "Run test suite and read back file.",
      "status[string]": "failed",
      "worker[string|null]": "Example worker",
      "evidence[array<Evidence>]": []
    }
  ],
  "planning[object<Planning>]": {
    "status[string]": "in_progress",
    "method[string]": "Read schema, implement tests, inspect results.",
    "sources[array<ResearchSource>]": [
      {
        "title[string]": "IssueStack v3 type registry",
        "url[string]": "https://github.com/BestNameYet/IssueStack-/blob/main/src/types/issuestack.task.v3.json"
      }
    ]
  },
  "execution[object<Execution>]": {
    "status[string]": "failed",
    "enqueued_at[string|null]": "2026-10-25T08:00:00.000Z",
    "started_at[string|null]": "2026-10-25T08:02:00.000Z",
    "finished_at[string|null]": "2026-10-25T08:09:00.000Z",
    "worker[string|null]": "Example worker"
  },
  "completion[object<Completion>]": {
    "by_requirement[array<RequirementCompletion>]": [
      {
        "requirement_id[string]": "R1",
        "status[string]": "failed",
        "evidence[array<Evidence>]": [],
        "blocker[string|null]": "CI token lacks read permission.",
        "next_action[string|null]": "Restore access, rerun test, and inspect outputs.",
        "verified_at[string|null]": null
      }
    ],
    "remaining_requirement_ids[array<Reference>]": [
      {
        "id[string]": "R1"
      }
    ],
    "success[boolean|null]": false,
    "summary[string|null]": "Terminal failure: R1 is still unmet.",
    "artifacts[array<Artifact>]": [],
    "validation[array<ValidationCheck>]": [
      {
        "check[string]": "Malformed-input test",
        "passed[boolean]": false,
        "evidence[array<Evidence>]": []
      }
    ],
    "errors[array<ErrorEntry>]": [
      {
        "message[string]": "Runner denied access before testing."
      }
    ],
    "receipt[object<Receipt>|null]": {
      "nonce[string]": "example-r1-001",
      "source_issue[number]": 1,
      "source_comment_id[number]": 90123456,
      "queue_issue[number]": 2,
      "queue_comment_id[number]": 90123457,
      "executor[string]": "Example worker",
      "started_at[string|null]": "2026-10-25T08:02:00.000Z",
      "finished_at[string|null]": "2026-10-25T08:09:00.000Z",
      "run_id[string|null]": null
    }
  },
  "unrequested_changes[object<DeviationAudit>]": {
    "additions_outside_requirements[array<Deviation>]": [],
    "revisions_outside_requirements[array<Deviation>]": [],
    "additional_constraints[array<Deviation>]": [],
    "scope_reductions[array<Deviation>]": [],
    "abstraction_level_changes[array<Deviation>]": [],
    "abstraction_mismatches[array<Deviation>]": [],
    "action_scope_minimizations[array<Deviation>]": []
  }
}
```

### Contrasting field choices

- A `Reference.id[string]` is an **R ID** in requirement/constraint/completion collections and a **W ID** only for `WorkItem.depends_on[array<Reference>]`. Use exactly the correct typed Reference object each time.
- `Source.comment_id[number|null]` is null at intake, then workflow-supplied. `Execution.finished_at[string|null]` is null while active. `Completion.success[boolean|null]` and `Completion.receipt[object<Receipt>|null]` remain null for pending/running/blocked, then become truthfully terminal values. `Evidence.uri[string|null]` can be null when a genuine observed check has no link; `Artifact.uri[string]` is always a string for a real published output.
- A verified `RequirementCompletion` has evidence and `verified_at`; a blocked entry has a concrete `blocker` and `next_action` but no verification time; a terminal failed entry records the failure and stays in remaining requirements.
- **Proposed deviation:** a complete `Deviation` object with `approval_status[string] = "pending"`, affected R IDs and supporting evidence. **Approved deviation:** the same complete typed object but `"approved"` with actual approval evidence. A rationale alone does not confer approval. A rejected divergence has `"rejected"`. Success requires material deviations resolved, not merely documented.

### Issue #3 scratchpad few shot (Markdown, not task JSON)

```text
# Job 90123457 scratchpad
<!-- ISSUESTACK_PAD_JOB:90123457 -->
Nonce: example-r1-001
Handshake: Issue #1 source slot 90123456; ledger 6392246635;
Issue #2 job 90123457; index 6392250512; Issue #3 pad 90123458.
Verified nonce, ledger transfer and exact mapped pad marker.
Intent before changes: create tests/validator.test.js to test malformed JSON.
Read back this pad, then claim the job, work and verify acceptance criteria.
Observed: runner permission denied; R1 is still pending verification.
Next: restore runner access and retry; do not claim completion.
```

Use real mapped IDs, not these hypothetical ones. Preserve the identity marker and history, append amended intent **before** unexpected job/file edits, and verify each scratchpad write. Avoid secrets and private hidden reasoning.

### Verification and completion rules

1. Validate each JSON root/nested field name and value against Issue #1 and `src/types/issuestack.task.v3.json`; keep zero unknown or omitted keys and respect nullable declarations. The illustrative records above are *examples*, not real evidence.
2. Do not remove an R ID from `completion.remaining_requirement_ids` until independent acceptance evidence exists. Record actual test failures, artifacts, blockers, scope differences, and approvals.
3. Terminal success requires `execution.status = "succeeded"`, `completion.success = true`, no remaining R IDs, and a read-back terminal receipt. Terminal failure requires `"failed"`/`false`, unmet requirements recorded, and a receipt. In progress or blocked means null success/receipt.
4. Update **the existing Issue #2 job comment**, fetch it again and verify all fields. The Issue #3 scratchpad archive and Issue #2 index must also be independently checked; terminal publication does not establish archival.

