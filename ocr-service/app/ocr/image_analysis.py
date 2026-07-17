"""Medical-image (X-ray/CT/MRI film) branch.

An X-ray *image* is pixels, not text — OCR'ing it is meaningless. In the CPU MVP this is a
documented stub: it returns "not analyzed" plus a note, and the pipeline emits an OcrDocument
with empty text/fields and routing.decision == image_analysis. The accompanying radiology
*report* (a text document) is OCR'd normally through the PaddleOCR path.

GPU phase: replace this with a real imaging model (classification/segmentation).
"""

from __future__ import annotations

from typing import Any


def analyze_medical_image(filename: str, doc_group_hint: str) -> dict[str, Any]:
    return {
        "analyzed": False,
        "modality_hint": doc_group_hint,
        "note": (
            "Medical image analysis is not enabled in the CPU MVP. The image was not OCR'd. "
            "Upload the accompanying radiology report for text extraction."
        ),
    }
