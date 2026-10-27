# Facebook export ZIP — file extension inventory (2026-10-26)

This report inventories the **original ZIP's entries**, including files in nested folders. Extensions were counted case-insensitively using the final filename suffix. This is an archive inventory, **not** an audio-content transcription or download of linked external media.

- **Source archive:** `facebook-heatherlindsay258967-2026-10-26-1npKT5hp.zip`
- **Source ZIP SHA-256:** `81b4170e1b021ed3aa72e0a700db3d32e7faa3473eabf83daf4214bc2e5eaf60`
- **ZIP size:** 32,486,303 bytes
- **Uncompressed file data:** 32,336,489 bytes
- **File entries:** 632
- **Explicit directory entries:** 0
- **Extensionless files:** 0
- **Distinct extensions:** 6
- **ZIP integrity check:** passed (no failed member)

| Extension | File type | Files | Uncompressed bytes |
| --- | --- | ---: | ---: |
| `.html` | HTML documents | 469 | 13,879,631 |
| `.jpg` | JPEG images | 124 | 15,951,648 |
| `.png` | PNG images | 16 | 36,034 |
| `.txt` | Plain text | 16 | 512 |
| `.mp4` | MP4 media containers | 5 | 2,074,423 |
| `.webp` | WebP images | 2 | 394,241 |
| **Total** | | **632** | **32,336,489** |

## Embedded audio check

The ZIP has **no `.wav`, `.mp3`, `.m4a`, or `.ogg` file entries**. A filename extension does not establish whether a container contains an audio track, so all five `.mp4` members were examined with `ffprobe`.

| MP4 stream configuration | Files |
| --- | ---: |
| AAC audio only (no video stream) | 1 |
| H.264 video and AAC audio | 1 |
| H.264 video only (no audio stream) | 3 |
| **Total MP4** | **5** |

**Audio-bearing files found in the ZIP: 2** (both `.mp4`). Media embedded as links to external services or encoded inside HTML content is outside this file-entry/stream inventory.

## Method

Read the ZIP central directory using Python's `zipfile` module; count every non-directory member by lowercased `PurePosixPath(...).suffix`; sum `ZipInfo.file_size` for each extension; validate the archive with `ZipFile.testzip()`; and inspect each extracted MP4's codec streams using `ffprobe -show_entries format=duration:stream=index,codec_name,codec_type,duration`.

Only aggregate metadata is published in this report; no private message bodies or audio bytes are included.
