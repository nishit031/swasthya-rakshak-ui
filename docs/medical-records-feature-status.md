# Medical Records Feature — Implementation Status

_Last updated: 2026-07-10 (through Phase 6 — AI processing architecture)_

This document summarizes the **AI processing architecture** phases (1–6) of the Medical Records
feature, phase by phase. Phase 7A ("Platform Experience & Record Management" — filtering, tags,
saved views, search UX, editing, bulk operations, timeline grouping, accessibility) added no new
processor families, so it isn't a phase entry here; see [`progress.md`](./progress.md) → "Recent
Changes" and [`decision-log.md`](./decision-log.md) (2026-07-13 entry) for its full detail. For the
current API/data-model contracts, see [`api-contracts.md`](./api-contracts.md) and
[`database-schema.md`](./database-schema.md).

---

## At a glance

| Phase | Theme                | Adds                                                                       |
| ----- | -------------------- | -------------------------------------------------------------------------- |
| 1     | Foundation           | Upload, OCR, classification, general metadata, config-driven type registry |
| 2     | Clinical processor   | Structured extraction + summary for narrative clinical notes               |
| 3     | Medication processor | Structured medication extraction, normalization, dedupe                    |
| 4     | Imaging processor    | Structured radiology findings, measurements, impression                    |
| 5     | Procedure processor  | Structured operative/procedure extraction, outcome, devices                |
| 6     | Remaining types      | 5 config-only clinical extensions + immunization & billing families        |

All processing is **on-demand** (a "Process document" button per record) — uploading and
classifying a record never triggers the heavier extraction/summary pipeline automatically.

**21 document types** are classifiable (registry in
[`document-types.ts`](../src/backend/features/medical-records/document-types.ts)); after Phase 6, **all 20
non-`other` types** across **6 processor families** are fully processable. `other` remains a
classify-only catch-all with no deep processing (by design).

---

## Phase 1 — Foundation (classification & metadata)

**Goal:** Generalize the existing Lab Reports AI pipeline into a config-driven system that can
classify _any_ medical document and extract general metadata, reusing OCR/PII/LLM infrastructure
end-to-end.

**What it does:**

1. User uploads a file → `POST /ai/classify` OCRs it and asks the LLM to (a) classify it against
   the 21-type registry and (b) extract title/facility/physician/record date.
2. User reviews/edits the AI-suggested fields (low-confidence fields are flagged) and saves via
   `POST /medical-records`.
3. The record is stored with `documentType`, `category` (a coarser group derived from
   `documentType`), `physician`, and `extractionConfidence`.

**Key files:**

- [`document-types.ts`](../src/backend/features/medical-records/document-types.ts) — the registry (single
  source of truth for the 21 types; `key`/`label`/`group`).
- [`ai.service.ts`](../src/backend/features/ai/ai.service.ts) `analyzeMedicalRecord` — classification logic.
- [`ai/classify/route.ts`](../src/app/api/v1/ai/classify/route.ts) — the endpoint.
- [`AddMedicalRecordModal.tsx`](../src/frontend/components/medical-records/AddMedicalRecordModal.tsx),
  [`MedicalRecordMetaCard.tsx`](../src/frontend/components/medical-records/MedicalRecordMetaCard.tsx) — upload/review UI.
- Migration: `20260709062114_add_medical_record_classification`.

**Reused, not rebuilt:** upload endpoint, OCR (`extractText`), PII redaction, the consent gateway,
`scoreExtraction` (generalized from the Lab Reports confidence heuristic).

---

## Phase 2 — Clinical narrative processor

**Supports:** `doctor_note`, `consultation_note`, `history_physical`

**Goal:** The first "deep processing" family — turn free-text clinical narrative into named
sections plus a patient-friendly summary, on demand.

**What it does (per record, on "Process document"):**

1. One OCR pass on the stored file.
2. LLM call #1 → structured JSON with named sections (e.g. chief complaint, history of present
   illness, assessment, plan — the exact set is configured per type).
3. LLM call #2 → a markdown summary in plain language.
4. Persists `extractedDataJson` (`{ kind: "clinical", sections, missingSections, confidence,
generatedAt }`), `summaryText`, and a denormalized `searchText` index.

**Architecture pattern established here (repeated by every later family):**

- `clinical.registry.ts` — factory mapping `documentType` → section config (no switch statements;
  adding a type is one registry entry).
- `clinical.schema.ts` — the TypeScript shape + `validateSections` (coerces LLM JSON, drops unknown
  keys, nulls missing ones, **never invents** a value).
