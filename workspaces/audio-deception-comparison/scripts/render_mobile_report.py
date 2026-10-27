#!/usr/bin/env python3
"""Render the reviewed 23-recording Markdown as a phone-first PDF."""
from __future__ import annotations

import html
import re
import sys
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer,
    HRFlowable, KeepTogether, PageBreak
)

HERE = Path(__file__).resolve().parent.parent
SOURCE = HERE / "combined-23-presenter-to-heather-grade9.md"
DEST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else HERE / "heather-recorded-statements-mobile.pdf"

font_dir = Path("/usr/share/fonts/truetype/dejavu")
font_regular = font_dir / "DejaVuSans.ttf"
font_bold = font_dir / "DejaVuSans-Bold.ttf"
if not (font_regular.is_file() and font_bold.is_file()):
    raise RuntimeError("DejaVu fonts must be installed")
pdfmetrics.registerFont(TTFont("MobileSans", str(font_regular)))
pdfmetrics.registerFont(TTFont("MobileSansBold", str(font_bold)))
pdfmetrics.registerFontFamily("MobileSans", normal="MobileSans", bold="MobileSansBold")

INK = colors.HexColor("#182536")
MUTED = colors.HexColor("#5D6877")
RED = colors.HexColor("#AD2424")
GREEN = colors.HexColor("#137547")
LINE = colors.HexColor("#DBE0E6")
ACCENT = colors.HexColor("#263C55")

PAGE_W, PAGE_H = 360, 640
MARGIN_X = 25

style_title = ParagraphStyle(
    "title", fontName="MobileSansBold", fontSize=19, leading=26,
    textColor=INK, spaceAfter=11
)
style_deck = ParagraphStyle(
    "deck", fontName="MobileSans", fontSize=11, leading=17,
    textColor=MUTED, spaceAfter=13
)
style_sec = ParagraphStyle(
    "section", fontName="MobileSansBold", fontSize=13.2, leading=18,
    textColor=INK, spaceBefore=4, spaceAfter=8
)
style_meta = ParagraphStyle(
    "metadata", fontName="MobileSans", fontSize=9.2, leading=14,
    textColor=MUTED, spaceAfter=12
)
style_label = ParagraphStyle(
    "label", fontName="MobileSansBold", fontSize=9.2, leading=13,
    textColor=ACCENT, spaceBefore=11, spaceAfter=5
)
style_body = ParagraphStyle(
    "body", fontName="MobileSans", fontSize=10.3, leading=16,
    textColor=INK, spaceAfter=10
)
style_quote = ParagraphStyle(
    "quote", fontName="MobileSans", fontSize=10.7, leading=16.8,
    textColor=INK, leftIndent=5, rightIndent=3, spaceAfter=12
)
style_result_red = ParagraphStyle(
    "redresult", fontName="MobileSansBold", fontSize=12.6, leading=18,
    textColor=RED, spaceBefore=4, spaceAfter=11
)
style_result_green = ParagraphStyle(
    "greenresult", fontName="MobileSansBold", fontSize=12.6, leading=18,
    textColor=GREEN, spaceBefore=4, spaceAfter=11
)

def escape(s):
    return html.escape(s, quote=False)

def para(text, style):
    return Paragraph(escape(text), style)

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 28, PAGE_W - MARGIN_X, 28)
    canvas.setFont("MobileSans", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 16, "RECORDED STATEMENTS REVIEW")
    canvas.drawRightString(PAGE_W - MARGIN_X, 16, str(doc.page))
    canvas.restoreState()

md = SOURCE.read_text(encoding="utf-8")
blocks = re.split(r"(?=^### \d+\. )", md, flags=re.MULTILINE)
head = blocks.pop(0)
if len(blocks) != 23:
    raise ValueError(f"Expected 23 reports, found {len(blocks)}")

