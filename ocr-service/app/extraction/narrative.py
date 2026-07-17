"""Clinical / procedure / imaging report extraction — section headers only, no LLM.

Each is a thin wrapper over `split_sections` with its own header map; a detected section becomes an
`ExtractedField` (name = canonical label, value = section text). These are a deterministic baseline;
the Next app's LLM does the deeper, normalized extraction behind the redaction gateway.
"""

from __future__ import annotations

from ..ocr.base import OcrPage
from ..schemas.document import ExtractedField, Provenance
from .sections import HeaderMap, Section, split_sections

CLINICAL_HEADERS: HeaderMap = {
    "Chief Complaint": [
        "chief complaint", "chief complaints", "presenting complaint", "c/o", "complaints",
    ],
    "Symptoms": ["symptoms", "symptom"],
    "History": [
        "history of present illness", "hpi", "past medical history", "past history", "history",
    ],
    "Examination": [
        "on examination", "physical examination", "general examination", "examination", "o/e",
        "vital signs", "vitals",
    ],
    "Assessment": [
        "assessment", "impression", "provisional diagnosis", "final diagnosis", "diagnosis",
    ],
    "Plan": ["treatment plan", "management", "plan", "advice", "treatment", "medications", "rx"],
    "Follow-up": ["follow up", "follow-up", "followup", "review", "next visit", "revisit"],
}

PROCEDURE_HEADERS: HeaderMap = {
    "Procedure": ["name of procedure", "operative procedure", "procedure", "operation", "surgery"],
    "Indication": ["indications", "indication", "reason"],
    "Findings": ["intraoperative findings", "operative findings", "findings"],
    "Technique": ["procedure details", "technique", "description", "steps"],
    "Complications": ["complications", "complication"],
    "Specimens": ["specimens", "specimen"],
    "Recommendations": [
        "post-op instructions", "postoperative", "post operative", "recommendations",
        "recommendation", "follow up", "follow-up", "advice",
    ],
}

IMAGING_HEADERS: HeaderMap = {
    "Technique": ["technique", "protocol"],
    "Comparison": ["comparison"],
    "Findings": ["observations", "observation", "findings"],
    "Impression": ["impression", "conclusion", "opinion"],
    "Recommendation": ["recommendations", "recommendation", "advice", "suggestion"],
}


def _to_fields(sections: list[Section]) -> list[ExtractedField]:
    return [
        ExtractedField(
            name=s.label,
            value=s.text,
            confidence=s.confidence,
            provenance=Provenance(page=s.page, bbox=s.bbox),
        )
        for s in sections
    ]


def extract_clinical(pages: list[OcrPage]) -> list[ExtractedField]:
    return _to_fields(split_sections(pages, CLINICAL_HEADERS))


def extract_procedure(pages: list[OcrPage]) -> list[ExtractedField]:
    return _to_fields(split_sections(pages, PROCEDURE_HEADERS))


def extract_imaging(pages: list[OcrPage]) -> list[ExtractedField]:
    return _to_fields(split_sections(pages, IMAGING_HEADERS))
