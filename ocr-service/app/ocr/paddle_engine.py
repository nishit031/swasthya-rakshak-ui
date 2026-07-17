"""PaddleOCR engine (CPU). The default MVP engine for all scanned/printed documents.

Paddle + numpy + PIL are imported lazily inside methods so the rest of the service (and the
pure-logic unit tests) import without the heavy stack installed. A PaddleOCR object is not
reliably thread-safe, so instances are pooled one-per-worker by the registry — a single instance
is only ever touched by one thread at a time.
"""

from __future__ import annotations

import io

from .base import OcrEngine, OcrLine, OcrPage, OcrResult


class PaddleOcrEngine(OcrEngine):
    name = "paddleocr"

    def __init__(self, lang: str = "en") -> None:
        self._lang = lang
        self._ocr = None  # built on first use (loads models)

    def _engine(self):
        if self._ocr is None:
            # paddlepaddle's shared library exports its own zlib symbols globally; whichever
            # library dlopen's zlib first "wins" for the whole process. Importing pyclipper (a
            # paddleocr dependency, used inside its postprocessing step) before paddle binds the
            # real system zlib first — importing paddle first segfaults inside pyclipper's
            # inflateReset2 call. This import order must come before `import paddleocr`.
            import pyclipper  # noqa: F401
            from paddleocr import PaddleOCR

            # ponytail: targets the PaddleOCR 2.7.x .ocr(img, cls=True) API. Paddle 3.x renamed
            # this to .predict() with a different shape — bump the pin and this call together.
            self._ocr = PaddleOCR(
                use_angle_cls=True, lang=self._lang, show_log=False
            )
        return self._ocr

    def version(self) -> str:
        try:
            import paddleocr

            return getattr(paddleocr, "__version__", "unknown")
        except Exception:
            return "unknown"

    def recognize(self, images: list[bytes]) -> OcrResult:
        import numpy as np
        from PIL import Image

        ocr = self._engine()
        pages: list[OcrPage] = []
        for img_bytes in images:
            pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            width, height = pil.size
            result = ocr.ocr(np.array(pil), cls=True)
            lines: list[OcrLine] = []
            # Paddle returns [ per_image[ [box_pts, (text, conf)], ... ] ]; a blank page -> [None].
            for per_image in result or []:
                for det in per_image or []:
                    box, (text, conf) = det
                    xs = [float(p[0]) for p in box]
                    ys = [float(p[1]) for p in box]
                    lines.append(
                        OcrLine(
                            text=text,
                            bbox=[min(xs), min(ys), max(xs), max(ys)],
                            confidence=float(conf),
                        )
                    )
            pages.append(OcrPage(width=float(width), height=float(height), lines=lines))
        return OcrResult(pages=pages, engine=self.name, engine_version=self.version())
