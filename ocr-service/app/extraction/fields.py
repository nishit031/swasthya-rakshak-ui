"""Dispatch deterministic extraction. No LLM — the Next redaction gateway owns deep extraction.

Order matters, because a lab row ("Haemoglobin 13.5 g/dL 13.0-17.0") and a drug line share the
"name number unit" shape:
  1. Strong lab signal first: >= 2 rows carrying a reference range is an unambiguous lab report,
     and beats any (keyword-based, fallible) group hint.
  2. Then the classifier's group drives the right parser (prescription / clinical / procedure /
     imaging / billing+admin).
  3. Then content fallbacks (range-less lab, or 2+ medication lines) for when the group hint missed.
Every emitted field is stamped `low_confidence` when its OCR confidence is below the threshold.
"""

from __future__ import annotations

from ..ocr.base import OcrPage
from ..schemas.document import DocGroup, ExtractedField, Fields
from .admin import parse_admin_fields
from .billing import parse_billing_pages
from .lab import parse_lab_pages
from .narrative import extract_clinical, extract_imaging, extract_procedure
from .prescription import parse_prescription_pages


def extract_fields(
    *, group: DocGroup, pages: list[OcrPage], low_conf_threshold: float = 0.6
) -> Fields:
    kind = "none"
    items: list[ExtractedField] = []

    lab_items = parse_lab_pages(pages)
    strong_lab = [it for it in lab_items if it.reference_range]

    if len(strong_lab) >= 2:
        kind, items = "lab", lab_items
    elif group == DocGroup.medication:
        presc = parse_prescription_pages(pages)
        if presc:
            kind, items = "prescription", presc
    elif group == DocGroup.clinical:
        sections = extract_clinical(pages)
        if sections:
            kind, items = "clinical", sections
    elif group == DocGroup.procedure:
        sections = extract_procedure(pages)
        if sections:
            kind, items = "procedure", sections
    elif group == DocGroup.imaging:
        sections = extract_imaging(pages)
        if sections:
            kind, items = "imaging", sections
    elif group == DocGroup.administrative:
        billing = parse_billing_pages(pages) + parse_admin_fields(pages)
        if billing:
            kind, items = "billing", billing

    if not items:  # the group pass found nothing — fall back to content signals
        if len(lab_items) >= 2:
            kind, items = "lab", lab_items
        else:
            presc = parse_prescription_pages(pages)
            if len(presc) >= 2:
                kind, items = "prescription", presc

    for item in items:
        item.low_confidence = item.confidence < low_conf_threshold

    return Fields(kind=kind, items=items)
