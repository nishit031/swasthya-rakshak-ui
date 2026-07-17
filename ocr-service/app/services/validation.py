"""Ingestion guardrails: resolve the real MIME type, enforce the size cap, and verify the bytes
actually match their declared type (magic-byte sniff) so a corrupt or mislabeled upload fails
fast with a clear 4xx instead of blowing up deep in OCR."""

from __future__ import annotations

import os

from ..config import Settings
from ..errors import ApiError

_EXT_MIME = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".txt": "text/plain",
}
_ALLOWED = set(_EXT_MIME.values())


def _magic_ok(mime: str, data: bytes) -> bool:
    if mime == "application/pdf":
        return data[:5].startswith(b"%PDF")
    if mime == "image/png":
        return data[:8] == b"\x89PNG\r\n\x1a\n"
    if mime == "image/jpeg":
        return data[:3] == b"\xff\xd8\xff"
    if mime == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    if mime == "image/tiff":
        return data[:4] in (b"II*\x00", b"MM\x00*")
    if mime in ("image/heic", "image/heif"):
        return b"ftyp" in data[:16]
    if mime == "text/plain":
        return True
    return False


def resolve_and_validate(
    filename: str, content_type: str | None, data: bytes, settings: Settings
) -> str:
    """Return the canonical MIME type, or raise ApiError (413 big, 415 bad type, 400 corrupt)."""
    if not data:
        raise ApiError(400, "Empty file.")
    limit = settings.max_mb * 1024 * 1024
    if len(data) > limit:
        raise ApiError(413, f"File exceeds the {settings.max_mb} MB limit.")

    mime = (content_type or "").split(";")[0].strip().lower()
    if mime == "image/jpg":
        mime = "image/jpeg"
    if mime not in _ALLOWED:  # generic/missing content-type -> fall back to extension
        ext = os.path.splitext(filename)[1].lower()
        mime = _EXT_MIME.get(ext, "")
    if mime not in _ALLOWED:
        raise ApiError(415, f"Unsupported file type ({content_type or 'unknown'}).")

    if not _magic_ok(mime, data):
        raise ApiError(400, f"File contents do not match declared type {mime} (corrupt upload?).")
    return mime