- `clinical.prompt.ts` — one extraction prompt + one summary prompt, templated per type.
- `clinical.processor.ts` — orchestrates OCR → extract → summary → persist.
- `search-text.ts` — builds the searchable index from structured data (not raw OCR).

**UI:** [`ClinicalSectionsView.tsx`](../src/frontend/components/medical-records/ClinicalSectionsView.tsx) (structured section cards),
[`ClinicalSummaryView.tsx`](../src/frontend/components/medical-records/ClinicalSummaryView.tsx) (renders the
markdown summary — reused by every later family too).

**PDF:** [`clinical-pdf.ts`](../src/backend/features/medical-records/clinical-pdf.ts) — later refactored to
share scaffolding via [`pdf-layout.ts`](../src/backend/features/medical-records/pdf-layout.ts) (Phase 3).

**Migration:** `20260709073609_add_medical_record_processing` (added `summaryText`,
`extractedDataJson`, `searchText` — these three columns are reused, unchanged, by every subsequent
family).

---

## Phase 3 — Medication processor

**Supports:** `prescription`, `medication_list`

**Goal:** A reusable "medication intelligence" layer — not just a summary, but one structured
object per medication with dosage/frequency normalization and safe deduplication.

**What it extracts per medication:** name, generic/brand name, strength, dosage
(original + normalized, e.g. "1 tab" → confirmed form), route, frequency (original + normalized,
e.g. "twice daily" → "BID"), duration, quantity, refills, start/end date, PRN flag, instructions,
prescriber, status (`current`/`completed`/`discontinued`/`prn`/`unknown`), and a per-medication
confidence score.

**Notable design choices:**

- `dedupeMedications` merges only **exact** duplicates (same name + strength + frequency +
  instructions) — anything uncertain is kept as a separate row rather than risking a wrong merge.
- Normalizers (`normalizeDosage`, `normalizeFrequency`) always preserve the original text alongside
  the normalized form, so the UI can show both and fall back gracefully.
- Introduced `processing.ts` — the **dispatcher** that routes a record to its processor family by
  `documentType`. Every later family (imaging, procedure) just adds one branch here.
- Introduced `pdf-layout.ts` — shared jsPDF scaffolding (`createPdfDoc`, `drawTable`, `fmtDate`,
  `stripMarkdown`) extracted once a third PDF exporter was needed (rule of three); `clinical-pdf.ts`
  was refactored onto it.

**UI:** [`MedicationsView.tsx`](../src/frontend/components/medical-records/MedicationsView.tsx) — a sortable
table (Medication/Strength/Dose/Frequency/Duration/Status) with **click-to-expand rows** for the
remaining detail fields. This table+expand pattern is reused by Imaging and Procedure.

**PDF:** [`medication-pdf.ts`](../src/backend/features/medical-records/medication-pdf.ts).

---

## Phase 4 — Imaging (radiology) processor

**Supports:** `xray_report`, `mri_report`, `ct_report`, `ultrasound_report`

**Goal:** Structure radiology reports — which are narrative but follow a standard shape (exam,
indication, technique, findings, impression, recommendation) — without losing clinical nuance.

**What it extracts:** exam, indication, technique, comparison, radiologist, report date,
anatomical regions, an array of **findings** (each with location, laterality, severity,
measurement, a cautious plain-language **explanation** of the term, the original source sentence,
and a per-finding confidence), a **measurements** array (normalized to e.g. "3 mm" where possible),
an **ordered** impression (the most clinically important section — order is preserved), follow-up
recommendations, and normal findings (explicitly kept, not discarded).

**Notable design choices:**

- Modality (X-Ray/MRI/CT/Ultrasound) is **derived from `documentType`**, not extracted by the LLM —
  it's already known and reliable, so asking the model for it would be redundant risk.
- Each finding's `explanation` is deliberately constrained by the prompt to _define the term_
  (e.g. "a small round spot in the lung tissue") — never to infer severity or diagnosis. The
  original sentence is always shown alongside so nothing is asserted without the source.
- `severityTone()` maps free-text severity to a badge color (never color alone — the label is
  always shown too).

