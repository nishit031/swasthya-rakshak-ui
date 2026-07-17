"""In-memory job status store with TTL eviction and content-hash idempotency.

ponytail: a lock-guarded dict, not Redis. Correct and thread-safe for a single process (the MVP
runs one uvicorn worker). Swap for Redis the moment you run more than one replica — the interface
(get/set/find_by_hash) is all the router touches, so that swap doesn't reach the API layer.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Literal

JobStatus = Literal["queued", "running", "done", "error"]


@dataclass
class JobRecord:
    job_id: str
    status: JobStatus
    sha256: str | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)


class JobStore:
    def __init__(self, ttl_seconds: int = 3600) -> None:
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._jobs: dict[str, JobRecord] = {}
        self._by_hash: dict[str, str] = {}  # sha256 -> job_id (idempotency)

    def _evict_locked(self) -> None:
        # <= so ttl=0 means "never cache" even when create + read land in the same clock tick
        # (Windows time.time() granularity can be ~15ms).
        cutoff = time.time() - self._ttl
        stale = [jid for jid, rec in self._jobs.items() if rec.created_at <= cutoff]
        for jid in stale:
            rec = self._jobs.pop(jid)
            if rec.sha256 and self._by_hash.get(rec.sha256) == jid:
                self._by_hash.pop(rec.sha256, None)

    def create(self, job_id: str, sha256: str | None = None) -> JobRecord:
        with self._lock:
            self._evict_locked()
            rec = JobRecord(job_id=job_id, status="queued", sha256=sha256)
            self._jobs[job_id] = rec
            if sha256:
                self._by_hash[sha256] = job_id
            return rec

    def update(
        self,
        job_id: str,
        *,
        status: JobStatus,
        result: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        with self._lock:
            rec = self._jobs.get(job_id)
            if rec is None:
                return
            rec.status = status
            if result is not None:
                rec.result = result
            if error is not None:
                rec.error = error

    def get(self, job_id: str) -> JobRecord | None:
        with self._lock:
            self._evict_locked()
            return self._jobs.get(job_id)

    def find_by_hash(self, sha256: str) -> JobRecord | None:
        """Return a completed job for this content hash, if one is still cached (idempotency)."""
        with self._lock:
            self._evict_locked()
            jid = self._by_hash.get(sha256)
            rec = self._jobs.get(jid) if jid else None
            return rec if rec and rec.status == "done" else None
