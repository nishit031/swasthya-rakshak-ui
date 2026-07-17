# Swasthya Rakshak — OCR / Document-Understanding Service (CPU MVP)

A self-hosted FastAPI microservice that turns an uploaded medical document into structured text.
It **classifies first, then routes** to the right extraction path, normalizes everything into one
JSON schema, and does deterministic field extraction — without ever calling an LLM.

> **Golden rule.** This service produces _text + structure_. It never calls a cloud LLM and never
> sends pixels anywhere. The Next.js app redacts PII (Presidio) before any LLM sees the text.

## Pipeline

```
validate → (PDF text-layer? extract : rasterize+preprocess) / (image? preprocess)
         → OCR (PaddleOCR, CPU) → classify (structure tier + group + X-ray-film?)
         → route → deterministic extract (lab/billing) → normalize → unified JSON
```

Routing:

| Document                                         | Engine                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| Printed/structured (lab, billing, clean reports) | PaddleOCR (CPU)                                    |
| Unstructured (prescriptions, notes)              | PaddleOCR now; flagged `escalated` for the GPU VLM |
| X-ray/CT/MRI **film** (image)                    | image-analysis stub (no OCR)                       |
| Radiology **report** (text)                      | PaddleOCR                                          |

## Run

### Docker (recommended — bakes in the OCR models, runs offline)

```bash
docker compose up -d ocr-service          # from the repo root
curl -F file=@ocr-service/tests/fixtures/lab_report.txt http://localhost:8081/v1/ocr
```

### Local (dev)

```bash
cd ocr-service
python -m venv .venv && . .venv/Scripts/activate    # or source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Tests

The pure-logic tests (routing, extraction, schema, isolation, text-path pipeline) need only the
light deps — no Paddle install:

```bash
cd ocr-service
pip install pydantic pydantic-settings pytest
pytest
```

## API

Envelope: `{ success, message, data }` / `{ success, message, errors }`.

| Method | Path                | Notes                                                                                                                       |
| ------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/v1/ocr`           | multipart `file`; optional `doc_type_hint` (form), `X-Request-Id`, `Idempotency-Key` headers. Returns the unified document. |
| `GET`  | `/v1/jobs/{job_id}` | `{ status, result, error }` from the in-memory store.                                                                       |
| `GET`  | `/v1/engines`       | active + available engines, `gpu_enabled`.                                                                                  |
| `GET`  | `/healthz`          | liveness.                                                                                                                   |

Errors: `413` too big, `415` unsupported type, `400` corrupt/empty, `422` no text, `404` unknown job, `500` failure.

## Extraction (`data.fields`)

Deterministic, no-LLM post-processing. `fields.kind` + `fields.items[]` (each item carries
`confidence`, `provenance` {page, bbox}, and `low_confidence` when below the escalation threshold;
medications also carry `attributes`). Dispatch: a strong lab signal (≥2 reference-range rows) wins
first, then the classifier's group, then content fallbacks.

| `kind`         | Trigger                          | `items` shape                                                                     |
| -------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `lab`          | ≥2 rows with reference ranges    | name, value, unit, reference_range, flag (high/low/normal)                        |
| `prescription` | medication group / ≥2 drug lines | name=drug, value=dose, attributes{frequency,route,duration}                       |
| `clinical`     | clinical group                   | one item per section (Chief Complaint / Assessment / Plan / Follow-up / …)        |
| `procedure`    | procedure group                  | one item per section (Procedure / Findings / Complications / Recommendations / …) |
| `imaging`      | imaging group (report text)      | one item per section (Findings / Impression / Recommendation / …)                 |
| `billing`      | administrative group             | billing line-items + claim/policy/payer/amount/date                               |
| `none`         | nothing matched                  | — (text still available for the Next LLM)                                         |

Deep/normalized medical reasoning stays outside this service (the Next redaction gateway + LLM).

## Example payloads

One real unified-JSON output per kind lives in [`examples/`](examples/) (generated by running each
`tests/fixtures/*.txt` through the pipeline). E.g. `examples/prescription.json` shows drugs with
`attributes.frequency`/`duration`; `examples/lab_report.json` shows lab rows with flags + ranges.

## Config (env, `OCR_`-prefixed)

`OCR_WORKERS` (engine pool size), `OCR_MAX_MB`, `OCR_MAX_PAGES`, `OCR_PDF_RENDER_SCALE`,
`OCR_ESCALATION_CONFIDENCE_THRESHOLD`, `OCR_GPU_ENABLED`, `OCR_JOB_TTL_SECONDS`,
`OCR_PERSIST_ARTIFACTS`, `OCR_TMP_ROOT`, `OCR_OCR_LANG`, and the VLM knobs `OCR_VLM_ENABLED`,
`OCR_VLM_URL`, `OCR_VLM_MODEL`, `OCR_VLM_TIMEOUT_SECONDS` (see below).

## Integration with the Next.js app

`src/features/ai/ocr-service.ts` POSTs the file bytes here when `OCR_SERVICE_URL` is set;
`extract-text.ts` uses the returned text and falls back to on-box tesseract.js if the service is
unreachable. Every existing consumer (medical-record processors, lab flow, `/ai/classify`,
`/ai/analyze`) funnels through `extractText`, so they all switch engines with no code change.

## VLM escalation (handwritten prescriptions) — works on CPU

Cursive handwriting is beyond PaddleOCR. The wired escalation engine is
`app/ocr/vlm_engine.py`: an Ollama-hosted **Qwen2.5-VL** that transcribes low-confidence /
unstructured pages verbatim. No GPU required — it runs on CPU with enough RAM; the trade-off is
latency (roughly 30s–3min per page), which the generous `OCR_VLM_TIMEOUT_SECONDS` (default 600)
absorbs. Note the Next app's `fetch` gives up if the service sends nothing for ~5 minutes and
falls back to tesseract.js, so very slow multi-page runs may lose the VLM result.

Setup:

```bash
# 1. Install Ollama (https://ollama.com), then pull the model:
ollama pull qwen2.5vl:7b   # ~6GB download, needs ~8GB RAM. Use qwen2.5vl:3b on ~4GB RAM.
# 2. Enable in the OCR service env:
OCR_VLM_ENABLED=true
# optional overrides: OCR_VLM_URL (default http://localhost:11434),
# OCR_VLM_MODEL (default qwen2.5vl:7b), OCR_VLM_TIMEOUT_SECONDS (default 600)
```

The router already flags unstructured / low-confidence pages `escalated`; with the VLM enabled
those route to it instead of PaddleOCR. **The JSON schema and API do not change**, so the backend
needs no edits. The VLM runs on-box and still emits text through the redaction gateway — the
golden rule holds. A future GPU host just makes the same engine fast (`OCR_GPU_ENABLED=true`
also routes escalations to it).
