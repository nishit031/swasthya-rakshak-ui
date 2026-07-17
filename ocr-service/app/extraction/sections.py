"""Shared, deterministic section splitter for narrative medical documents.

Clinical / procedure / imaging reports are free text organized under headers ("Assessment:",
"Findings:", "Impression:"). This scans OCR lines in reading order, starts a new section each time
a line *is* a known header (optionally with inline text after a colon), and accumulates the
following lines under that section's canonical label. Repeated labels are merged; provenance points
at the header's first occurrence. No LLM — just header matching. ponytail: line-based, no column/
layout modelling; good enough for the printed reports this MVP targets.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from ..ocr.base import OcrPage

# Header map = canonical label -> synonyms (lowercase). Order defines output order for new labels.
HeaderMap = dict[str, list[str]]


@dataclass
class Section:
    label: str
    text: str
    page: int
    bbox: list[float]
    confidence: float


@dataclass
class _Acc:
    page: int
    bbox: list[float]
    texts: list[str] = field(default_factory=list)
    confs: list[float] = field(default_factory=list)


def _match_header(line: str, header_map: HeaderMap) -> tuple[str, str] | None:
    """If the line is a header, return (canonical_label, inline_text_after_colon)."""
    low = line.strip().lower()
    for label, synonyms in header_map.items():
        for syn in synonyms:
            if low == syn:
                return label, ""
            # "Header: rest of line" — require the colon so mid-sentence words don't match.
            m = re.match(rf"{re.escape(syn)}\s*[:\-]\s*(.*)$", low)
            if m:
                # recover the inline text from the ORIGINAL line (preserve case)
                inline = line.strip()[m.start(1):] if m.group(1) else ""
                return label, inline.strip()
    return None


def split_sections(pages: list[OcrPage], header_map: HeaderMap) -> list[Section]:
    order: list[str] = []
    acc: dict[str, _Acc] = {}
    current: str | None = None

    for idx, page in enumerate(pages, start=1):
        for line in page.lines:
            matched = _match_header(line.text, header_map)
            if matched:
                label, inline = matched
                current = label
                if label not in acc:
                    acc[label] = _Acc(page=idx, bbox=line.bbox)
                    order.append(label)
                if inline:
                    acc[label].texts.append(inline)
                    acc[label].confs.append(line.confidence)
                continue
            if current is not None and line.text.strip():
                acc[current].texts.append(line.text.strip())
                acc[current].confs.append(line.confidence)

    sections: list[Section] = []
    for label in order:
        a = acc[label]
        text = "\n".join(a.texts).strip()
        if not text:
            continue  # a header with no content isn't worth emitting
        conf = sum(a.confs) / len(a.confs) if a.confs else 1.0
        sections.append(Section(label=label, text=text, page=a.page, bbox=a.bbox,
                                 confidence=round(conf, 3)))
    return sections
