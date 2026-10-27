# Heather — handoff for a new report maker

## Assignment

Rebuild the **23-recording Recorded Statements Review** for **Facebook Messenger and phone reading**. The next edition should be **punchier, shorter, clearer, and visually stronger** than the examples. Do not merely restyle the old PDF or paste long transcripts into smaller pages.

**Keep the subject and speakers straight:**
- **Heather** = the person addressed in the report. “Heather Lindsay” and “Heather Fowle” refer to this **one Heather**. Use the single name **Heather** throughout the body; give the alias mapping once in source notes.
- **Sam** = a **separate participant**, speaking with Heather in **recordings 17–23 (October 26, 2026)**. Do not portray Sam as a second Heather.
- **Jason Law** = correct name for the earlier conversation partner. Do **not** use the old export handle **Jael Law**.
- Source materials may still contain earlier export names; the identity correction above **supersedes them**.

## Start with these materials

| Material | Purpose |
| --- | --- |
| [All 23 full edited transcripts](./maker-full-transcripts-23.md) | Quote source; preserve wording and chronology, rather than working from an abbreviated PDF |
| [23-recording content map](./maker-key-claims-map.md) | Per-recording summary, **key claim**, **point of contention**, date, partner, and classification |
| [Direct-address report example](./combined-23-presenter-to-heather-grade9.md) | Context and transcript style; body addresses Heather as “you” |
| [Detailed chronological example](./combined-23-contextual-edited-report.md) | Secondary reference for context and source interpretation |
| [Current mobile PDF](./heather-recorded-statements-mobile.pdf) | **Visual reference only**, not the editing source |
| [Original 2026 transcript table](./transcript-table.md) | Rawer October context and recordings |
| [Original 2025 contextual report](./heather-lindsay-pre-oct14/model-reports/contextual-report.md) | Older source passages and classifier results |
| [2025 source inventory](./heather-lindsay-pre-oct14/inventory.json) and [2026 source inventory](./heather-fowle/inventory.json) | Record matching, ordering, timestamps |
| [Existing mobile-PDF renderer](./scripts/render_mobile_report.py) | Reproducibility reference; redesign is encouraged |
| [Classifier technical notes](./README.md) | Identify precisely which program generated the labels |

**Audio:** a preassembled 23-recording source archive is available in this conversation as `heather_23_recordings_chronological.zip`. The repository also stores original source audio under `heather-lindsay-pre-oct14/audio/` and `heather-fowle/audio/`. Audio need not be retranscribed unless explicitly commissioned.

## Editorial rules

1. **Lead with the point.** In each recording, give one compact context statement explaining the important assertion, denial, conflict, or change in account. Often **25–45 words** suffice.
2. **Show only the meaningful words.** Use **selective transcript excerpts** for longer recordings. Retain the words that make or qualify a central claim; preserve hedges, denials, uncertainty, and timing. A cut must not reverse the speaker's meaning.
3. **Mark cuts visibly.** Use **…** where words are omitted. Do not put paraphrases in quotation marks. If you summarize rather than quote, label it **Summary**, not **Transcript**.
4. **Keep speech readable.** Natural line/paragraph breaks at thought changes; one-column; avoid transcript walls.
5. **Remove bloat and errata.** Omit redundant section titles, repeated dates, file IDs, export handles, double explanations, repeated boilerplate, model jargon and editorial filler. Correct clear typographical errors. Use **[unclear]** rather than guessing speech.
6. **Be direct but neutral.** The narration addresses Heather: “Heather, you say you left…” or simply “You say…”. Never imply an accusation was established merely because a message discussed it.
7. **Keep the distinctions sharp.** The subject's words, other people's allegations, editorial summary, and computer classification are four different things.
8. **Aim for ninth-grade readability.** Everyday vocabulary; short, active sentences; factual wording; no heavy-handed analysis.

## Eval labels: minimal text, maximum clarity

Use the program name instead of “Model” or a long heading:

- **TruthDetection says: Deceptive** — bold, red.
- **TruthDetection says: True** — bold, green.

Put the result **AFTER** the transcript/excerpts. Avoid another heading such as “Model conclusion” immediately above it. There is no need to repeat a lengthy qualification 23 times.

**One short method note near the start or end:** “TruthDetection is an experimental audio classifier. Its labels do not establish whether a statement is true or false.” Labels are **classification outputs**, not lie findings. The source model calls them “Deceptive Story” and “True Story”; the short forms are display labels only. Do not invent confidence scores or acoustic findings.

## Suggested mobile entry layout

**07  ·  Sep 8, 2025  ·  8:09 PM**  
**With: Marland**

**What you said**  
You say you saw Marland's brother and helped with food and supplies.

**From the recording**  
“[Exact, short excerpt from source] … [Exact later excerpt]”

**TruthDetection says: Deceptive**  
*Show this line in bold red. For “True,” use bold green.*

This is a **structure example**, not a quotation to publish as written. Replace bracketed text with exact verified transcript passages.

## Story first, details afterward

