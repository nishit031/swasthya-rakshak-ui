"""API envelope — matches the Next app's contract: { success, message, data } / { success,
message, errors }. Handlers build these via the helpers so every response looks the same."""

from __future__ import annotations

from typing import Any


def ok(data: Any, message: str = "OK") -> dict[str, Any]:
    return {"success": True, "message": message, "data": data}


def err(message: str, errors: list[str] | None = None) -> dict[str, Any]:
    return {"success": False, "message": message, "errors": errors or []}
