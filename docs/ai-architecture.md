# AI Architecture

Scope: **10–15 user pilot** (redact-then-send, ~₹8k/mo, single node). Phases 3–4 (embeddings/RAG chatbot) are deferred. The full scale-up blueprint (Bedrock, pgvector, queue, KMS, S3) lives in the approved plan; this doc describes what is **built**.

## Golden rule

**No feature code calls the LLM directly.** Everything goes through `src/backend/features/ai/gateway.ts`, which does, in order:

1. **Consent gate** — refuses (403) unless `User.aiConsentAt` is set (DPDPA).
2. **Redact** — `redact()` replaces direct identifiers with reversible typed placeholders (`<PERSON_1>`, `<PHONE_1>`, …): structured IDs by in-app regex, names/addresses by Presidio NER. Clinical content (values, diagnoses) is kept. Fails closed (`503`) if the NER service is down.
3. **LLM** — only the redacted text is sent to the model (`llm.ts`, OpenRouter's OpenAI-compatible API on de-identified text; `AI_MODEL` can be any OpenRouter model, including free-tier ones).
4. **Rehydrate** — placeholders restored in the response for the user.
5. **Audit** — one append-only `AuditLog` row per call (model, action, redaction count).

The request-scoped token map lives in memory only — never persisted.

## Redaction (`redact.ts`)

- **Structured IDs** (regex, in-app, no deps): Aadhaar, PAN, ABHA, Indian phone, email, dates. These are script-agnostic, so they redact the same on OCR'd Hindi or English text. Proven on OCR output in `__tests__/ocr.test.ts`.
- **Names / addresses** (NER): the Presidio analyzer container, **on by default** for the AI flow (`PRESIDIO_URL` set in `.env.example`). If it's configured but unreachable the gateway **fails closed** (`503`) rather than send un-redacted names to the LLM. Stock image is English (`PRESIDIO_LANGUAGE`, default `en`) — catches Latin-script names (the common case) plus Presidio's Indian ID patterns; Devanagari-script names need a Hindi spaCy model added to the container (the documented upgrade).
- Reversible: `rehydrate(text, map)` restores originals (names included). Covered by `__tests__/redact.test.ts` (asserts no raw identifier escapes).

## OCR (`ocr.ts`)

Scanned PDFs and photos (JPG/PNG/JPEG, incl. camera capture) are OCR'd **on this box** —
`tesseract.js` with `eng+hin` traineddata bundled in `tessdata/` (no runtime CDN fetch, so no
data or dependency leaves). `sharp` normalizes the image (grayscale + upscale) before OCR;
image-only PDFs are rasterized page-by-page via `pdfjs-dist` + `@napi-rs/canvas`. Because OCR
produces **text**, that text still flows through the redaction gateway before any of it reaches
the LLM — the golden rule holds for images too (pixels themselves can't be pre-redacted).

## Pipeline (`ai.service.ts`)

`POST /api/v1/ai/summary` and `/ai/extract`:
`load source (lab_report | medical_record, ownership-checked)` → `readUploadedFile` → `extractText` (PDF text layer, else self-hosted OCR; images OCR'd directly) → `runGateway` → persist.

- Summary → cautious plain-language text into `LabReport.summaryText` + an `AiInsight`.
- Extract → strict JSON into `LabReport.extractedDataJson` + an `AiInsight`.

`POST /api/v1/ai/classify` (Medical Records — pre-save, mirrors `/ai/analyze`):
`readUploadedFile` → `extractText` → `runGateway` (system prompt built from the
`document-types.ts` registry) → parse `{documentType, title, facility, physician, recordDate}` →
`scoreExtraction` for confidence. No persistence here — the caller reviews/edits, then saves via
`POST /medical-records`. `documentType` is validated against the registry (`getDocType`); an
unrecognized value comes back `null` and the UI falls back to manual type selection. This keeps
Medical Records config-driven: adding a document type to the registry is the only change needed
to make it classifiable — no other file hardcodes the type list.

`POST /api/v1/medical-records/:id/process` (Medical Records Phase 2–5): a dispatcher
(`processing.ts` → `processMedicalRecord`) routes the record by `documentType` to a processor
family. Each family does **one** OCR pass then **two** `runGateway` calls (structured extraction +
patient-friendly markdown summary) and persists `extractedDataJson`, `summaryText`, and a
denormalized `searchText` index; `extractedDataJson` is a discriminated union on `kind`.

- **Clinical** (`src/backend/features/medical-records/clinical/*`) — `ClinicalExtraction` (named narrative
  sections), config-driven per type from `clinical.registry.ts`.
- **Medication** (`src/backend/features/medical-records/medication/*`) — `MedicationExtraction` (one
  `MedicationItem` per drug; deterministic dose/frequency normalizers + exact-only dedupe in
  `medication.schema.ts`; config per type in `medication.registry.ts`). The canonical medication
  extraction layer for future phases (interaction/adherence/reconciliation), designed so those
  extend the model without refactoring.
- **Imaging** (`src/backend/features/medical-records/imaging/*`) — `ImagingExtraction` for radiology
  reports (`xray/mri/ct/ultrasound_report`): named sections + `findings[]` (each with a cautious
  plain-language `explanation` + `sourceText`), `measurements[]`, ordered `impression[]`,
  `recommendations[]`, `normalFindings[]`, `regions[]`; modality derived from `documentType`.
  Config per type in `imaging.registry.ts`. The canonical imaging layer (future: prior-comparison,
  lesion tracking, DICOM metadata) — shaped to accept those without refactoring.
- **Procedure** (`src/backend/features/medical-records/procedure/*`) — `ProcedureExtraction` for procedural/
  operative reports (`procedure_note`, `surgery_report`): procedure/surgeon/facility/anesthesia plus
  ordered `steps[]`, `devices[]`, `specimens[]`, `intraoperativeFindings[]`, `complications[]`
  (never inferred), `postOpInstructions[]`, `followUp[]`, and a normalized `outcome`
  (`{ status, original }`). Config per type in `procedure.registry.ts`. The canonical procedure
  layer (future: implant registry, operative history, recovery tracking) — shaped to accept those.
- **Immunization** (`src/backend/features/medical-records/immunization/*`) — `ImmunizationExtraction` for
  `immunization_record`, `vaccination_record`: a structured `vaccines[]` table (name, dose number,
  date, manufacturer, lot number, route, site, provider, next-due, per-vaccine confidence). Config
  per type in `immunization.registry.ts`. Mirrors the medication table shape.
- **Billing / administrative** (`src/backend/features/medical-records/billing/*`) — `BillingExtraction` for
  `billing_record`, `insurance_claim`: administrative (not clinical) fields — provider, service,
  `codes[]` (CPT/HCPCS/ICD), amount charged/paid, payer, denial reason, and a normalized
  `claimStatus` (`{ status, original }`). Config per type in `billing.registry.ts`.

The clinical family also covers five config-only extensions — `diagnosis`, `treatment_plan`,
`discharge_summary`, `referral_note`, `clinician_note` — added purely as `clinical.registry.ts`
entries (named sections + summary focus + i18n labels); the generic clinical processor/prompt/
schema/renderer/PDF/search handle them with no new code.

All six families share one processor/prompt/schema/renderer per family, configured only by registry
data — no per-type code paths, no switch statements. Adding a type is one registry entry (a clinical
extension) or one small family (a genuinely new shape). All 21 classifiable types are now
processable (`other` stays a classify-only catch-all).

## Data model additions

- `User.aiConsentAt` — consent to AI-process records.
- `LabReport.extractedDataJson` — AI-extracted structured values.
- `MedicalRecord.documentType` / `.physician` / `.extractionConfidence` — written by the on-upload
  classification (`POST /ai/classify`); `category` stays a coarser group derived from
  `documentType` (`groupFor()` in `document-types.ts`).
- `MedicalRecord.summaryText` / `.extractedDataJson` / `.searchText` — written by on-demand
  processing (`POST /medical-records/:id/process`); `extractedDataJson` is a
  `ClinicalExtraction | MedicationExtraction | ImagingExtraction | ProcedureExtraction |
ImmunizationExtraction | BillingExtraction` union. Raw OCR is never persisted — re-derived from
  the immutable uploaded file each run.
- `AuditLog` — append-only; no FK to User (survives account deletion).

## Deferred to a later phase

All 21 classifiable document types are now processable; `other` stays a classify-only catch-all.
Cross-record follow-ons remain out of scope — medication (drug-interaction checking, adherence
reminders, reconciliation, cross-record history), imaging (prior-comparison, longitudinal lesion
tracking, DICOM metadata, change detection), procedure (implant registry, operative history,
recovery tracking, revision procedures), immunization (schedule/due tracking, catch-up
recommendations), and billing (payment tracking, claim reconciliation) — all models are shaped to
accept them without refactoring. Also deferred: per-record filters, auto-tags, an AI-insights panel,
and global cross-feature search.

## Deliberate pilot cuts (see `ponytail:` comments in code)

Queue/worker, KMS envelope encryption, S3, embeddings/pgvector/reranker, Langfuse, `AiJob`/`LabResult`/`RedactionTokenMap` tables, and a dedicated hosted-model provider (e.g. Bedrock) — all deferred. Processing is synchronous (OCR included — a large scan blocks the request; add a queue if it becomes a problem); storage stays local disk. `llm.ts` currently calls OpenRouter (free-tier `AI_MODEL`) to keep the pilot at $0 — swap the endpoint/model there alone if quality, rate limits, or residency requirements demand a different provider later.
