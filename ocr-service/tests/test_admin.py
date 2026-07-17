"""Administrative / insurance-claim labeled-field extraction."""

from app.extraction.admin import parse_admin_fields
from app.ocr.base import OcrLine, OcrPage


def test_admin_fields():
    page = OcrPage(width=1, height=1, lines=[
        OcrLine(text="Claim Number: CLM-2024-88213", bbox=[0, 0, 9, 1], confidence=0.9),
        OcrLine(text="Policy Number: POL/99/77123", bbox=[0, 1, 9, 2], confidence=0.9),
        OcrLine(text="Insurer: Star Health and Allied Insurance",
                bbox=[0, 2, 9, 3], confidence=0.9),
        OcrLine(text="Total Amount Payable 3890.50", bbox=[0, 3, 9, 4], confidence=0.9),
        OcrLine(text="Date: 12/05/2024", bbox=[0, 4, 9, 5], confidence=0.9),
    ])
    fields = {f.name: f.value for f in parse_admin_fields([page])}
    assert fields["Claim Number"] == "CLM-2024-88213"
    assert fields["Policy Number"] == "POL/99/77123"
    assert fields["Amount"] == "3890.50"
    assert fields["Date"] == "12/05/2024"
    assert "Star Health" in fields["Payer"]
