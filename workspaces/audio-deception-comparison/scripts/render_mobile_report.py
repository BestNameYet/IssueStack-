#!/usr/bin/env python3
"""Render the reviewed 23-recording Markdown as a phone-first PDF."""
from __future__ import annotations

import html
import re
import sys
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

    parsed.append({
        "number": number,
        "date": title_match.group(2).strip(),
        "conversation": person_match.group(1).strip(),
        "scene": scene_match.group(1).strip(),
        "transcript": speech_paras,
        "result": conclusion_match.group(1).strip(),
    })

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
story.append(para("About the transcripts", style_label))
story.append(para("Spelling and punctuation have been edited for reading. Words marked [unclear] could not be confirmed. The original model classifications are retained, but a classification does not establish whether a statement was true or false.", style_body))
story.append(Spacer(1, 14))
story.append(para("23 RECORDINGS", style_sec))
story.append(para("14 model labels: Deceptive Story", style_result_red))
story.append(para("9 model labels: True Story", style_result_green))
story.append(PageBreak())

for i, item in enumerate(parsed):
    if i:
        story.append(PageBreak())
    title = f'{item["number"]:02d}  |  {item["date"]}'
    story.append(para(title, style_sec))
    story.append(para("Conversation: " + item["conversation"], style_meta))
    story.append(para("CONVERSATION CONTEXT", style_label))
    story.append(para(item["scene"], style_body))
    story.append(para("EDITED TRANSCRIPT", style_label))
    for transcript_paragraph in item["transcript"]:
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