parsed = []
for number, block in enumerate(blocks, 1):
    title_match = re.search(r"^###\s+(\d+)\.\s+(.+?)$", block, re.M)
    person_match = re.search(r"\*\*Who you were speaking with:\*\*\s*([^\n]+)", block)
    scene_match = re.search(r"\*\*Conversation context\*\*\s*\n\n(.*?)\n\n\*\*Edited transcript\*\*", block, re.S)
    transcript_match = re.search(r"\*\*Edited transcript\*\*\s*\n\n(.*?)\n\n\*\*Model conclusion:\*\*", block, re.S)
    conclusion_match = re.search(r"\*\*Model conclusion:\*\*.*\*\*(Deceptive Story|True Story)\*\*", block)
    if not all([title_match, person_match, scene_match, transcript_match, conclusion_match]):
        raise ValueError(f"Missing fields in recording {number}")
    assert int(title_match.group(1)) == number

    raw_transcript = transcript_match.group(1).strip()
    speech_paras = []
    buf = []
    for line in raw_transcript.splitlines():
        line = line.strip()
        if line in (">", ""):
            if buf:
                speech_paras.append(" ".join(buf))
                buf = []
            continue
        if not line.startswith(">"):
            raise ValueError(f"Unexpected transcript syntax in recording {number}: {line[:90]}")
        buf.append(line.lstrip("> ").strip())
    if buf:
        speech_paras.append(" ".join(buf))
    if not speech_paras:
        raise ValueError(f"No transcript for recording {number}")

    original_date = title_match.group(2).strip()
    if original_date.startswith("2026-"):
        parsed_dt = datetime.strptime(original_date.replace(" PDT", ""), "%Y-%m-%d %H:%M:%S.%f")
    else:
        parsed_dt = datetime.strptime(original_date.replace(" PDT", ""), "%B %d, %Y at %I:%M:%S %p")
    friendly_date = parsed_dt.strftime("%b %-d, %Y · %-I:%M %p PT")
    parsed.append({
        "number": number,
        "date": friendly_date,
        "conversation": person_match.group(1).strip(),
        "scene": scene_match.group(1).strip(),
        "transcript": speech_paras,
        "result": conclusion_match.group(1).strip(),
    })


# These are topic cues, not replacement speech. All displayed excerpts
# are extracted verbatim from the existing edited transcripts.
KEY_CUES = {
    1: ["Leroy", "apologize", "fired", "shelter"],
    2: ["enjoyed working", "transportation"],
    3: ["Channelview", "babies", "dogs", "keep your head up"],
    4: ["police", "Snow", "snitch"],
    5: ["Salvation Army", "park", "churches", "praying", "God"],
    6: ["bad choices", "responsible", "learning lesson", "don't be so harsh"],
    7: ["brother", "groceries", "shoes", "vitamins"],
    8: ["four", "interested", "business"],
    9: ["got here", "Channelview", "store"],
    10: ["Becky", "hernia", "emergency room"],
    11: ["messages", "Market", "food bank"],
    12: ["apologize", "wrong", "never asked"],
    13: ["food bank", "fruit and bread", "eggs", "Market"],
    14: ["made it in town", "trip", "see how you"],
    15: ["Bluetooth", "knee", "brother", "seeing you"],
    16: ["Durango", "cash", "buy"],
    17: ["changed my mind", "didn't", "spend the night", "Autumn"],
    18: ["fuck me", "get dressed", "drop me off", "stay", "move in"],
    19: ["shot", "George", "witness list", "Amy"],
    20: ["surveillance", "mentioned", "motel"],
    21: ["never seen", "shooting", "witness", "testify"],
    22: ["no reason", "lie", "truth"],
    23: ["Crown", "picked me up", "truck", "Terry"],
}

def select_key_excerpts(speech_paras, number, max_chars=740):
    """Select contiguous source-text spans, marking every omission with an ellipsis."""
    original = " ".join(speech_paras).strip()
    if len(original) <= max_chars:
        return speech_paras, False

    # The base paragraphs already break at plausible pauses. For long
    # paragraphs, split ONLY on sentence boundaries, without rewriting text.
    chunks = []
    for paragraph in speech_paras:
        sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z\[])", paragraph)
        chunks.extend(sentences if len(sentences) > 1 else [paragraph])
    # A long ASR run-on can lack sentence punctuation. Use comma pauses if needed.
    pieces = []
    for c in chunks:
        if len(c) <= 270:
            pieces.append(c)
        else:
            pieces.extend(re.split(r"(?<=,)\s+", c))
    pieces = [p.strip() for p in pieces if p.strip()]
    if len(pieces) < 2:
        # Never invent an ending: visibly mark a truncated source excerpt.
        return [original[:max_chars].rsplit(" ", 1)[0] + " …"], True

    cues = KEY_CUES[number]
    # Reward chunks containing the speaker's central claims. Include the
    # opening context when short; avoid saturating the budget with filler.
    scored = []
    for i, piece in enumerate(pieces):
        low = piece.casefold()
        hits = sum(1 for c in cues if c.casefold() in low)
        score = hits * 12 + (1.1 if i == 0 else 0)
        score -= 1.5 if len(piece) < 14 else 0
        scored.append((score, i))

    selected = set()
    size = 0
    for _, i in sorted(scored, key=lambda pair:(-pair[0], pair[1])):
        length = len(pieces[i])
        if length > max_chars:
            continue
        if size + length + 4 > max_chars:
            continue
        if len(selected) >= 7:
            break
        selected.add(i)
        size += length + 4

    if not selected:
        return [original[:max_chars].rsplit(" ", 1)[0] + " …"], True

    excerpts = []
    indexes = sorted(selected)
    for j, i in enumerate(indexes):
        # Mark words omitted before, between, or after the selected spans.
        prefix = "… " if i > 0 and (j == 0 or i != indexes[j-1] + 1) else ""
        excerpts.append(prefix + pieces[i])
    if indexes[-1] < len(pieces) - 1:
        excerpts[-1] += " …"
    # Validate that each selected span actually appeared in source order.
    cursor = 0
    for i in indexes:
        pos = original.find(pieces[i], cursor)
        if pos < 0:
            raise AssertionError(f"Excerpt mismatch in recording {number}: {pieces[i][:40]}")
        cursor = pos + len(pieces[i])
    return excerpts, True

