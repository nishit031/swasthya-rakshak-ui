"""Deterministic extraction: the money/medical path — parse it exactly, or return nothing."""

from app.extraction.billing import parse_billing_line
from app.extraction.fields import extract_fields
from app.extraction.lab import parse_lab_line, parse_lab_pages
from app.ocr.base import OcrLine, OcrPage
from app.schemas.document import DocGroup


def test_parse_lab_line_full_row():
    assert parse_lab_line("Haemoglobin 13.5 g/dL (13.0-17.0)") == (
        "Haemoglobin", "13.5", "g/dL", "13.0-17.0")


def test_parse_lab_line_flags_high_and_low():
    page = OcrPage(width=1000, height=1000, lines=[
        OcrLine(text="Haemoglobin 18.0 g/dL 13.0-17.0", bbox=[0, 0, 1, 1], confidence=0.9),
        OcrLine(text="WBC 3000 /cumm 4000-11000", bbox=[0, 2, 1, 3], confidence=0.9),
        OcrLine(text="Glucose 95 mg/dL 70-110", bbox=[0, 4, 1, 5], confidence=0.9),
    ])
    items = parse_lab_pages([page])
    flags = {it.name: it.flag for it in items}
    assert flags["Haemoglobin"] == "high"
    assert flags["WBC"] == "low"
    assert flags["Glucose"] == "normal"
    # provenance + confidence ride along on every field
    assert all(it.confidence == 0.9 and it.provenance.page == 1 for it in items)


def test_lab_line_rejects_date_metadata():
    # "Report Date 12-05-2024" must NOT be mistaken for a lab result.
    assert parse_lab_line("Report Date 12-05-2024") is None
    assert parse_lab_line("Patient Name John Doe") is None


def test_parse_billing_line():
    assert parse_billing_line("Consultation Fee 500.00") == ("Consultation Fee", "500.00")
    assert parse_billing_line("Room Charges Rs 1,200.50") == ("Room Charges", "1200.50")
    assert parse_billing_line("Thank you for visiting") is None


def test_extract_fields_dispatch():
    lab_pages = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Haemoglobin 13.5 g/dL 13.0-17.0", bbox=[0, 0, 1, 1], confidence=0.9),
        OcrLine(text="WBC 7500 /cumm 4000-11000", bbox=[0, 2, 1, 3], confidence=0.9),
    ])]
    assert extract_fields(group=DocGroup.other, pages=lab_pages).kind == "lab"

    bill_pages = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Consultation Fee 500.00", bbox=[0, 0, 1, 1], confidence=0.9),
        OcrLine(text="Total Amount 500.00", bbox=[0, 2, 1, 3], confidence=0.9),
    ])]
    assert extract_fields(group=DocGroup.administrative, pages=bill_pages).kind == "billing"

    prose = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Patient advised rest and fluids.", bbox=[0, 0, 1, 1], confidence=0.9),
    ])]
    assert extract_fields(group=DocGroup.clinical, pages=prose).kind == "none"


def test_dispatch_prescription_not_misread_as_lab():
    # "Tab X 500 mg" lines look like lab rows; the medication group must win, and even the lab
    # fallback must skip dosage-form lines.
    pages = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Tab Paracetamol 500 mg BD x 5 days", bbox=[0, 0, 1, 1], confidence=0.9),
        OcrLine(text="Cap Amoxicillin 250 mg thrice daily", bbox=[0, 2, 1, 3], confidence=0.9),
    ])]
    f = extract_fields(group=DocGroup.medication, pages=pages)
    assert f.kind == "prescription"
    assert len(f.items) == 2


def test_dispatch_clinical_sections():
    pages = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Assessment: Acute bronchitis", bbox=[0, 0, 1, 1], confidence=0.9),
        OcrLine(text="Plan: rest and fluids", bbox=[0, 1, 1, 2], confidence=0.9),
    ])]
    assert extract_fields(group=DocGroup.clinical, pages=pages).kind == "clinical"


def test_low_confidence_flag_stamped():
    pages = [OcrPage(width=1, height=1, lines=[
        OcrLine(text="Impression: normal", bbox=[0, 0, 1, 1], confidence=0.4),
    ])]
    f = extract_fields(group=DocGroup.imaging, pages=pages, low_conf_threshold=0.6)
    assert f.items[0].low_confidence is True
