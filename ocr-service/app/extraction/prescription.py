"""Deterministic prescription / medication-list extraction.

One `ExtractedField` per drug line: name = drug, value = dose/strength, and dose/frequency/route/
duration in `attributes`. Regex only — recognizes common Indian Rx conventions (Tab/Cap forms,
OD/BD/TDS/HS/SOS, 1-0-1 dosing, "x 5 days"). No LLM; the Next LLM remains the richer path.
"""

from __future__ import annotations

import re

from ..ocr.base import OcrPage
from ..schemas.document import ExtractedField, Provenance

_FORM = re.compile(
    r"^(?:tab\.?|cap\.?|syp\.?|inj\.?|susp\.?|oint\.?|tablet|capsule|syrup|injection|drops?"
    r"|powder|pwd\.?|sachet|t\.|c\.)\s+",
    re.IGNORECASE,
)
# Dosage forms that trail the name instead of leading it ("Electral powder", "ORS sachet").
_FORM_SUFFIX = re.compile(r"\b(?:powder|pwd|sachet)\s*$", re.IGNORECASE)
_STRENGTH = re.compile(r"\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|%|units?)\b", re.IGNORECASE)
_ROUTE = re.compile(
    r"\b(po|oral|orally|iv|im|s/c|sc|subcutaneous|topical|pr|sublingual|sl|inhaled)\b",
    re.IGNORECASE,
)
_DURATION = re.compile(r"(?:x|×|for\s+)?\s*(\d+)\s*(days?|weeks?|months?)\b", re.IGNORECASE)
_FREQ_ABBR = re.compile(r"\b(od|bd|tds|tid|qid|qds|hs|sos|bid|prn)\b", re.IGNORECASE)
_FREQ_WORD = re.compile(
    r"\b(?:once|twice|thrice|three times|four times|two times)\s+(?:a\s+)?(?:day|daily)\b",
    re.IGNORECASE,
)
_FREQ_NUM = re.compile(r"\b[01]-[01]-[01](?:-[01])?\b")


def _first(*matches: re.Match | None) -> re.Match | None:
    found = [m for m in matches if m]
    return min(found, key=lambda m: m.start()) if found else None


def parse_prescription_line(text: str) -> tuple[str, str, dict[str, str]] | None:
    """(name, dose, attributes{frequency,route,duration}) or None if not a medication line."""
    raw = text.strip()
    low = raw.lower()
    form = _FORM.match(raw)
    strength = _STRENGTH.search(low)
    freq = _first(_FREQ_ABBR.search(low), _FREQ_WORD.search(low), _FREQ_NUM.search(low))
    route = _ROUTE.search(low)
    duration = _DURATION.search(low)

    # Must look like a medication *order*: a dosage form, frequency, or route. Strength alone is
    # NOT enough — a lab row ("Haemoglobin 13.5 g/dL") also has a number+unit; requiring
    # form/freq/route keeps lab values out of the prescription parser.
    if not (form or freq or route or _FORM_SUFFIX.search(raw)):
        return None

    name_start = form.end() if form else 0
    cut = _first(strength, freq, route, duration)
    name_end = cut.start() if cut and cut.start() >= name_start else len(raw)
    name = raw[name_start:name_end].strip(" -:,.—")
    if not name or not re.search(r"[A-Za-z]", name):
        return None

    attrs: dict[str, str] = {}
    if freq:
        attrs["frequency"] = freq.group(0)
    if route:
        attrs["route"] = route.group(1)
    if duration:
        attrs["duration"] = f"{duration.group(1)} {duration.group(2)}"
    dose = strength.group(0) if strength else ""
    return name, dose, attrs


def parse_prescription_pages(pages: list[OcrPage]) -> list[ExtractedField]:
    items: list[ExtractedField] = []
    for idx, page in enumerate(pages, start=1):
        for line in page.lines:
            parsed = parse_prescription_line(line.text)
            if parsed is None:
                continue
            name, dose, attrs = parsed
            items.append(
                ExtractedField(
                    name=name,
                    value=dose,
                    attributes=attrs or None,
                    confidence=round(line.confidence, 3),
                    provenance=Provenance(page=idx, bbox=line.bbox),
                )
            )
    return items