**The main report must read like a connected story, not 23 separate test reports.** Open by explaining that TruthDetection analyzed Heather's recordings, then establish the contrast: **nine labeled True** and **fourteen labeled Deceptive**. Use a few specific examples to build the narrative, moving from earlier conversations to the seven recordings with Sam (**one True; six Deceptive**). Finish the main narrative with a **short, clear conclusion** that summarizes what the program labeled.

**Do not interrupt the narrative** with long transcript passages, technical commentary, repeated evaluations, or an explanation of every recording. If a finding needs more explanation than fits naturally in a sentence or short quotation, provide its recording number and put the detail in an **appendix after the main conclusion**.

### Appendix — results and source detail

After the story and conclusion, provide a **recording-by-recording appendix covering all 23 retained recordings**. For each include:

1. **Recording number, short date/time, conversation partner** (Heather is the report's subject; Sam is a different person).
2. **What Heather said** — one or two clear sentences identifying the key claim or denial.
3. **Selected transcript excerpts** preserving her own words, with **…** marking skipped passages and **[unclear]** where necessary.
4. **TruthDetection says: True** or **TruthDetection says: Deceptive**, in bold green or red.
5. **Context or contention**, only when it adds information needed to understand the result. No repeated filler.

Group appendix entries into **True (9)** and **Deceptive (14)** or supply an equally clear navigation scheme; keep timestamps chronological **within each group** and retain the original recording numbers for cross-reference. Ensure every result appears in the appendix, even when only a few appear in the story.

**Narrative rule:** The main story is the argument; the appendix is the supporting record. The reader should understand the contrast, the Sam findings, and the conclusion **without reading the appendix**. The appendix should make each result easy to inspect without forcing the story to become a catalog.

## Overall organization

- **Cover:** “Recorded Statements Review” / **Heather** / “23 recordings · Aug 2025–Oct 2026”.
- **Opening:** Quickly explain what TruthDetection did and the split: **9 True**, **14 Deceptive**.
- **Truthful-labeled examples:** A few concrete statements to Jason Law, Rob Peoples, others, and the one recording with Sam.
- **Deceptive-labeled examples:** Earlier conversations, then the **six recordings with Sam** receiving this label. Build toward the strongest central contentions.
- **Conclusion:** A short, direct closing of the main narrative, **before** the detailed records.
- **Appendix:** All 23 numbered recording results, short excerpts, and any necessary context or contention.
- **Source note:** Brief conventions for transcript edits, ellipses, and uncertainty. Avoid repeating this in each entry.

**Date example:** `Aug 28, 2025 · 2:52 PM` (Pacific). Drop seconds, ISO dates, and repeated “PDT” on every entry.

## Mobile and Messenger design requirements

- **Attachment-first PDF**, self-contained, selectable text, no outside website required to read.
- Narrow, **portrait phone-friendly pages**, a **single column**, readable ~11–12 pt body type, generous line spacing, clear contrast, and comfortable margins. The previous renderer used **360 × 640 pt**; refine if needed.
- **Big scan targets:** large timestamp/entry title, short scene, airy quotation blocks, compact bold red/green result.
- **No wide tables, tiny footnotes, oversized cover pages, dense legal layout, arbitrary page breaks, or wasted blank pages.**
- **Keep the final excerpt and conclusion together** rather than leaving a result stranded alone on the next page.
- Aim to keep each entry to **one phone-sized page where the content allows**; do not shrink the font to force it.
- Export a modest-size PDF suitable for Messenger's file attachment flow. Test it on an actual smartphone screen or phone-sized PDF renders.

## Editorial priorities

The clearest disputed narratives are **#1**, **#4**, and **#17–23**. They include denials about place and timing, reported police information, a disputed overnight visit, and allegations about the Crown Inn and N.O. These need extra care to distinguish **what Heather says** from **what another person allegedly claimed**. The rest include shelter, work, travel, help to others, food-bank visits, and messages. Do not manufacture conflict in neutral everyday exchanges.

**Avoid unsupported additions:** no invented witnesses, evidence, “confirmed lies,” credibility percentages, behavioral diagnoses, or confident correction of unknown words. Do not silently rename people inside quotations unless directly supported; apply corrected recipient names in metadata and narrative.

## Acceptance checklist

- [ ] Exactly **23 recordings**, with the **two near-silent Jason Goode recordings excluded**
- [ ] **Heather** is one subject; **Sam** is separate on #17–23; **Jason Law** named correctly
- [ ] Complete source transcripts and per-recording claims map reviewed
- [ ] No speech invented; omissions visibly indicated; qualification and context retained
- [ ] Punchy context; trimmed excerpts; minimal headings and repeated text
- [ ] All dates short and clear; original chronology preserved within each category
- [ ] **TruthDetection says: Deceptive / True** after each excerpt, bold red or green
- [ ] Counts remain **14 / 9**, with one short note explaining the program's limits
- [ ] Mobile-sized, one-column PDF; text selectable; no orphan result pages
- [ ] Main story has a clear conclusion **before** the appendix
- [ ] Appendix accounts for all 23 recordings and lets readers inspect the exact labeled results
- [ ] Visual phone test, full-text extraction check, and file-opening test completed
- [ ] Share final Messenger-ready PDF **and** editable source file if possible

**Working principle:** Make the strongest relevant statements easy to see, without exaggerating what the recordings or the classifier establish.
