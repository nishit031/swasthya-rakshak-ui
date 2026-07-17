"""FastAPI entrypoint. Builds the engine pool + job store once at startup and hangs them on
app.state (no module-global mutable state), and renders every error through the shared envelope."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .api.routes import router
from .config import get_settings
from .errors import ApiError
from .ocr.registry import build_engine_pool
from .schemas.api import err
from .services.jobs import JobStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.engine_pool = build_engine_pool(settings)
    app.state.jobs = JobStore(ttl_seconds=settings.job_ttl_seconds)
    yield


app = FastAPI(title="Swasthya Rakshak OCR Service", version="0.1.0", lifespan=lifespan)
app.include_router(router)


@app.exception_handler(ApiError)
async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=err(exc.message, exc.errors))


@app.exception_handler(RequestValidationError)
async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=err("Invalid request.", [str(exc)]))
