import os
import tempfile
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven config. All knobs are OCR_-prefixed (e.g. OCR_WORKERS=4)."""

    model_config = SettingsConfigDict(env_prefix="OCR_", env_file=".env", extra="ignore")

    # Where per-job temp dirs live. Each job gets its own subdir under here (see storage/artifacts).
    tmp_root: str = os.path.join(tempfile.gettempdir(), "swasthya-ocr-jobs")

    # Ingestion guardrails. 10MB mirrors the Next app's upload limit.
    max_mb: int = 10

    # Size of the OCR engine pool. One PaddleOCR instance per worker thread (they are not
    # reliably thread-safe, so we never share one across concurrent requests).
    workers: int = 2

    # PaddleOCR language. "en" covers Latin-script Indian reports; the GPU VLM handles the rest.
    ocr_lang: str = "en"

    # Rasterization scale for scanned PDFs (2.0 ~ 144dpi, enough for OCR) and cap on pages.
    pdf_render_scale: float = 2.0
    max_pages: int = 10

    # Confidence-based escalation seam. Below this mean OCR confidence a page is flagged
    # escalate=true; when a VLM is enabled the router sends it there instead of PaddleOCR.
    escalation_confidence_threshold: float = 0.6
    gpu_enabled: bool = False

    # Local VLM escalation engine (Ollama-hosted Qwen2.5-VL — see ocr/vlm_engine.py). Works on
    # CPU: no GPU required, just RAM (~8GB for qwen2.5vl:7b, ~4GB for :3b) and a generous timeout
    # (CPU inference runs 30s–3min per page). Env: OCR_VLM_ENABLED / OCR_VLM_URL / OCR_VLM_MODEL /
    # OCR_VLM_TIMEOUT_SECONDS.
    vlm_enabled: bool = True
    vlm_url: str = "http://localhost:11434"
    vlm_model: str = "qwen2.5vl:7b"
    vlm_timeout_seconds: int = 600

    # Job status store TTL and whether raw artifacts survive the request (off by default to
    # honor "raw OCR text is never durably stored").
    job_ttl_seconds: int = 3600
    persist_artifacts: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
