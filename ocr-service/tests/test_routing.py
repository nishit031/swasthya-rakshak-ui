"""Routing + classification are the load-bearing 'send it to the right engine' logic."""

from app.config import Settings
from app.ocr.base import OcrLine
from app.routing.classifier import classify
from app.routing.router import route
from app.schemas.document import Classification, DocGroup, RouteDecision, StructureTier

CPU = Settings(gpu_enabled=False, vlm_enabled=False, escalation_confidence_threshold=0.6)
GPU = Settings(gpu_enabled=True, vlm_enabled=False, escalation_confidence_threshold=0.6)


def _cls(tier=StructureTier.structured, group=DocGroup.clinical, medical_image=False):
    return Classification(structure_tier=tier, doc_group_hint=group,
                          is_medical_image=medical_image, confidence=0.9)


def test_medical_image_leaves_ocr_path():
    r = route(classification=_cls(medical_image=True), has_pdf_text=False,
              ocr_mean_confidence=0.0, settings=CPU)
    assert r.decision == RouteDecision.image_analysis
    assert r.escalated is False


def test_pdf_text_layer_routes_direct():
    r = route(classification=_cls(), has_pdf_text=True, ocr_mean_confidence=1.0, settings=CPU)
    assert r.decision == RouteDecision.pdf_text


def test_structured_high_confidence_uses_paddle_no_escalation():
    r = route(classification=_cls(StructureTier.structured), has_pdf_text=False,
              ocr_mean_confidence=0.95, settings=CPU)
    assert r.decision == RouteDecision.paddleocr
    assert r.escalated is False


def test_unstructured_flags_escalation_but_stays_paddle_on_cpu():
    r = route(classification=_cls(StructureTier.unstructured), has_pdf_text=False,
              ocr_mean_confidence=0.95, settings=CPU)
    assert r.decision == RouteDecision.paddleocr
    assert r.escalated is True


def test_low_confidence_flags_escalation():
    r = route(classification=_cls(StructureTier.structured), has_pdf_text=False,
              ocr_mean_confidence=0.4, settings=CPU)
    assert r.escalated is True


def test_escalation_routes_to_vlm_when_gpu_enabled():
    r = route(classification=_cls(StructureTier.unstructured), has_pdf_text=False,
              ocr_mean_confidence=0.95, settings=GPU)
    assert r.decision == RouteDecision.gpu_vlm
    assert r.escalated is True


def test_escalation_routes_to_vlm_when_cpu_vlm_enabled():
    # No GPU required: OCR_VLM_ENABLED alone sends escalated work to the (Ollama) VLM.
    vlm = Settings(gpu_enabled=False, vlm_enabled=True, escalation_confidence_threshold=0.6)
    r = route(classification=_cls(StructureTier.unstructured), has_pdf_text=False,
              ocr_mean_confidence=0.95, settings=vlm)
    assert r.decision == RouteDecision.gpu_vlm
    assert r.escalated is True


# --- classifier ---

def _lines(texts, conf=0.95):
    return [OcrLine(text=t, bbox=[0, 0, 10, 10], confidence=conf) for t in texts]


def test_classifier_tabular_report_is_structured():
    lines = _lines([
        "Haemoglobin 13.5 g/dL 13.0-17.0",
        "WBC 7500 /cumm 4000-11000",
        "Platelets 250000 /cumm",
        "RBC 5.2 mill/cumm 4.5-5.5",
        "Glucose 95 mg/dL 70-110",
    ])
    c = classify(text="\n".join(li.text for li in lines), lines=lines,
                 mime_type="image/png", has_pdf_text=False, filename="cbc.png")
    assert c.structure_tier == StructureTier.structured


def test_classifier_prescription_group_hint():
    text = "Rx\nTab Paracetamol 500 mg twice daily\nCap Amoxicillin 250mg"
    lines = _lines(text.splitlines())
    c = classify(
        text=text, lines=lines, mime_type="image/png", has_pdf_text=False, filename="rx.png"
    )
    assert c.doc_group_hint == DocGroup.medication


def test_classifier_detects_xray_film():
    # An X-ray photo: image mime, imaging filename, almost no readable text.
    c = classify(text="", lines=[], mime_type="image/jpeg", has_pdf_text=False,
                 filename="chest_xray.jpg")
    assert c.is_medical_image is True
    assert c.doc_group_hint == DocGroup.imaging
