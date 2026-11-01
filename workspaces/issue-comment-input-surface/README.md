# Issue Comment Input Surface

This workspace specifies JSON instructions for a GitHub Issue-comment writer operating in `BestNameYet/IssueStack-`.

Only JSON files placed in `instructions/` are executable inputs. The schema under `schema/`, the test report, and examples in this README are documentation, not instructions. The GitHub Actions input workflow is enabled for owner-authored instruction-file pushes and explicit workflow dispatch. The Issue #8 secondary workflow is **not** integrated; unsupported Issue/action combinations do not dispatch a secondary workflow.

## Required instruction object

Each instruction file contains exactly one JSON object with four required fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `issue_number` | Positive integer | Number of the target Issue in this repository |
| `comment_id` | Positive integer or `"new"` | Existing comment ID to edit, or `"new"` to create a comment |
| `text` | String | Exact text to insert or use as replacement |
| `operation` | `"prepend"`, `"replace"`, or `"append"` | How to combine `text` with the existing comment body |

Example (documentation only):

```json
{
  "issue_number": 8,
  "comment_id": "new",
  "text": "Example comment text",
  "operation": "replace"
}
```

## Deterministic semantics

For an existing comment ID, fetch the body and verify that the comment belongs to the specified Issue before editing:

- `prepend`: new body = `text + existing_body`.
- `replace`: new body = `text`.
- `append`: new body = `existing_body + text`.

The workflow must not insert implicit separators, spaces, or newlines; include those in `text` when desired. When `comment_id` is `"new"`, create a new comment whose body is exactly `text`, regardless of the required operation value (there is no existing body). Record the new numeric comment ID in the execution receipt.

## Validation and execution boundary

Schema: `schema/comment-write.schema.json` (JSON Schema Draft 2020-12). Reject missing fields, unknown fields, invalid operation values, and invalid identifiers. Validate actual target-Issue ownership for existing comments before writes, and verify the created or edited comment by reading it back. Do not process the schema file or README as commands. A future workflow must define its own trigger, deterministic file ordering, idempotency and execution receipts before it is considered operational.

The existing IssueStack Issue #1 intake and Issue #5 conversation handling are not modified by this specification.

## Workflow trigger inventory

[comment-triggered-workflows.json](comment-triggered-workflows.json) lists the GitHub Actions workflow files on `main` that directly declare `issue_comment` triggers, their created/edited event types, Issue filters, and source blob identities. The list is a configuration snapshot: enabled/disabled status in GitHub Actions could not be verified. No workflow is installed or changed by this inventory.

## Live integration tests (2026-11-01)

[Read verified route-test results](route-test-results-20261101.json). Issue #1 (edit), Issue #2 (edit), Issue #5 (edit), Issue #7 (edit), Issue #13 (edit), and Issue #30 (create/export) passed through the JSON input surface and secondary jobs. Issue #8 remains unintegrated. Other created/edited combinations are untested. The report records failed initial attempts, their causes, residual pending receipt, and retained temporary Issue #30 test comments.
