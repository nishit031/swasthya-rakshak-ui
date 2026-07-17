"""The orchestrator: bytes in -> unified OcrDocument out, fully isolated per job.

Runs the whole flow (validate is done by the route; ingest -> pdf-text/rasterize/preprocess ->
OCR -> classify -> route -> extract -> normalize) inside a per-job temp dir. It is a *synchronous*
function on purpose — the route runs it in a threadpool so CPU-bound OCR never blocks the event
loop and concurrent requests stay independent. It never calls an LLM: it returns text + structure;
the Next redaction gateway owns the LLM step (the golden rule).
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from ..config import Settings
from ..errors import ApiError
from ..extraction.fields import extract_fields
from ..ocr.base import OcrLine, OcrPage
from ..ocr.image_analysis import analyze_medical_image
from ..preprocessing import pdf as pdfmod
from ..preprocessing.image import preprocess_image
from ..routing.classifier import classify
from ..routing.router import route
from ..schemas.document import (
    Block,
    ConfidenceSummary,
    Document,
    Fields,
    Line,
    OcrDocument,
    Page,
    Processing,
    RouteDecision,
    Routing,
    Source,
)
from ..storage.artifacts import job_workspace, sweep_expired, write_artifact


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _pseudo_pages(text: str) -> list[OcrPage]:
    """Text with no layout (PDF text layer / plain text) -> one page of zero-bbox lines, so
    classification and extraction see a uniform OcrPage list regardless of source."""
    lines = [OcrLine(text=ln.strip(), bbox=[0, 0, 0, 0], confidence=1.0)
             for ln in text.splitlines() if ln.strip()]
    return [OcrPage(width=0, height=0, lines=lines)]


def _schema_pages(ocr_pages: list[OcrPage]) -> list[Page]:
    """OCR result -> schema pages. One block per page (union bbox) holding the line boxes.
    ponytail: no paragraph grouping — line boxes are what PaddleOCR gives and what parsers use."""
    pages: list[Page] = []
    for idx, page in enumerate(ocr_pages, start=1):
        lines = [Line(text=li.text, bbox=li.bbox, confidence=li.confidence) for li in page.lines]
        if lines:
            xs0 = [li.bbox[0] for li in page.lines]
            ys0 = [li.bbox[1] for li in page.lines]
            xs1 = [li.bbox[2] for li in page.lines]
            ys1 = [li.bbox[3] for li in page.lines]
            block_bbox = [min(xs0), min(ys0), max(xs1), max(ys1)]
            conf = sum(li.confidence for li in page.lines) / len(page.lines)
        else:
            block_bbox = [0, 0, page.width, page.height]
            conf = 0.0
        block_text = "\n".join(li.text for li in page.lines)
        block = Block(text=block_text, bbox=block_bbox, confidence=round(conf, 3), lines=lines)
        pages.append(Page(page=idx, width=page.width, height=page.height, blocks=[block]))
    return pages


def _kind_for_mime(mime: str) -> str:
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("image/"):
        return "image"
    return "text"


def process_document(
    *,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
    request_id: str,
    job_id: str,
    doc_type_hint: str | None,
    engine_pool,  # ocr.registry.EnginePool (left untyped to avoid importing it here)
    settings: Settings,
) -> OcrDocument:
    started = datetime.now(timezone.utc)
    received_at = _now_iso()
    sha = hashlib.sha256(file_bytes).hexdigest()
    steps = ["validate"]

    if settings.persist_artifacts:
        sweep_expired(settings.tmp_root, settings.job_ttl_seconds)

    with job_workspace(settings.tmp_root, job_id, settings.persist_artifacts) as workdir:
        kind = _kind_for_mime(mime_type)
        warnings: list[str] = []
        has_pdf_text = False
        ocr_pages: list[OcrPage] = []
        document_pages: list[Page] = []
        text = ""
        engine_name, engine_version = "pdf_text", "n/a"
        page_count = 1
        ocr_conf: list[float] = []
        images: list[bytes] = []

        if kind == "text":
            steps.append("decode")
            text = file_bytes.decode("utf-8", errors="replace").strip()
            ocr_pages = _pseudo_pages(text)
            engine_name = "text"
        elif kind == "pdf":
            page_count = pdfmod.page_count(file_bytes)
            if pdfmod.has_text_layer(file_bytes, settings.max_pages):
                steps.append("pdf_text")
                has_pdf_text = True
                text = pdfmod.extract_pdf_text(file_bytes, settings.max_pages)
                ocr_pages = _pseudo_pages(text)
                warnings.append("Text read from the PDF text layer; bounding boxes unavailable.")
            else:
                steps += ["rasterize", "preprocess"]
                rendered = pdfmod.rasterize(
                    file_bytes, settings.max_pages, settings.pdf_render_scale
                )
                images = [preprocess_image(im) for im in rendered]
        else:  # image
            steps.append("preprocess")
            images = [preprocess_image(file_bytes)]

        if images:
            steps.append("ocr")
            with engine_pool.acquire() as engine:
                result = engine.recognize(images)
            engine_name, engine_version = result.engine, result.engine_version
            ocr_pages = result.pages
            ocr_conf = [li.confidence for pg in ocr_pages for li in pg.lines]

            # Low-confidence pages get ONE retry with harder binarization (CLAHE + adaptive
            # threshold); keep whichever pass scored higher. Helps faded print / uneven lighting —
            # not cursive handwriting (that's the VLM escalation's job).
            mean = sum(ocr_conf) / len(ocr_conf) if ocr_conf else 0.0
            if mean < settings.escalation_confidence_threshold:
                steps.append("ocr_retry_binarized")
                from ..preprocessing.image import binarize_adaptive

                with engine_pool.acquire() as engine:
                    retry = engine.recognize([binarize_adaptive(im) for im in images])
                retry_conf = [li.confidence for pg in retry.pages for li in pg.lines]
                retry_mean = sum(retry_conf) / len(retry_conf) if retry_conf else 0.0
                if retry_mean > mean:
                    result, ocr_pages, ocr_conf = retry, retry.pages, retry_conf
                    engine_name, engine_version = retry.engine, retry.engine_version

            page_count = len(ocr_pages) or page_count
            text = "\n".join(li.text for pg in ocr_pages for li in pg.lines).strip()

        steps.append("classify")
        all_lines = [li for pg in ocr_pages for li in pg.lines]
        classification = classify(
            text=text, lines=all_lines, mime_type=mime_type, has_pdf_text=has_pdf_text,
            filename=filename, doc_type_hint=doc_type_hint,
        )
        ocr_mean = sum(ocr_conf) / len(ocr_conf) if ocr_conf else 1.0
        ocr_min = min(ocr_conf) if ocr_conf else 1.0

        steps.append("route")
        routing: Routing = route(
            classification=classification, has_pdf_text=has_pdf_text,
            ocr_mean_confidence=ocr_mean, settings=settings,
        )

        fields = Fields(kind="none", items=[])
        if routing.decision == RouteDecision.image_analysis:
            # X-ray/CT/MRI film: discard the (meaningless) OCR text, hand off to the image stub.
            info = analyze_medical_image(filename, classification.doc_group_hint.value)
            warnings.append(info["note"])
            text, ocr_mean, ocr_min = "", 0.0, 0.0
            document_pages = []
            engine_name, engine_version = "image_analysis_stub", "n/a"
        else:
            if routing.decision == RouteDecision.gpu_vlm and images and settings.vlm_enabled:
                # Handwriting/low-confidence escalation: transcribe with the local VLM (Ollama,
                # CPU-capable — slow but on-box). Replaces the Paddle text only when it produced
                # something; any failure falls back to the Paddle result with a warning.
                steps.append("vlm_transcribe")
                from ..ocr.vlm_engine import VlmEngine

                try:
                    vlm_result = VlmEngine(
                        url=settings.vlm_url,
                        model=settings.vlm_model,
                        timeout_seconds=settings.vlm_timeout_seconds,
                    ).recognize(images)
                    vlm_conf = [li.confidence for pg in vlm_result.pages for li in pg.lines]
                    if vlm_conf:
                        ocr_pages = vlm_result.pages
                        text = "\n".join(
                            li.text for pg in ocr_pages for li in pg.lines
                        ).strip()
                        ocr_mean = sum(vlm_conf) / len(vlm_conf)
                        ocr_min = min(vlm_conf)
                        engine_name = vlm_result.engine
                        engine_version = vlm_result.engine_version
                        warnings.append(
                            "Low-confidence scan transcribed by the local vision model; "
                            "please verify the extracted text against the original."
                        )
                except Exception as exc:  # noqa: BLE001 — degrade to Paddle text, never fail
                    warnings.append(f"VLM transcription failed; served by PaddleOCR. ({exc})")
            elif routing.decision == RouteDecision.gpu_vlm:
                warnings.append(
                    "Routed to GPU VLM but no VLM engine is wired; served by PaddleOCR."
                )
            if images and not text:
                raise ApiError(
                    422, "OCR produced no text — the document may be blank or unreadable."
                )
            document_pages = _schema_pages(ocr_pages) if images else []
            steps += ["extract", "normalize"]
            fields = extract_fields(
                group=classification.doc_group_hint,
                pages=ocr_pages,
                low_conf_threshold=settings.escalation_confidence_threshold,
            )

        doc = OcrDocument(
            request_id=request_id,
            job_id=job_id,
            source=Source(filename=filename, mime_type=mime_type, size_bytes=len(file_bytes),
                          page_count=page_count, sha256=sha),
            processing=Processing(
                received_at=received_at, completed_at=_now_iso(),
                duration_ms=int((datetime.now(timezone.utc) - started).total_seconds() * 1000),
                engine=engine_name, engine_version=engine_version, pipeline=steps,
            ),
            classification=classification,
            routing=routing,
            document=Document(text=text, pages=document_pages),
            fields=fields,
            confidence=ConfidenceSummary(ocr_mean=round(ocr_mean, 3), ocr_min=round(ocr_min, 3)),
            warnings=warnings,
        )

        if settings.persist_artifacts:
            # Section H: raw OCR + structured JSON + classification + routing + timestamps, each in
            # the job's own namespaced dir. Off by default (raw text = PHI); an operator opts in.
            write_artifact(workdir, "result.json", doc.model_dump(mode="json"))
            write_artifact(workdir, "raw_ocr.json", {
                "text": text,
                "pages": [p.model_dump(mode="json") for p in document_pages],
            })
            write_artifact(workdir, "classification.json", classification.model_dump(mode="json"))
            write_artifact(workdir, "routing.json", routing.model_dump(mode="json"))
            write_artifact(workdir, "meta.json", {
                "request_id": request_id,
                "job_id": job_id,
                "received_at": received_at,
                "completed_at": doc.processing.completed_at,
                "sha256": sha,
            })

        return doc