assert sum(x["result"] == "Deceptive Story" for x in parsed) == 14
assert sum(x["result"] == "True Story" for x in parsed) == 9

doc = BaseDocTemplate(
    str(DEST), pagesize=(PAGE_W, PAGE_H),
    leftMargin=MARGIN_X, rightMargin=MARGIN_X,
    topMargin=29, bottomMargin=40,
    title="Recorded Statements Review - Heather Lindsay / Heather Fowle",
    author="IssueStack", pageCompression=1,
)
frame = Frame(
    MARGIN_X, 40,
    PAGE_W - 2*MARGIN_X, PAGE_H-40-29,
    leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0
)
doc.addPageTemplates(PageTemplate(id="mobile", frames=frame, onPage=footer))
story = []

story.append(Spacer(1, 12))
story.append(para("Recorded Statements Review", style_title))
story.append(para("Heather Lindsay / Heather Fowle", style_sec))
story.append(para("23 messages  |  August 2025 - October 2026", style_deck))
story.append(HRFlowable(width="100%", color=LINE, thickness=0.8, spaceBefore=5, spaceAfter=18))
story.append(para("Heather, this review brings together your recorded messages in time order. Each entry starts with the conversation background, followed by the edited transcript and the audio model's classification.", style_body))
story.append(para("Sixteen recordings are from August-September 2025 and seven are from October 2026. Two near-silent recordings were excluded.", style_body))
story.append(para("About the selected excerpts", style_label))
story.append(para("For longer recordings, only selected passages are shown. An ellipsis (…) marks omitted words. The excerpts retain the wording of the edited transcripts. [Unclear] marks words not confirmed. A model label does not establish whether a statement was true or false.", style_body))
story.append(Spacer(1, 14))
story.append(para("23 RECORDINGS", style_sec))
story.append(para("14 model labels: Deceptive Story", style_result_red))
story.append(para("9 model labels: True Story", style_result_green))
groups = [
    ("DECEPTIVE STORY", "14 recordings received this model label.", "red", [r for r in parsed if r["result"] == "Deceptive Story"]),
    ("TRUE STORY", "9 recordings received this model label.", "green", [r for r in parsed if r["result"] == "True Story"]),
]
for group_name, group_intro, group_color, group_records in groups:
    story.append(PageBreak())
    story.append(para("AUDIO MODEL GROUP", style_label))
    story.append(para(group_name, style_result_red if group_color == "red" else style_result_green))
    story.append(para(group_intro, style_deck))
    story.append(para("Recordings within this group remain in date order. The label is a model output, not a finding of fact.", style_body))
    for item in group_records:
        story.append(PageBreak())
        title = f'{item["number"]:02d}  |  {item["date"]}'
        story.append(para(title, style_sec))
        story.append(para("Conversation: " + item["conversation"], style_meta))
        story.append(para("CONVERSATION CONTEXT", style_label))
        story.append(para(item["scene"], style_body))
        shortened, abridged = select_key_excerpts(item["transcript"], item["number"])
        story.append(para("SELECTED TRANSCRIPT EXCERPTS" if abridged else "EDITED TRANSCRIPT", style_label))
        for transcript_paragraph in shortened:
            story.append(para(transcript_paragraph, style_quote))
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", color=LINE, thickness=0.8, spaceBefore=3, spaceAfter=7))
        story.append(para("MODEL CONCLUSION", style_label))
        if item["result"] == "Deceptive Story":
            story.append(para("DECEPTIVE STORY", style_result_red))
        else:
            story.append(para("TRUE STORY", style_result_green))

DEST.parent.mkdir(parents=True, exist_ok=True)
doc.build(story)
print(f"PDF={DEST} entries={len(parsed)} size={DEST.stat().st_size}")
