"""HTTP surface. Thin controller: validate, dedup, run the pipeline in a threadpool, envelope."""

from __future__ import annotations

import hashlib

from fastapi import APIRouter, File, Form, Header, Request, UploadFile
from starlette.concurrency import run_in_threadpool

from ..errors import ApiError
from ..ocr.registry import active_engine_name, available_engines
from ..schemas.api import ok
from ..services.pipeline import process_document
from ..services.validation import resolve_and_validate
from .deps import new_job_id, new_request_id

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/v1/engines")
async def engines(request: Request) -> dict:
    s = request.app.state.settings
    return ok(
        {
            "active": active_engine_name(s),
            "available": available_engines(s),
            "gpu_enabled": s.gpu_enabled,
        }
    )


@router.get("/v1/jobs/{job_id}")
async def job_status(job_id: str, request: Request) -> dict:
    rec = request.app.state.jobs.get(job_id)
    if rec is None:
        raise ApiError(404, f"Unknown job_id: {job_id}")
    return ok({"status": rec.status, "result": rec.result, "error": rec.error})


@router.post("/v1/ocr")
async def ocr(
    request: Request,
    file: UploadFile = File(...),
    doc_type_hint: str | None = Form(default=None),
    x_request_id: str | None = Header(default=None),
    idempotency_key: str | None = Header(default=None),
) -> dict:
    settings = request.app.state.settings
    jobs = request.app.state.jobs
    pool = request.app.state.engine_pool

    file_bytes = await file.read()
    mime = resolve_and_validate(file.filename or "upload", file.content_type, file_bytes, settings)

    # Idempotency: identical content (or an explicit key) returns the cached result — safe retries.
    dedup_key = idempotency_key or hashlib.sha256(file_bytes).hexdigest()
    cached = jobs.find_by_hash(dedup_key)
    if cached and cached.result is not None:
        return ok(cached.result, "Document processed (cached).")

    request_id = new_request_id(x_request_id)
    job_id = new_job_id()
    jobs.create(job_id, sha256=dedup_key)
    jobs.update(job_id, status="running")

    try:
        doc = await run_in_threadpool(
            process_document,
            file_bytes=file_bytes,
            filename=file.filename or "upload",
            mime_type=mime,
            request_id=request_id,
            job_id=job_id,
            doc_type_hint=doc_type_hint,
            engine_pool=pool,
            settings=settings,
        )
    except ApiError as e:
        jobs.update(job_id, status="error", error=e.message)
        raise
    except Exception as e:  # noqa: BLE001 — surface any engine failure as a 500 envelope
        jobs.update(job_id, status="error", error=str(e))
        raise ApiError(500, "Document processing failed.", [str(e)]) from e

    result = doc.model_dump(mode="json")
    jobs.update(job_id, status="done", result=result)
    return ok(result, "Document processed.")
