"""Section-header extraction for clinical / procedure / imaging narratives."""

from app.extraction.narrative import extract_clinical, extract_imaging, extract_procedure
from app.ocr.base import OcrLine, OcrPage


def _page(lines: list[str]) -> OcrPage:
    return OcrPage(
        width=1,
        height=1,
        lines=[OcrLine(text=t, bbox=[0, i, 9, i + 1], confidence=0.9) for i, t in enumerate(lines)],
    )


def test_clinical_sections():
    page = _page([
        "Chief Complaint: Fever for 3 days",
        "Assessment: Acute bronchitis",
        "Plan: Azithromycin 500 mg once daily",
        "Follow-up: Review after 5 days",
    ])
    fields = {f.name: f.value for f in extract_clinical([page])}
    assert "bronchitis" in fields["Assessment"].lower()
    assert "Plan" in fields and "Follow-up" in fields


def test_imaging_sections():
    page = _page([
        "Findings: Lungs clear. No consolidation.",
        "Impression: Normal chest radiograph",
    ])
    fields = extract_imaging([page])
    assert {f.name for f in fields} == {"Findings", "Impression"}
    assert fields[0].provenance.page == 1


def test_procedure_sections():
    page = _page([
        "Procedure: Laparoscopic Appendectomy",
        "Findings: Inflamed appendix",
        "Complications: None",
    ])
    labels = {f.name for f in extract_procedure([page])}
    assert {"Procedure", "Findings", "Complications"} <= labels


def test_multiline_section_accumulates():
    page = _page([
        "Findings: Lungs clear.",
        "No focal consolidation.",
        "Impression: Normal study",
    ])
    fields = {f.name: f.value for f in extract_imaging([page])}
    assert "consolidation" in fields["Findings"].lower()  # the non-header line joined in
