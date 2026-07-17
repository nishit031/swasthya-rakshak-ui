"""Administrative (billing / insurance claim) labeled-field extraction — regex only.

Complements the billing line-item parser: pulls the header-level fields a claim/invoice carries
(claim no., policy no., payer, total amount, date). First match per label wins; provenance points
at the line it was found on.
"""

from __future__ import annotations

import re

from ..ocr.base import OcrPage
from ..schemas.document import ExtractedField, Provenance

_PATTERNS: dict[str, re.Pattern[str]] = {
    "Claim Number": re.compile(r"claim\s*(?:no|number|id)\.?\s*[:#\-]?\s*([A-Za-z0-9\-/]+)", re.I),
    "Policy Number": re.compile(r"policy\s*(?:no|number)\.?\s*[:#\-]?\s*([A-Za-z0-9\-/]+)", re.I),
    "Payer": re.compile(
        r"(?:payer|insurer|insurance\s*(?:company|provider)|tpa)\s*[:#\-]?\s*([A-Za-z0-9 .,&'\-]+)",
        re.I,
    ),
    "Amount": re.compile(
        r"(?:grand\s*total|net\s*amount|total\s*amount\s*payable|amount\s*payable|total|amount\s*billed)"
        r"\s*[:#\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)",
        re.I,
    ),
    "Date": re.compile(
        r"(?:invoice\s*date|bill\s*date|service\s*date|date\s*of\s*service|date)\s*[:#\-]?\s*"
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        re.I,
    ),
}


def parse_admin_fields(pages: list[OcrPage]) -> list[ExtractedField]:
    items: list[ExtractedField] = []
    seen: set[str] = set()
    for idx, page in enumerate(pages, start=1):
        for line in page.lines:
            for label, pat in _PATTERNS.items():
                if label in seen:
                    continue
                m = pat.search(line.text)
                if not m:
                    continue
                value = m.group(1).strip(" .,-")
                if label == "Amount":
                    value = value.replace(",", "")
                if not value:
                    continue
                seen.add(label)
                items.append(
                    ExtractedField(
                        name=label,
                        value=value,
                        confidence=round(line.confidence, 3),
                        provenance=Provenance(page=idx, bbox=line.bbox),
                    )
                )
    return items
