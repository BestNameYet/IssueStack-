# Heather public website

A GitHub Pages port of the mobile Heather recorded-statements review. The main narrative leads to the conclusion before the supporting archive. All 23 records have complete edited transcripts and inline MP3 audio, result filters, search and permanent anchors. Recording 18 (True) appears before the six Deceptive Sam recordings in the narrative.

## Build

Requirements: Python 3.11+, Node.js, FFmpeg/ffprobe. No Python or JavaScript packages are required.

From the repository root:

```sh
python3 workspaces/audio-deception-comparison/public-site/build.py --public-url https://bestnameyet.github.io/IssueStack-
```

The generated `_site/` is confined to this workspace. The build verifies 23 original audio SHA-256 hashes, converts existing repository OGG recordings to 64 kbps MP3, checks durations, checks the 9/14 split and Sam ordering, verifies narrative excerpts against transcripts, and checks JavaScript syntax. It creates a build-receipt.json identifying all source and output audio hashes. The expected Pages URL above is configuration, not evidence of a successful deployment; use the deployment receipt for the actual URL.

## Publication

`.github/workflows/heather-public-site.yml` builds and uploads a review artifact for this staging branch and pull requests. It deploys only when this candidate is approved and promoted to main, or explicitly dispatched on main. Native configure-pages/upload-pages-artifact/deploy-pages actions configure and publish the site. The WORKSPACE_API repository secret is used only by configure-pages if available for initial Pages enablement; absent that secret, Pages must already be enabled in repository settings. No token is written into site assets or logs.

Changing GitHub Pages enablement affects repository hosting and requires the appropriate existing token permissions. If it is unavailable, the build artifact remains available and deployment must be reported blocked. The site contains personal recordings and is intended to be public under the user's explicit instruction; noindex is retained but is not access control.

## Source provenance and validation limits

Source text and inventory mapping were carried over from the existing Sites build at commit 1dac256cdca581d2f8981b5d18066094f618e4bf. Original recordings remain in the two sibling audio folders and are never changed. The existing automated transcripts were edited for readability; uncertainty notation is preserved. Labels are attributed to TruthDetection and apply to whole recordings.

The original preview verified inline playback, filtering, search, anchors, transcript expansion and a 375px phone-sized layout without overflow. Actual Messenger/iPhone/Android testing and live unauthenticated GitHub Pages checks are separate publication acceptance checks.
