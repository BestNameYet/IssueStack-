# Heather public website

Mobile GitHub Pages story, inline audio, all 23 edited transcripts, filters, search and recording links. The content and visual design are unchanged by the audio reuse repair.

## Build without audio conversion

Requirements: Python 3.11+ and Node.js. No FFmpeg or operating-system package installation.

```sh
python3 workspaces/audio-deception-comparison/public-site/build.py --prebuilt /path/to/validated-audio --public-url https://bestnameyet.github.io/IssueStack-
```

The prebuilt directory must contain audio/01.mp3 through audio/23.mp3. The builder verifies all 23 original OGG hashes, compares every MP3 against the pinned audio-receipt.json, and copies only matching bytes. The receipt comes from successful approved-candidate CI run 40487389391, artifact 12725308667. It also checks labels, Sam ordering, excerpts, and JavaScript syntax. It fails on a missing or changed recording; it never falls back to installing a converter.

## Durable audio and deployment

The workflow first attempts to download release heather-site-audio-v1 / audio.zip. Before that release exists it bootstraps from the exact successful CI artifact. On main, after validation, the workflow creates the audio-only release if needed, without marking it as the repository’s latest release. Later runs reuse the release, so the 14-day bootstrap artifact lifetime does not affect normal deployments. The release holds only the already-authorized public MP3s; build.py verifies all content hashes after extraction. A missing release plus expired bootstrap artifact is a failure, never permission to substitute different audio.

Staging/PR runs build and upload a review artifact. Only main publishes the reusable audio and deploys Pages. Existing Pages enablement still requires the WORKSPACE_API secret with suitable permission or an already-enabled Pages site. Public availability is established by deployment receipts and live checks, not source presence. Original OGG audio and the private ChatGPT Site remain unchanged.

The original mobile preview passed playback, search, filtering, anchors, full transcript expansion and phone-sized overflow checks. Actual Messenger and physical-device testing remain separate.
