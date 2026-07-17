"""End-to-end orchestration via the text path — exercises ingest -> classify -> route -> extract
-> normalize without needing the Paddle/PDF stack installed (the OCR path is covered by manual
docker verification and by the engine/parsing unit tests)."""

from app.config import Settings
from app.ocr.registry import build_engine_pool
from app.services.pipeline import process_document


def test_text_pipeline_extracts_lab_fields(tmp_path):
    settings = Settings(tmp_root=str(tmp_path))
    pool = build_engine_pool(settings)
    text = (
        "Haemoglobin 13.5 g/dL 13.0-17.0\n"
        "WBC 7500 /cumm 4000-11000\n"
        "Platelets 250000 /cumm\n"
    )
    doc = process_document(
        file_bytes=text.encode(),
        filename="cbc.txt",
        mime_type="text/plain",
        request_id="req_test",
        job_id="job_test",
        doc_type_hint=None,
        engine_pool=pool,
        settings=settings,
    )
    assert doc.document.text
    assert doc.fields.kind == "lab"
    assert len(doc.fields.items) >= 2
    assert doc.source.sha256
    assert doc.request_id == "req_test"
