# Commit-to-Workflow Discovery Test

Purpose: experimentally verify whether GitHub connector `fetch_commit_workflow_runs` discovers `push` and `pull_request` workflow runs associated with a commit SHA.

Test matrix:
1. Record a known commit SHA and verify its associated GitHub Actions runs through the unfiltered REST listing (`head_sha`).
2. Compare the connector's results for that SHA with REST results filtered by `event=push` and `event=pull_request`.
3. Exercise a controlled push-triggered workflow and a pull-request `synchronize` workflow, recording run ID, `head_sha`, `run_attempt`, status, and conclusion.
4. Distinguish head commit SHA from synthetic pull-request merge SHA.
5. Capture tool invocation, raw response, workflow event, timestamps, and verification receipts. Do not equate an empty result with proof of filtering.

Baseline: Terminals commit `3e7c053bc1f79216e771ef30db01cf93287bf076` returned zero runs from both connector and unfiltered REST; this is inconclusive for filtering behavior.

Status: workspace initialized; no trigger or discovery comparison tests executed here yet.
