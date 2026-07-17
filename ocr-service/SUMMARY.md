# Routed OCR / Document-Understanding Service — Build Summary

What was designed and built in this session: a self-hosted, CPU-only, routed OCR microservice for
Swasthya Rakshak, plus its wiring into the existing Next.js app. Two passes: an initial full build,
then a finalization pass that completed deterministic field extraction for every document category.

## Why

The app already had a single-engine OCR path (`tesseract.js`, in-process). The ask was a **routed**
pipeline: classify each document first, then send it to the best CPU extraction path, normalize
everything into one JSON schema, and keep it fully isolated per request — without ever calling an
LLM inside the service (deep/normalized medical reasoning stays in the existing Next redaction
gateway, which is the app's "golden rule": OCR produces text on-box, and only _redacted_ text ever
reaches a cloud LLM).

## Architecture

```
Next.js app (host)                         ocr-service (container, CPU)
──────────────────                         ────────────────────────────
extractText(bytes, mime) ── HTTP POST ──▶  FastAPI  /v1/ocr
  │  (OCR_SERVICE_URL set)                    │
  │                                           ├─ ingestion + validation + job isolation
  │  ◀── unified JSON (text + structure) ──   ├─ pdf text-layer detect / extract
  ▼                                           ├─ preprocess (deskew/denoise/contrast/resize)
runGateway: redact (Presidio) ─▶ LLM         ├─ classify: structure tier + group hint
  (unchanged — golden rule intact)           ├─ route ─▶ engine (PaddleOCR | image-analysis stub)
                                              ├─ normalize ─▶ unified schema
  (fallback: tesseract.js if service down)   └─ deterministic field extraction (all categories)
```

- **Engine-agnostic OCR layer**: an `OcrEngine` protocol with one CPU implementation
  (`PaddleOcrEngine`). A GPU vision-language engine can be added later behind the same protocol and
  the same JSON schema — not built in this project, only the seam exists.
- **Stateless w.r.t. users**: the service takes bytes + mime, returns structured text; no global
  mutable user state.
- **Same response envelope** as the app: `{ success, message, data }`.

## Flow

```
upload bytes + mime
  → [A] validate (type/size/magic-bytes) → assign request_id + job_id → per-job temp dir
  → [B] PDF? → has text layer? → yes: extract directly | no: rasterize pages to images
       image? → straight to preprocessing
  → [C] preprocess: EXIF-rotate, grayscale, deskew (cv2, optional), denoise, autocontrast, resize
  → [D] classify: structure_tier (structured/semi/unstructured) + doc_group_hint + is_medical_image?
  → [E] route: printed → PaddleOCR | X-ray film → image-analysis stub (no OCR) | weak page →
        rasterize+PaddleOCR fallback, low-confidence flagged
  → [F] OCR → text + blocks/lines/bboxes/confidence
  → [G] deterministic field extraction (see below) — no LLM
  → [H] normalize → unified JSON; artifacts persisted only if PERSIST_ARTIFACTS=true (opt-in)
  → return { success, message, data: <unified JSON> }
```

## File structure

