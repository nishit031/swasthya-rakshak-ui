"""Engine selection + a bounded pool.

The pool hands out one engine instance per concurrent request via a blocking queue, so a fixed
number of CPU-heavy OCR runs proceed in parallel and no instance is shared across threads. Paddle
is imported lazily by the engine itself, so building the pool is cheap — models load on first OCR.
"""

from __future__ import annotations

import queue
from collections.abc import Iterator
from contextlib import contextmanager

from ..config import Settings
from .base import OcrEngine
from .paddle_engine import PaddleOcrEngine


def active_engine_name(settings: Settings) -> str:
    # MVP: PaddleOCR is the only real engine. GPU phase flips unstructured/low-confidence work to
    # the VLM inside the router; the "active" default engine name stays paddleocr.
    return "paddleocr"


def available_engines(settings: Settings) -> list[str]:
    engines = ["paddleocr", "image_analysis_stub"]
    if settings.gpu_enabled or settings.vlm_enabled:
        engines.append("vlm")  # Ollama-hosted Qwen2.5-VL (see vlm_engine.py); CPU-capable
    return engines


class EnginePool:
    def __init__(self, settings: Settings) -> None:
        self._q: queue.Queue[OcrEngine] = queue.Queue()
        for _ in range(max(1, settings.workers)):
            self._q.put(PaddleOcrEngine(lang=settings.ocr_lang))

    @contextmanager
    def acquire(self) -> Iterator[OcrEngine]:
        engine = self._q.get()
        try:
            yield engine
        finally:
            self._q.put(engine)


def build_engine_pool(settings: Settings) -> EnginePool:
    return EnginePool(settings)
