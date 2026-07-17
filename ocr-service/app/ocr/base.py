"""Engine-agnostic OCR contract.

An engine takes rendered page images (PNG bytes) and returns line-level text with bounding boxes
and confidence. That is the whole surface the pipeline depends on — so PaddleOCR (CPU) today and
a GPU VLM tomorrow are interchangeable without touching routing, extraction, or the API.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class OcrLine:
    text: str
    bbox: list[float]  # [x0, y0, x1, y1]
    confidence: float


@dataclass
class OcrPage:
    width: float
    height: float
    lines: list[OcrLine] = field(default_factory=list)


@dataclass
class OcrResult:
    pages: list[OcrPage]
    engine: str
    engine_version: str


class OcrEngine(ABC):
    name: str

    @abstractmethod
    def recognize(self, images: list[bytes]) -> OcrResult:
        """OCR a list of page images (PNG bytes), one OcrPage per image."""

    @abstractmethod
    def version(self) -> str: ...