```
ocr-service/
  app/
    main.py                    FastAPI app, lifespan (engine pool + job store)
    config.py                  env-driven settings (OCR_-prefixed)
    errors.py                  ApiError → {success:false,message,errors} envelope
    api/{routes.py,deps.py}    POST /v1/ocr, GET /v1/jobs/{id}, GET /v1/engines, GET /healthz
    services/
      pipeline.py               orchestrates A→H, owns per-job temp dir lifecycle
      jobs.py                   in-memory TTL job store, lock-guarded, sha256 idempotency
      validation.py             type/size/magic-byte checks
    preprocessing/{pdf.py,image.py}   text-layer detect/extract/rasterize; deskew/denoise/resize
    routing/{classifier.py,router.py} structure tier + group hint + X-ray-film detection; routing
    ocr/
      base.py                   OcrEngine protocol (engine-agnostic)
      paddle_engine.py          PaddleOCR (CPU), lazy-imported
      image_analysis.py         X-ray film stub (no OCR of pixels)
      registry.py               bounded engine pool
    extraction/                 ← deterministic (no-LLM) field extraction, per category
      lab.py                    test/value/unit/reference_range/flag
      prescription.py           drug/dose + frequency/route/duration (attributes)
      sections.py               shared header-based section splitter (reuse backbone)
      narrative.py              clinical / procedure / imaging — sections via sections.py
      admin.py                  claim/policy/payer/amount/date
      billing.py                billing line-items
      fields.py                 dispatch (lab-signal-first, then group, then content fallback)
    schemas/{document.py,api.py} unified JSON schema (single source of truth) + envelope helpers
    storage/artifacts.py        per-job temp dir isolation + TTL sweep for persisted artifacts
  tests/                        37 pytest cases + fixtures (lab/prescription/clinical/procedure/
                                 imaging/insurance_claim .txt) — routing, isolation, parsing, schema
  examples/                     one real unified-JSON payload per fields.kind
  Dockerfile                    python:3.11-slim, PaddleOCR models pre-baked (offline runtime)
  requirements.txt / requirements-dev.txt / pyproject.toml (ruff + mypy)
  README.md                     run instructions, API, fields.kind table, GPU upgrade notes
```

## API contract

Envelope matches the app: `{ success, message, data }` / `{ success, message, errors }`.

| Method | Path                | Notes                                                                                                        |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `POST` | `/v1/ocr`           | multipart `file`; optional `doc_type_hint`, `X-Request-Id`, `Idempotency-Key`. Returns the unified document. |
| `GET`  | `/v1/jobs/{job_id}` | `{ status, result, error }`                                                                                  |
| `GET`  | `/v1/engines`       | active + available engines, `gpu_enabled`                                                                    |
| `GET`  | `/healthz`          | liveness                                                                                                     |

Errors: `413` too big, `415` unsupported type, `400` corrupt/empty, `422` no text, `404` unknown job, `500` failure.

## Unified JSON schema

Every response's `data` includes: `source` (filename/mime/size/pages/sha256), `processing`
(timestamps, engine, pipeline steps), `classification` (structure tier, group hint, is_medical_image,
confidence), `routing` (decision, reason, escalated), `document` (text + pages/blocks/lines/bboxes),
`fields` (kind + items), `confidence` (ocr_mean/min), `warnings`.

**`fields.kind`** — completed in the finalization pass to cover every category:

| `kind`         | Trigger                                                              | `items` shape                                                                     |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lab`          | ≥2 rows with reference ranges (checked first — beats any group hint) | name, value, unit, reference_range, flag                                          |
| `prescription` | medication group, or ≥2 drug lines by content                        | name=drug, value=dose, `attributes` {frequency, route, duration}                  |
| `clinical`     | clinical group                                                       | one item per section (Chief Complaint / Assessment / Plan / Follow-up / …)        |
| `procedure`    | procedure group                                                      | one item per section (Procedure / Findings / Complications / Recommendations / …) |
| `imaging`      | imaging group                                                        | one item per section (Findings / Impression / Recommendation / …)                 |
| `billing`      | administrative group                                                 | billing line-items + claim/policy/payer/amount/date                               |
| `none`         | nothing matched                                                      | text still returned for the Next LLM                                              |

Every item carries `confidence`, `provenance` `{page, bbox}`, and `low_confidence` (below the
escalation threshold). Real example payloads for each kind live in `examples/`.

## Concurrency & isolation

- Async FastAPI; CPU-bound OCR runs in a threadpool.
- Every request gets its own `request_id` + `job_id`; per-job temp dir, removed after each request
  unless `PERSIST_ARTIFACTS=true` (opt-in, kept off by default to honor "raw OCR text is never
  durably stored" — PHI shouldn't sit on disk unless an operator explicitly enables it).
- PaddleOCR instances are pooled (not thread-safe individually) — a bounded queue hands one out per
  request.
- In-memory, lock-guarded job store with TTL eviction and sha256-based idempotency (safe retries).
- No shared mutable user state anywhere — extractors are pure functions over one request's own
  pages. Parallel uploads are fully independent (proven by `test_isolation.py`).

## Routing reasoning

Structured/printed documents (lab, billing, clean reports) go to PaddleOCR — fast and reliable on
printed text/tables. A clean PDF with an embedded text layer skips OCR entirely. Weak/broken pages
fall back through the same rasterize→PaddleOCR path with low-confidence flagging (no second OCR
engine — Tesseract wasn't already in the Python service, so none was added). X-ray **images**
never get OCR'd (pixels aren't text); their accompanying **reports** OCR normally. GPU/VLM routing
was deliberately **not implemented** — only the `OcrEngine` protocol + an `escalated` routing flag
exist as the seam, per this task's explicit scope.

## Integration with the Next.js app

- `src/features/ai/ocr-service.ts` — HTTP client (mirrors `presidio.ts`), posts bytes when
  `OCR_SERVICE_URL` is set.
- `src/features/ai/extract-text.ts` — one guarded branch: try the service, fall back to the
  existing in-process `tesseract.js` on any error. Every downstream consumer (6 medical-record
  processors, lab flow, `/ai/classify`, `/ai/analyze`) is unchanged.
- `docker-compose.yml` — new `ocr-service` container (`8081:8000`), alongside `db` and
  `presidio-analyzer`.
- `.env.example` — `OCR_SERVICE_URL` (optional, commented out — off by default).
- `.github/workflows/ci.yml` + `.github/dependabot.yml` — a Python CI job (ruff/mypy/pytest) and a
  `pip` update group for `ocr-service/`.

## What was fixed during finalization

Verifying the extractors against real fixtures surfaced a genuine routing bug: lab reports were
being misclassified into the medication group and their rows misparsed as drug lines, because the
keyword classifier matched bare `mg` (present in `mg/dL`) and `total` (present in "Total WBC
Count"), and a lab row's "name number unit" shape looks like a drug line. Fixed by: checking a
strong lab signal (≥2 rows with a reference range) before the group hint, requiring an actual
dosage form/frequency/route for prescription detection (strength alone is ambiguous), and removing
the two leaky keywords from the classifier. Verified by regenerating all six example payloads and
confirming each now lands on the correct `fields.kind`.

## Verification performed

- **Python**: ruff clean, mypy clean, **37 pytest** passing (routing, isolation, lab/billing/
  prescription/section/admin parsing, dispatch, schema round-trip, a text-path end-to-end pipeline
  run).
- **Node**: eslint clean, `tsc --noEmit` clean, **229 vitest** passing (including the pre-existing
  `ocr.test.ts`, confirming the tesseract.js fallback path is unregressed), `next build` green.
- Real OCR/PDF/image path and the Docker image build are for manual `docker compose` verification
  (not run in this session, since PaddleOCR/pypdfium2/OpenCV are heavy, lazily-imported deps).

## Explicitly out of scope (by design, this task)

- GPU/VLM engine (Qwen2.5-VL / RolmOCR) — protocol + escalation flag only.
- Any LLM call inside this service.
- Real X-ray image analysis — documented stub.
- A second OCR engine (e.g. Tesseract in Python) — the rasterize path is the CPU fallback.
- Wiring the richer `fields`/classification back into `/ai/classify` + `/ai/analyze` on the Next
  side — the OCR JSON already carries it; Next-side consumption is a documented follow-up.

## Docs updated

`docs/architecture.md`, `docs/decision-log.md`, `docs/progress.md` (Next-app docs); this service's
own `README.md`. `docs/api-contracts.md` was left untouched — the Next `/api/v1` contract didn't
change, since this is an internal seam behind `extract-text.ts`.
