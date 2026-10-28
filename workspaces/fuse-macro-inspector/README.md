# Fuse Bridge Macro Inspector

A mobile-responsive, **local-only** fuse photograph comparator. A dark discontinuity where the reference has a continuous metallic bridge is evidence **consistent with a blown fuse**, not electrical proof.

## Running
Static modules; no build dependencies. In this directory run `python3 -m http.server 8000` and open `http://localhost:8000`. A GitHub repository source URL is not a deployed web app; GitHub Pages must be enabled separately for web access. The tool uses local image files, does not send images to any remote host, and does not store them.

## Controls
Select a suspect and intact-reference image. Adjust region center X/Y, independently zoom each view, choose Original / CLAHE / Sharpen / Sobel Edges / Grayscale / Invert; tune brightness/contrast/gamma. Tap each canvas twice to measure a visible distance in pixels. Export a two-panel comparison PNG. Enhancements create halos and contrast artifacts: always compare with the original. Different camera distances invalidate cross-image pixel-distance comparison.

## Tests
Run `npm test` using Node 18+ built-in test runner and synthetic fixtures. Verify browser controls separately: image selection, crop, toggles, marking and local export.

## Safety
This is an **image viewing** tool, not a fuse-continuity tester. Confirm suspected failure with a multimeter on a removed, de-energized fuse. Do not bypass or up-rate a fuse. No personal sample photographs are included.
