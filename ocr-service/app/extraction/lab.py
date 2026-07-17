"""Deterministic lab-value extraction: pull `name value unit (ref range)` rows out of structured
lab reports with regex. No LLM — this is the exact, verifiable path for printed tabular results.
Deep/unstructured extraction (impressions, narrative) is left to the Next LLM."""

from __future__ import annotations

import re

from ..ocr.base import OcrPage
from ..schemas.document import ExtractedField, Provenance

# A reference interval like "13.0-17.0", "(4000 - 11000)", "70 to 110".
_REF = re.compile(r"\(?\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*\)?")
# A measured value (optionally < or >), e.g. 13.5, <0.01, 7500.
_VALUE = re.compile(r"[<>]?\d+(?:\.\d+)?")
# A unit token right after the value: g/dL, mg/dL, /cumm, %, IU/L (a leading slash is common).
_UNIT = re.compile(r"[A-Za-zµ%/]+")

# Line-label words that mean "this is metadata, not a lab result" — kills date/patient/bill lines
# that would otherwise look like `name number`. ponytail: heuristic stoplist, extend as needed.
# Line-label words that mean "not a lab result". Billing terms (total/amount/bill) are NOT here:
# they carry no unit and no reference range, so the unit-or-ref requirement below already rejects
# them — and keeping "total" out lets legit tests like "Total WBC Count ... 4000-11000" through.
_STOP = (
    "date", "name", "address", "phone", "patient", "doctor", "dr.", "ref by", "reg", "age",
    "sex", "uhid", "page", "sample", "received",
)

# A medication order ("Tab Paracetamol 500 mg") has the shape of a lab row (name + number + unit).
# Skip lines that start with a dosage form so a prescription can't be misread as lab values.
_MED_PREFIX = re.compile(
    r"^(?:tab|cap|syp|inj|susp|tablet|capsule|syrup|injection)\b", re.IGNORECASE
)


def _flag(value: str, ref: str | None) -> str | None:
    if not ref:
        return None
    try:
        v = float(value.lstrip("<>"))
        lo, hi = (float(x) for x in ref.split("-"))
    except ValueError:
        return None
    if v < lo:
        return "low"
    if v > hi:
        return "high"
    return "normal"


def parse_lab_line(text: str) -> tuple[str, str, str | None, str | None] | None:
    """(name, value, unit, reference_range) or None if the line is not a lab row."""
    ref = None
    remainder = text
    m = _REF.search(text)
    if m:
        ref = f"{m.group(1)}-{m.group(2)}"
        remainder = text[: m.start()] + "  " + text[m.end() :]

    if _MED_PREFIX.match(text.strip()):
        return None

    vm = _VALUE.search(remainder)
    if not vm:
        return None
    value = vm.group(0)
    name = remainder[: vm.start()].strip(" :\t-|")
    after = remainder[vm.end() :].strip()

    unit = None
    um = _UNIT.match(after)
    if um:
        unit = um.group(0)

    # Accept only rows that carry a unit or a reference range — a bare "word number" is too weak.
    if unit is None and ref is None:
        return None
    if len(name) < 2 or not re.search(r"[A-Za-z]", name):
        return None
    if any(stop in name.lower() for stop in _STOP):
        return None
    return name, value, unit, ref


def parse_lab_pages(pages: list[OcrPage]) -> list[ExtractedField]:
    items: list[ExtractedField] = []
    for idx, page in enumerate(pages, start=1):
        for line in page.lines:
            parsed = parse_lab_line(line.text)
            if parsed is None:
                continue
            name, value, unit, ref = parsed
            items.append(
                ExtractedField(
                    name=name,
                    value=value,
                    unit=unit,
                    reference_range=ref,
                    flag=_flag(value, ref),
                    confidence=round(line.confidence, 3),
                    provenance=Provenance(page=idx, bbox=line.bbox),
                )
            )
    return items
