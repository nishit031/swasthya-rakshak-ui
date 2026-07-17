"""Deterministic billing / insurance line-item extraction: `description ... amount`. Regex only."""

from __future__ import annotations

import re

from ..ocr.base import OcrPage
from ..schemas.document import ExtractedField, Provenance

# Trailing money amount: optional ₹/Rs/INR, then 500 / 1,200.50 / 500.00 at end of line.
_AMOUNT = re.compile(
    r"(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*$",
    re.IGNORECASE,
)


def parse_billing_line(text: str) -> tuple[str, str] | None:
    """(description, amount) or None. Amount keeps its digits/decimals, commas stripped."""
    m = _AMOUNT.search(text)
    if not m:
        return None
    desc = text[: m.start()].strip(" :\t-|.")
    if len(desc) < 2 or not re.search(r"[A-Za-z]", desc):
        return None
    amount = m.group(1).replace(",", "")
    return desc, amount


def parse_billing_pages(pages: list[OcrPage]) -> list[ExtractedField]:
    items: list[ExtractedField] = []
    for idx, page in enumerate(pages, start=1):
        for line in page.lines:
            parsed = parse_billing_line(line.text)
            if parsed is None:
                continue
            desc, amount = parsed
            items.append(
                ExtractedField(
                    name=desc,
                    value=amount,
                    unit="INR",
                    confidence=round(line.confidence, 3),
                    provenance=Provenance(page=idx, bbox=line.bbox),
                )
            )
    return items
