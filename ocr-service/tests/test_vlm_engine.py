"""VlmEngine: Ollama request/response handling with a mocked HTTP layer — no model needed."""

import json

import app.ocr.vlm_engine as vlm_mod
from app.ocr.vlm_engine import VlmEngine


class _FakeResponse:
    def __init__(self, body: dict):
        self._body = json.dumps(body).encode()

    def read(self) -> bytes:
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_recognize_transcribes_each_image_into_lines(monkeypatch):
    captured = {}

    def fake_urlopen(req, timeout=None):
        captured["url"] = req.full_url
        captured["timeout"] = timeout
        captured["payload"] = json.loads(req.data)
        return _FakeResponse(
            {"message": {"content": "ISHNAVI CLINIC\nTab Flagyl 400 1-0-1\n\nTab Pan 40 OD"}}
        )

    monkeypatch.setattr(vlm_mod.urllib.request, "urlopen", fake_urlopen)
    engine = VlmEngine(url="http://localhost:11434/", model="qwen2.5vl:7b", timeout_seconds=600)
    result = engine.recognize([b"png-bytes"])

    assert captured["url"] == "http://localhost:11434/api/chat"
    assert captured["timeout"] == 600
    assert captured["payload"]["model"] == "qwen2.5vl:7b"
    assert captured["payload"]["stream"] is False
    assert captured["payload"]["messages"][0]["images"]  # image went along, base64-encoded

    assert result.engine == "vlm"
    assert len(result.pages) == 1
    texts = [li.text for li in result.pages[0].lines]
    assert texts == ["ISHNAVI CLINIC", "Tab Flagyl 400 1-0-1", "Tab Pan 40 OD"]  # blanks dropped
    assert all(0 < li.confidence < 1 for li in result.pages[0].lines)


def test_recognize_empty_transcription_yields_empty_page(monkeypatch):
    monkeypatch.setattr(
        vlm_mod.urllib.request,
        "urlopen",
        lambda req, timeout=None: _FakeResponse({"message": {"content": ""}}),
    )
    engine = VlmEngine(url="http://localhost:11434", model="m", timeout_seconds=1)
    result = engine.recognize([b"a", b"b"])
    assert len(result.pages) == 2
    assert all(pg.lines == [] for pg in result.pages)
