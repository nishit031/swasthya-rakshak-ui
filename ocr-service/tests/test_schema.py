"""The unified schema is the contract with the backend — it must validate and round-trip."""

from app.schemas.document import ExtractedField, OcrDocument, Provenance

_EXAMPLE = {
    "schema_version": "1.0",
    "request_id": "req_1",
    "job_id": "job_1",
    "source": {"filename": "cbc.pdf", "mime_type": "application/pdf", "size_bytes": 100,
               "page_count": 1, "sha256": "abc"},
    "processing": {"received_at": "2026-07-13T10:00:00Z", "completed_at": "2026-07-13T10:00:03Z",
                   "duration_ms": 3000, "engine": "paddleocr", "engine_version": "2.7.3",
                   "pipeline": ["validate", "ocr", "extract", "normalize"]},
    "classification": {"structure_tier": "structured", "doc_group_hint": "clinical",
                       "is_medical_image": False, "confidence": 0.9},
    "routing": {"decision": "paddleocr", "reason": "printed", "escalated": False},
    "document": {"text": "Haemoglobin 13.5", "pages": []},
    "fields": {"kind": "lab", "items": [
        {"name": "Haemoglobin", "value": "13.5", "unit": "g/dL", "reference_range": "13.0-17.0",
         "flag": "normal", "confidence": 0.95, "provenance": {"page": 1, "bbox": [1, 2, 3, 4]}}]},
    "confidence": {"ocr_mean": 0.94, "ocr_min": 0.81},
    "warnings": [],
}


def test_ocrdocument_validates_and_roundtrips():
    doc = OcrDocument.model_validate(_EXAMPLE)
    dumped = doc.model_dump(mode="json")
    assert dumped["schema_version"] == "1.0"
    assert dumped["fields"]["items"][0]["provenance"]["page"] == 1
    assert dumped["routing"]["decision"] == "paddleocr"


def test_defaults_fill_in():
    minimal = dict(_EXAMPLE)
    del minimal["schema_version"]
    minimal["warnings"] = []
    doc = OcrDocument.model_validate(minimal)
    assert doc.schema_version == "1.0"


def test_extracted_field_attributes_and_low_confidence():
    f = ExtractedField(
        name="Paracetamol",
        value="500 mg",
        attributes={"frequency": "bd", "duration": "5 days"},
        low_confidence=True,
        confidence=0.4,
        provenance=Provenance(page=1, bbox=[0, 0, 1, 1]),
    )
    d = f.model_dump(mode="json")
    assert d["attributes"]["frequency"] == "bd"
    assert d["low_confidence"] is True
    # backward-compatible: a plain lab field omits attributes
    plain = ExtractedField(name="Hb", value="13.5", confidence=0.95,
                           provenance=Provenance(page=1, bbox=[0, 0, 1, 1]))
    assert plain.attributes is None and plain.low_confidence is False
