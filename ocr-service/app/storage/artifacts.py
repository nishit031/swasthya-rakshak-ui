"""Per-job filesystem isolation.

Every request gets its own directory under TMP_ROOT/{job_id}/. Two concurrent jobs never share
a path, so there is no cross-request bleed of file bytes or intermediate artifacts. The dir is
removed when the job finishes unless PERSIST_ARTIFACTS is on (debugging), and even then only
until the caller sweeps it — raw OCR text is never meant to live durably.
"""

from __future__ import annotations

import json
import os
import shutil
import time
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any


@contextmanager
def job_workspace(tmp_root: str, job_id: str, persist: bool = False) -> Iterator[str]:
    """Create TMP_ROOT/{job_id}/, yield its path, remove it on exit (unless persist)."""
    workdir = os.path.join(tmp_root, job_id)
    os.makedirs(workdir, exist_ok=True)
    try:
        yield workdir
    finally:
        if not persist:
            shutil.rmtree(workdir, ignore_errors=True)


def sweep_expired(tmp_root: str, ttl_seconds: int) -> None:
    """Remove persisted job dirs older than the TTL. Only matters when PERSIST_ARTIFACTS is on
    (otherwise dirs are already removed per-request). ponytail: opportunistic sweep called at
    request start, not a background scheduler — fine at pilot scale."""
    if not os.path.isdir(tmp_root):
        return
    cutoff = time.time() - ttl_seconds
    for entry in os.scandir(tmp_root):
        try:
            if entry.is_dir() and entry.stat().st_mtime < cutoff:
                shutil.rmtree(entry.path, ignore_errors=True)
        except OSError:
            continue  # a concurrent request may be mid-write; skip it


def write_artifact(workdir: str, name: str, payload: Any) -> None:
    """Persist a per-job artifact (raw OCR, structured JSON, routing decision...) for debugging.
    No-op-safe: callers guard on PERSIST_ARTIFACTS before calling."""
    path = os.path.join(workdir, name)
    if isinstance(payload, dict | list):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
    elif isinstance(payload, bytes):
        with open(path, "wb") as f:
            f.write(payload)
    else:
        with open(path, "w", encoding="utf-8") as f:
            f.write(str(payload))
