"""Map a classification to a routing decision.

CPU MVP resolves to exactly three real destinations — pdf_text (direct text extraction),
image_analysis (X-ray film stub), paddleocr (everything else) — plus an `escalated` flag for
work a GPU VLM should take over later. When gpu_enabled, escalated work routes to gpu_vlm
instead of paddleocr; the JSON schema and API are identical either way, so the backend never
changes across the upgrade.
"""

from __future__ import annotations

from ..config import Settings
from ..schemas.document import Classification, RouteDecision, Routing, StructureTier


def route(
    *,
    classification: Classification,
    has_pdf_text: bool,
    ocr_mean_confidence: float,
    settings: Settings,
) -> Routing:
    if classification.is_medical_image:
        return Routing(
            decision=RouteDecision.image_analysis,
            reason="X-ray/CT/MRI film — pixels, not text; sent to image analysis (no OCR).",
            escalated=False,
        )

    if has_pdf_text:
        return Routing(
            decision=RouteDecision.pdf_text,
            reason="PDF has an embedded text layer — extracted directly, no OCR needed.",
            escalated=False,
        )

    escalate = (
        classification.structure_tier == StructureTier.unstructured
        or ocr_mean_confidence < settings.escalation_confidence_threshold
    )

    if escalate and (settings.gpu_enabled or settings.vlm_enabled):
        return Routing(
            decision=RouteDecision.gpu_vlm,
            reason="Unstructured / low-confidence page escalated to the vision-language model.",
            escalated=True,
        )

    reason = (
        f"Printed/{classification.structure_tier.value} document — PaddleOCR (CPU)."
        if not escalate
        else "Unstructured / low-confidence — flagged for GPU escalation (VLM disabled in MVP)."
    )
    return Routing(decision=RouteDecision.paddleocr, reason=reason, escalated=escalate)
