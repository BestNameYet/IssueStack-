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
