# Issue-comment input surface: verification suite

## Scope and execution

The suite tests the JSON writer, routed virtual GitHub event contract, workflow wiring, and existing downstream consumer behavior without modifying live GitHub Issue comments. It runs on GitHub Actions with read-only `contents: read` permissions.

Run the full suite on GitHub by changing a file under `tests/`, the runtime or schema, or a routed workflow. The CI file is `.github/workflows/issue-comment-input-tests.yml`. It also supports manual `workflow_dispatch`.

Run locally at the repository root with Node.js 22:

```bash
node --test --experimental-test-coverage \
  workspaces/issue-comment-input-surface/tests/*.test.js \
  src/issue-1-intake.test.js \
  src/issue5-projection.test.js \
  src/issue5-projection-workflow.test.js \
  src/issue5-presentation.test.js \
  src/issue5-presentation-integration.test.js \
  src/interactive-procedures.test.js \
  test/agent-context-registry.test.js \
  test/issue8-context-reconciler.test.js
```

This command invokes only isolated local Node.js tests; it does not submit a JSON instruction file or use GitHub's Issue-comment APIs.

## What is covered

- **Writer contract:** required fields, types, extra keys, valid and invalid IDs, path traversal, path scope, rejection of invalid operations, no separator insertion, whitespace and Unicode preservation, and exact prepend/replace/append semantics.
- **Writer combinations:** seven Issues (1, 2, 5, 7, 8, 13, 30), two comment-ID modes (existing/new), and three text operations: **42 distinct mocked write combinations**. These verify the low-level writer, **not** downstream business-policy permission for each combination.
- **Event virtualizer:** all 11 declared Issue/action pairs, including `created` and `edited`, previous-body history, inherited GitHub context getters, user/repository authorization, invalid event types, invalid IDs, and disallowed issue/action pairs.
- **Failure paths:** wrong Issue ownership, target is a pull request, invalid input, stale comment, receipt-write failure, failed comment mutation, readback mismatch, pending receipts, completed-receipt replay, and duplicate-append prevention.
- **Workflow wiring:** source-to-target event payload, route matching, callable secondary workflows, native trigger preservation, pinned Issue #8 registry comment, export marker on Issue #30, and negative-route exceptions.
- **Existing consumer regressions:** Issue #1 intake, Issue #5/#7 projection and rendering, Issue #13 procedures, and Issue #8 context helper modules.

The versioned routing and acceptance matrix is in [tests/coverage-matrix.json](tests/coverage-matrix.json). A missing required route is a **hard failing assertion**, not a passing or skipped test.

## Issue-specific acceptance matrix

| Issue | Expected secondary workflow | Event cases | Live mutation policy |
| --- | --- | --- | --- |
| #1 | `issue-1-intake.yml` | created, edited | Existing pinned slots only; do not create an overflow comment |
| #2 | `issue-2-scratchpad-completion.yml` | created, edited | Protect index comment `6392250512`; use mock or pending no-op fixture |
| #5 | `issue5-projection.yml` | created, edited | Preserve odd/even role parity and bot-owned projection regions |
| #7 | `issue5-projection.yml` | created, edited | Protect bot-owned source pair and return schema |
| #8 | `issue8-nonce-registry.yml` | edited | Only pinned registry comment `6453773625`; route integration missing |
| #13 | `interactive-procedures.yml` | edited | Preserve procedure state and typed return ownership |
| #30 | `export-issue3-scratchpads.yml` | created | Require export marker and verify resulting artifact |

The table lists *desired coverage*, not evidence that every variant has passed live. In particular, the Issue #8 `workflow_call` route is missing and currently prevents a clean routing-coverage gate.

## Full-coverage release criteria

The suite is comprehensive in its **planned test matrix**, but deployment should not be called fully covered until all of the following evidence exists:

1. Every matrix route is present, callable, and passes the static coverage gate; no Issue/action combination is silently omitted.
2. The deterministic suite passes without excluding known failures or weakening checks.
3. Each route's actual live trigger reaches exactly the correct secondary workflow, with recorded comment IDs and durable writer/consumer receipts, using isolated authorized fixtures that cannot corrupt production ledgers, parity, registry or procedure state.
4. Create and edit cases are verified where legitimate; prohibited combinations are verified as rejected, not forcibly executed.
5. Concurrent instruction changes, workflow cancellation, stale comments, bot-authored comments, and retry recovery are exercised in isolated conditions with no lost or duplicated work.
6. All results have immutable run IDs and readback evidence, and test cleanup is separately verified.

The first two are enforceable in the read-only CI suite. Requirements 3–6 require a separately authorized live-fixture environment. A passing mocked run must **never** be reported as a production end-to-end proof.

## Known gaps at suite creation

- Issue #8 lacks the reusable trigger and dispatch route. The static completeness test intentionally fails until that integration is implemented and verified.
- GitHub's concurrency behavior previously cancelled rapidly submitted instructions and produced an HTTP 409. The unit tests cover stale-write and receipt mechanisms but do **not** establish correct real-world concurrent delivery.
- No disposable GitHub Issues fixture set has been provided for safe exhaustive live create/edit tests. The suite does not create or modify real comments.
- The existing workflow's Issue #1 create event and the input writer's generic `comment_id: "new"` behavior require separate compatibility verification against Issue #1 fixed-slot rules.
