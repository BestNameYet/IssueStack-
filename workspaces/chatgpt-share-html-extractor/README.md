# ChatGPT Shared Conversation Capture

Workspace for [IssueStack job 6553039875](https://github.com/BestNameYet/IssueStack-/issues/2#issuecomment-6553039875).

## Scope

Capture the raw HTTP HTML response from shared ChatGPT conversation links, then inspect the captured structure and extract messages in separately authorized steps. This workspace is isolated from the CommandLine api-to-node.js project.

## Initial capture

- Shared URL: https://chatgpt.com/share/6ae6b576-9fa8-83e8-a040-4091fe0218e3?ogimg=plain
- Capture workflow: `.github/workflows/chatgpt-share-html-capture.yml` (on branch `staging/chatgpt-share-html-capture-6553039875`).
- Verified GitHub Actions capture: https://github.com/BestNameYet/IssueStack-/actions/runs/41271181453
- Downloaded artifact: `chatgpt-share-html-41271181453` contains `response.html` and `response-metadata.json`; it has not been committed to this workspace.

No conversation parser has been implemented here.