**UI:** [`ImagingView.tsx`](../src/frontend/components/medical-records/ImagingView.tsx) — an at-a-glance
summary card (modality · region(s) · #findings · #recommendations · confidence), a sortable
findings table with click-to-expand rows (revealing the explanation + source sentence), a
measurements table, and impression/recommendation/normal-findings cards.

**PDF:** [`imaging-pdf.ts`](../src/backend/features/medical-records/imaging-pdf.ts).

**Verified live** against a real MRI-brain report: correctly classified, 2 findings extracted
(with explanations + source sentences), a "3 mm" measurement normalized correctly, 3-line ordered
impression, 1 recommendation, 2 normal findings, 88% confidence; searching "nodule" (a term only in
the structured findings, not the title) correctly matched the record; the timeline showed
"MRI brain — Tiny 3 mm right frontal white-matter nodule, likely benign."

---

## Phase 5 — Procedure & surgical processor

**Supports:** `procedure_note`, `surgery_report`

**Goal:** The fourth family — capture _what was done, how, why, and what happened after_ for
procedures and operations, distinct from clinical notes, medications, and imaging.

**What it extracts:** procedure name, category, date, indication, surgeon, assistants, facility,
operating room, anesthesia type, body site, estimated blood loss, an **ordered list of high-level
steps**, **devices/implants** (device, manufacturer, model, location — designed for a future
implant registry), **specimens** (specimen, collection site, purpose), intraoperative findings,
**complications** (captured only if explicitly stated — never inferred), post-op instructions,
follow-up, and a normalized **outcome** (`successful`/`completed`/`partial`/`aborted`/`converted`/
`unknown`, while preserving the report's own wording).

**Notable design choices:**

- `normalizeOutcome()` maps free-text phrasing to the enum but always keeps `original` — so the UI
  shows a clean status badge while the PDF/detail view can still show the surgeon's exact words.
- Devices and specimens are structured object arrays (not free text) specifically so a future phase
  could build an implant registry or specimen-tracking feature without reshaping stored data.
- The "Procedure Timeline" of steps renders as a **visual vertical timeline** (numbered dots +
  connecting line) — a deliberate UI choice to match the app's Health Timeline aesthetic, confirmed
  with the user before building.

**UI:** [`ProcedureView.tsx`](../src/frontend/components/medical-records/ProcedureView.tsx) — summary card
with an outcome badge, a procedure-overview key/value grid, the vertical step timeline, devices &
specimens tables, and findings/complications/recovery cards.

**PDF:** [`procedure-pdf.ts`](../src/backend/features/medical-records/procedure-pdf.ts).

**Verified live** against a real laparoscopic-appendectomy operative report: procedure name
extracted, outcome normalized to "successful" (original wording preserved), 4 ordered steps, 1
device (Endoloop · Ethicon) and 1 specimen extracted, complications correctly left empty (none
stated), 90% confidence; searching "appendectomy" and "ethicon" (a device manufacturer only in the
structured data) both matched the record; the timeline showed "Laparoscopic Appendectomy —
Procedure completed successfully; patient tolerated well."

---

## Phase 6 — Remaining record types (implemented by reuse)

**Goal:** Make the final 9 classifiable types processable, reusing existing families where possible
and adding a new family only where the data shape is genuinely different — no changes to the
upload/OCR/classification pipeline or the four completed processors.

**Group 1 — five clinical extensions (config-only):** `diagnosis`, `treatment_plan`,
`discharge_summary`, `referral_note`, `clinician_note`. Each is a single entry added to
`clinical.registry.ts` (named `text`/`list` sections + a summary focus). Because the clinical
processor/prompt/schema/`ClinicalSectionsView`/`clinical-pdf`/`search-text` all iterate
`config.sections` generically, these five types became fully processable with **zero new code** —
only ~22 new `medicalRecordSections` i18n labels (EN + HI). The timeline's clinical highlight was
broadened to fall back across the new keys (primary/final diagnosis, referral reason, goals).

**Group 2 — immunization family** (`immunization_record`, `vaccination_record`): a new
`immunization/*` family mirroring the medication table shape. `ImmunizationExtraction` holds a
`vaccines[]` array (name, dose number, date, manufacturer, lot number, route, site, provider, next
due date, per-vaccine confidence); `validateVaccines` coerces/never-invents, parses dose numbers
(e.g. "2nd dose" → 2), and drops empty rows.
**UI:** [`ImmunizationView.tsx`](../src/frontend/components/medical-records/ImmunizationView.tsx) — a compact
vaccine table (Vaccine · Dose · Date · Provider · Next due) with click-to-expand rows for
manufacturer/lot/route/site + per-vaccine confidence.
**PDF:** [`immunization-pdf.ts`](../src/backend/features/medical-records/immunization-pdf.ts).

**Group 3 — billing / administrative family** (`billing_record`, `insurance_claim`): a new
`billing/*` family mirroring the procedure family (scalar fields + an array + a normalized status).
`BillingExtraction` holds recordType, provider, date, service, `codes[]` (CPT/HCPCS/ICD),
amountCharged, amountPaid, payer, denialReason, and a normalized `claimStatus`
(`paid`/`denied`/`pending`/`partial`/`submitted`/`unknown`, preserving the original wording).
Deliberately administrative, not clinical — confirmed with the user.
**UI:** [`BillingView.tsx`](../src/frontend/components/medical-records/BillingView.tsx) — an administrative
summary card with a **claim-status badge**, charged/paid amount tiles, a billing-codes table, and a
denial-reason card when present.
**PDF:** [`billing-pdf.ts`](../src/backend/features/medical-records/billing-pdf.ts).

**Wiring (additive, one branch each):** `processing.ts` + `processable.ts` gain immunization +
billing branches; the `extractedDataJson` union broadens to include `ImmunizationExtraction |
BillingExtraction`; `MedicalRecordCard` gains the two kind flags, second-tab labels (Vaccines /
Billing), the two renderers, the two PDF branches, and their stage labels; `timeline.service.ts`
gains immunization ("N vaccines: …") and billing ("<record/provider> — <status>") highlights.

---

## Shared infrastructure (built once, reused every phase)

| Piece                                            | File                                                   | Reused by                                           |
| ------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| OCR / text extraction                            | `extract-text.ts`                                      | every phase                                         |
| Consent → redact → LLM → audit gateway           | `gateway.ts` (`runGateway`)                            | every phase                                         |
| Extraction confidence scoring                    | `extraction-confidence.ts` (`scoreExtraction`)         | every phase                                         |
| Processor dispatcher                             | `processing.ts`                                        | Phases 3–5 (2 was the first family, added directly) |
| "Is this processable?" check (for UI)            | `processable.ts`                                       | Phases 3–5                                          |
| PDF layout toolkit                               | `pdf-layout.ts`                                        | Phases 3–5 (Phase 2's PDF refactored onto it)       |
| Markdown summary renderer                        | `ClinicalSummaryView.tsx`                              | every phase (generic, not clinical-specific)        |
| Confidence badge / staged loader / consent modal | `ConfidenceBadge`, `StagedLoader`, `AiConsentModal`    | every phase                                         |
| Card workspace (Summary + type-specific tab)     | `MedicalRecordCard.tsx`                                | every phase                                         |
| Scoped search                                    | `?search=` on `GET /medical-records` over `searchText` | every phase                                         |
| Timeline enrichment                              | `timeline.service.ts` `processedHighlight()`           | every phase                                         |

**Data model:** `MedicalRecord.extractedDataJson` is a discriminated union on a `kind` field:
`ClinicalExtraction | MedicationExtraction | ImagingExtraction | ProcedureExtraction |
ImmunizationExtraction | BillingExtraction`. Raw OCR text is **never persisted** — it's re-derived
from the immutable uploaded file on every process/regenerate, so there's no extra
plaintext-PHI-at-rest surface.

---

## Verification

Every phase was verified the same way before being considered done:

- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` —
  all green (including unit tests for every schema/registry/prompt/search-text/PDF module; Phase 6
  added immunization + billing registry/schema/prompt/search + PDF-smoke tests and a Group-1
  clinical registry test).
- An end-to-end Playwright run against a **live OpenRouter LLM call** (not mocked): upload a real
  sample document → classify → save → click "Process document" → confirm the structured tab and
  summary tab render correctly → confirm search finds the record by a structured-data-only term →
  confirm the timeline shows the enriched description → download the PDF and confirm it's valid.

---

## Known limitations (see `progress.md` → "Known Issues" for the full list)

- **Free-tier LLM flakiness**: OpenRouter's free-tier models occasionally return malformed JSON
  (422, handled gracefully) or an empty summary, with no automatic retry. This is a pre-existing,
  documented limitation of the pilot's LLM provider — not specific to Medical Records.
- **Synchronous processing**: each "Process document" click blocks on two LLM calls; there's no
  job queue. Acceptable at pilot scale (10–15 users).
- **All 20 non-`other` types are now processable.** Only `other` (the catch-all) has no deep
  processor, by design.
- **Not yet built** (deliberately deferred, schemas designed to allow adding later without
  refactoring): drug-interaction checking, medication adherence tracking, medication
  reconciliation, imaging prior-study comparison, longitudinal lesion tracking, DICOM metadata,
  an implant registry, operative history, immunization schedule/due-tracking, billing payment/claim
  reconciliation, per-record filters, auto-generated tags, an AI-insights panel, global
  cross-feature search, and record editing (no `PATCH` endpoint exists yet).
