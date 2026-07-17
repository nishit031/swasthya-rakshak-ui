"""Prescription parsing: drug + dose + frequency/route/duration, no LLM."""

from app.extraction.prescription import parse_prescription_line, parse_prescription_pages
from app.ocr.base import OcrLine, OcrPage


def test_parse_line_abbrev_frequency_and_duration():
    name, dose, attrs = parse_prescription_line("Tab Paracetamol 500 mg BD x 5 days")
    assert name == "Paracetamol"
    assert dose == "500 mg"
    assert attrs["frequency"] == "bd"
    assert attrs["duration"] == "5 days"


def test_parse_line_word_frequency_and_route():
    name, dose, attrs = parse_prescription_line("Cap Amoxicillin 250 mg PO thrice daily for 5 days")
    assert name == "Amoxicillin"
    assert dose == "250 mg"
    assert attrs["frequency"] == "thrice daily"
    assert attrs["route"] == "po"
    assert attrs["duration"] == "5 days"


def test_non_medication_lines_rejected():
    assert parse_prescription_line("Advise: rest and plenty of fluids") is None
    assert parse_prescription_line("Dr. A. Sharma, MBBS MD") is None


def test_powder_and_sachet_forms():
    # Leading form ("Powder ORS") and trailing form ("Electral powder") both count as orders.
    name, dose, attrs = parse_prescription_line("Powder ORS 1-0-1")
    assert name == "ORS"
    assert attrs["frequency"] == "1-0-1"
    name, dose, attrs = parse_prescription_line("Electral powder SOS")
    assert name == "Electral powder"
    assert attrs["frequency"] == "sos"
    name, dose, attrs = parse_prescription_line("Electral powder")
    assert name == "Electral powder"
    assert dose == ""


def test_pages_emit_provenance_and_attributes():
    page = OcrPage(width=1, height=1, lines=[
        OcrLine(text="Tab Paracetamol 500 mg BD x 5 days", bbox=[0, 0, 9, 1], confidence=0.92),
        OcrLine(text="Cap Amoxicillin 250 mg thrice daily, 5 days",
                bbox=[0, 2, 9, 3], confidence=0.8),
    ])
    items = parse_prescription_pages([page])
    assert [it.name for it in items] == ["Paracetamol", "Amoxicillin"]
    assert items[0].provenance.page == 1
    assert items[0].attributes["frequency"] == "bd"
