"""Local vision-language-model engine — the handwriting escalation path.

Talks to an Ollama-hosted VLM (Qwen2.5-VL by default) over localhost HTTP, so pixels never leave
the box and the transcribed text still flows through the Next redaction gateway before any cloud
LLM (the golden rule, same as PaddleOCR). CPU-hosted is fully supported: no GPU needed, just RAM
(~8GB for 7B-Q4, ~4GB for 3B) and patience — expect 30s–3min per page, which is why the timeout
is generous and config-driven.

The model is prompted to transcribe VERBATIM, not interpret: output is plain text lines that feed
the existing classify/extract pipeline unchanged. Stdlib urllib only — no new dependency.
"""

from __future__ import annotations

import base64
import json
import urllib.request

from .base import OcrEngine, OcrLine, OcrPage, OcrResult

_TRANSCRIBE_PROMPT = (
    "Transcribe ALL text in this document image exactly as written, line by line, top to bottom. "
    "Include the letterhead/header, printed text, handwritten text (do your best with unclear "
    "handwriting), tables, stamps, and footer. Do not interpret, summarize, translate, or correct "
    "anything. Output ONLY the transcribed text, one line of the document per line of output."
)

# A VLM reports no per-line confidence; this fixed mid value is deliberately conservative — high
# enough not to re-trigger escalation, low enough that downstream scores stay honest about
# transcribed handwriting. ponytail: constant, make configurable if it ever needs tuning.
_LINE_CONFIDENCE = 0.7


class VlmEngine(OcrEngine):
    name = "vlm"

    def __init__(self, url: str, model: str, timeout_seconds: int) -> None:
        self._url = url.rstrip("/")
        self._model = model
        self._timeout = timeout_seconds

    def version(self) -> str:
        return self._model

    def recognize(self, images: list[bytes]) -> OcrResult:
        pages: list[OcrPage] = []
        for img_bytes in images:
            text = self._transcribe(img_bytes)
            lines = [
                OcrLine(text=ln.strip(), bbox=[0, 0, 0, 0], confidence=_LINE_CONFIDENCE)
                for ln in text.splitlines()
                if ln.strip()
            ]
            pages.append(OcrPage(width=0, height=0, lines=lines))
        return OcrResult(pages=pages, engine=self.name, engine_version=self.version())

    def _transcribe(self, image: bytes) -> str:
        payload = {
            "model": self._model,
            "stream": False,
            "messages": [
                {
                    "role": "user",
                    "content": _TRANSCRIBE_PROMPT,
                    "images": [base64.b64encode(image).decode("ascii")],
                }
            ],
            "options": {"temperature": 0},
        }
        req = urllib.request.Request(
            f"{self._url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=self._timeout) as res:
            data = json.loads(res.read())
        return str(data.get("message", {}).get("content", ""))
