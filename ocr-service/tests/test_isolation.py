"""Concurrency + isolation: distinct per-job dirs, no engine sharing, thread-safe job store."""

import os
import threading

from app.config import Settings
from app.ocr.registry import build_engine_pool
from app.services.jobs import JobStore
from app.storage.artifacts import job_workspace


def test_job_workspaces_are_distinct_and_cleaned(tmp_path):
    root = str(tmp_path)
    with job_workspace(root, "job_a") as wa, job_workspace(root, "job_b") as wb:
        assert wa != wb
        assert os.path.isdir(wa) and os.path.isdir(wb)
        dirs = [wa, wb]
    assert not os.path.exists(dirs[0]) and not os.path.exists(dirs[1])


def test_job_workspace_persist_keeps_dir(tmp_path):
    with job_workspace(str(tmp_path), "job_p", persist=True) as w:
        held = w
    assert os.path.isdir(held)


def test_engine_pool_never_shares_an_instance():
    pool = build_engine_pool(Settings(workers=2))
    with pool.acquire() as a, pool.acquire() as b:
        assert a is not b  # two concurrent holders get different engines
    with pool.acquire() as c:  # returned to the pool, reusable
        assert c in (a, b)


def test_jobstore_lifecycle_and_idempotency():
    s = JobStore(ttl_seconds=3600)
    s.create("j1", sha256="h1")
    s.update("j1", status="done", result={"ok": True})
    assert s.get("j1").status == "done"
    assert s.find_by_hash("h1").result == {"ok": True}


def test_jobstore_find_by_hash_returns_only_completed():
    s = JobStore(3600)
    s.create("j2", sha256="h2")
    s.update("j2", status="running")
    assert s.find_by_hash("h2") is None


def test_jobstore_ttl_eviction():
    s = JobStore(ttl_seconds=0)
    s.create("j3", sha256="h3")
    s.update("j3", status="done", result={})
    assert s.get("j3") is None  # already past its zero-second TTL


def test_jobstore_is_thread_safe():
    s = JobStore(3600)

    def worker(i: int) -> None:
        s.create(f"job{i}", sha256=f"h{i}")
        s.update(f"job{i}", status="done", result={"i": i})

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(50)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert all(s.get(f"job{i}").status == "done" for i in range(50))
