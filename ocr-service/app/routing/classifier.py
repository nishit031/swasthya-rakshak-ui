"""Cheap, dependency-free document classification.

Two outputs drive routing:
  - structure_tier: how machine-readable the layout is (structured/semi/unstructured).
  - doc_group_hint: a coarse medical group, by keyword. This is a *hint* for extraction and for
    detecting X-ray films — the fine-grained 21-type classification stays with the Next LLM.

No layout model in the MVP: structure comes from OCR line statistics (line count, confidence,
how many lines look tabular/numeric). ponytail: swap in PaddleOCR PP-Structure if accuracy demands.
"""

from __future__ import annotations

import re

from ..ocr.base import OcrLine
from ..schemas.document import Classification, DocGroup, StructureTier

# Keyword -> group. Counts hits per group; highest wins, none -> other.
_GROUP_KEYWORDS: dict[DocGroup, list[str]] = {
    DocGroup.medication: [
        # NB: no bare "mg" — it appears in lab units ("mg/dL") and would misroute lab reports.
        "prescription", "rx", "tablet", "tab.", "capsule", "cap.", "dosage", "medication",
        "sig", "twice daily", "once daily", "thrice daily",
    ],
    DocGroup.imaging: [
        "x-ray", "xray", "radiograph", "mri", "ct scan", "ultrasound", "sonography",
        "impression", "findings", "contrast", "scan",
    ],
    DocGroup.administrative: [
        # no bare "total" — it appears in lab test names ("Total WBC Count").
        "invoice", "bill", "amount", "payable", "gst", "claim", "insurance",
        "policy", "receipt", "balance due",
    ],
    DocGroup.procedure: [
        "procedure", "surgery", "operative", "operation", "anesthesia", "post-op", "incision",
    ],
    DocGroup.clinical: [
        "diagnosis", "discharge", "consultation", "history", "examination", "complaints",
        "advice", "follow up", "vitals", "referral",
    ],
}

# Filename / caller-hint tokens that mark an imaging study (used to spot an X-ray *film* photo
# even when it carries almost no OCR text).
_IMAGING_NAME_TOKENS = ["xray", "x-ray", "ct", "mri", "ultrasound", "sono", "radiograph", "scan"]

_NUMERIC = re.compile(r"\d")


def _group_hint(text: str, filename: str, doc_type_hint: str | None) -> tuple[DocGroup, int]:
    hay = f"{text}\n{filename}\n{doc_type_hint or ''}".lower()
    best, best_hits = DocGroup.other, 0
    for group, words in _GROUP_KEYWORDS.items():
        hits = sum(hay.count(w) for w in words)
        if hits > best_hits:
            best, best_hits = group, hits
    return best, best_hits


def _looks_imaging_by_name(filename: str, doc_type_hint: str | None) -> bool:
    hay = f"{filename}\n{doc_type_hint or ''}".lower()
    return any(tok in hay for tok in _IMAGING_NAME_TOKENS)


def _structure_from_lines(lines: list[OcrLine]) -> tuple[StructureTier, float]:
    n = len(lines)
    if n == 0:
        return StructureTier.unstructured, 0.5
    mean_conf = sum(line.confidence for line in lines) / n
    tabular = sum(1 for line in lines if _NUMERIC.search(line.text)) / n
    if tabular >= 0.4 and n >= 5:
        return StructureTier.structured, min(0.95, 0.6 + tabular / 2)
    if mean_conf < 0.6 or n < 4:
        return StructureTier.unstructured, 0.6
    return StructureTier.semi_structured, 0.6


def classify(
    *,
    text: str,
    lines: list[OcrLine],
    mime_type: str,
    has_pdf_text: bool,
    filename: str = "",
    doc_type_hint: str | None = None,
) -> Classification:
    group, _ = _group_hint(text, filename, doc_type_hint)

    if has_pdf_text:
        tier, tier_conf = StructureTier.structured, 0.9
    else:
        tier, tier_conf = _structure_from_lines(lines)

    # An X-ray/CT/MRI *film* is an image with imaging-ish naming but essentially no readable text.
    sparse_text = len(text.strip()) < 25 or len(lines) < 3
    is_medical_image = (
        mime_type.startswith("image/")
        and not has_pdf_text
        and sparse_text
        and (group == DocGroup.imaging or _looks_imaging_by_name(filename, doc_type_hint))
    )
    if is_medical_image:
        group = DocGroup.imaging

    return Classification(
        structure_tier=tier,
        doc_group_hint=group,
        is_medical_image=is_medical_image,
        confidence=round(tier_conf, 2),
    )
