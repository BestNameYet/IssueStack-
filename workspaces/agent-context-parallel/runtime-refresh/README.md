# Independent runtime and refresh evidence — IssueStack R4/R8

**Child job:** [6456876636](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6456876636)  
**Parent:** [6452132288](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6452132288)  
**Published registry:** [Issue #8 TOC](https://github.com/BestNameYet/IssueStack-/issues/8#issuecomment-6453791402)  
**Verified source commit for refresh implementation:** `9755518bd25180437f95e5b4452609f0904d0ec4`

## Artifacts

- `operational-evidence.v1.json` records dated GitHub Actions observations, current source/registry divergence, and a byte-verified historical queue-to-archive lifecycle sample.
- `refresh-audit.v1.json` evaluates 12 acceptance checks and five negative scenarios against original parent R4/R8. Every outcome distinguishes demonstrated, staged-test-only, inferred or still unverified behavior.

## Independently repeat the checks

1. Read current `AGENTS.md` and the exact Issue #6 instructions for job handling, source precedence, and review.
2. Fetch `issues/comments/6453791402` and `issues/comments/6453775750` and compare their source commit, generated timestamp, runtime observation timestamp, and recorded parent requirement count to the live `main` ref and the current parent job `issues/comments/6452132288`.
3. Fetch `actions/runs?per_page=100`, retain run IDs/events/conclusions/timestamps, and **do not** claim missing scheduled runs are globally absent from this bounded list.
4. Inspect the immutable refresh implementation at commit `9755518bd25180437f95e5b4452609f0904d0ec4`: `.github/workflows/issue8-context-refresh.yml`, `src/issue8-context-reconciler.js`, `src/issue8-context-publisher.js`, `src/issue8-context-runtime.js`, and `config/agent-context-registry.json`.
5. Check historical job `6418283367`, scratchpad `6418284174`, transfer ledger comment `6392246635`, index `6392250512`, and `scratchpads/archive.json`. The archived entry's content matched the current pad byte-for-byte when audited.
6. Confirm the staging workflow run [40590076691](https://github.com/BestNameYet/IssueStack-/actions/runs/40590076691) succeeded; **do not** substitute it for a scheduled production run.
7. Compare published commit `2422c64d3ecd6e99fe9d7695e381b862f91026f5` with the commit recorded in `operational-evidence.v1.json`. A live `main` ref can advance independently due to archive or other unrelated workflow activity.

## Significant findings

- **Source-driven refresh incomplete:** Normal `main` pushes are not watched; the only configured push branch is a historical staging branch, with daily cron and manual dispatch separately configured.
- **Review gate protects Issue #8:** `publish.enabled=false`, `allow_unattended_issue_writes=false`, read-only `issues:read`; proposed changes are audits, not automatic accepted edits.
- **TOC contract incompatibility:** The publisher's constructed TOC links omit a `sha256` field demanded by the reconciler. This should be fixed and tested before future publishing.
- **Freshness dimensions differ:** A runtime observation may be inside the 48-hour maximum while its source commit and parent job state have become outdated.
- **Historical end-to-end sample verified:** One IssueStack job genuinely reached a successful typed receipt and archived mapped scratchpad. This is not evidence of universal current reliability.

## Completion and integration boundary

These workstream outputs are **staged evidence**, not production registry pages. Original R4 has useful verified evidence but incomplete subsystem coverage and reliability proof. Original R8 remains open because automated affected-entry updates, publisher consistency and production scheduled-run verification are not demonstrated.

The parent job must integrate evidence only after independent review. No scope here authorizes direct editing of Issue #8, source `main`, or another child's deliverables. Additional code fixes require their own candidate diff, exact-change review and acceptance tests.

Semantic post-command chores must follow the active contract at `config/semantic-operator-contract.v1.json`. Any novel observed failure should become an evidence-linked proposal, not an unreviewed mutation.
