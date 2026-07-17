from __future__ import annotations

from uuid import uuid4


def new_request_id(provided: str | None) -> str:
    """Honor a caller-supplied X-Request-Id for cross-service tracing, else mint one."""
    return provided or f"req_{uuid4().hex}"


def new_job_id() -> str:
    return f"job_{uuid4().hex}"
