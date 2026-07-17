# Database Schema

> **Ownership note (added 2026-07-16):** this schema is owned and migrated by the separate Laravel
> backend repo, `swathya-rakshak-backend/database/migrations/` — not by any code in this repo.
> Since the frontend/backend split (`627cddb`, `docs/decision-log.md` 2026-07-15/16),
> `prisma/schema.prisma` and every migration described below no longer exist in this repo; the
> Laravel app models the same tables (as Eloquent models, not Prisma). Kept here per `CLAUDE.md`
> ("see this repo's `docs/database-schema.md` for the shape the frontend relies on") as the
> frontend-relevant reference, not as this repo's authoritative source — cross-check
> `swathya-rakshak-backend/database/migrations/` and `app/Models/` directly if in doubt. Two new
> tables backing the `/admin/*` and `/subscription/*` endpoints (subscriptions, plans, payments —
> see `api-contracts.md`) aren't documented below yet; that feature has no decision-log entry to
> draw the schema from (see `progress.md` → Known Issues).

## Design principles

- Keep the schema simple for MVP
- Model patient-owned health data first
- Use relational structure
- Keep future clinic/hospital data separate

## Core tables

### users

Primary account holder. Identity is the **mobile number** (`phone`, unique, required) — there is
no email field. `phoneVerified` is false until the registration OTP is confirmed. `role` is
`"patient"` (default) or `"doctor"`; it is carried in the JWT and drives which dashboard/nav and
API endpoints a user can use. `gender` is nullable in the table for existing rows, but patient registration requires and stores one of `"male"`, `"female"`, or `"other"`. `mealTimings` (nullable JSON, `{ wakeUp?, breakfast?, lunch?,
highTea?, dinner?, bedtime? }`, each an optional `"HH:MM"` string) is optional per-patient
meal-time customization, set from the Profile page's "Daily Routine" section or the optional
post-registration onboarding step; when present it overrides the fixed default meal-slot times
used for medicine reminder scheduling (see `reminders` below). Only the four meal keys
(breakfast/lunch/highTea/dinner) currently drive scheduling — `wakeUp`/`bedtime` are stored and
displayed but not yet consumed by any feature. `aiConsentAt`
(nullable timestamp) records when the user granted consent to have their records processed by the
AI layer; the AI gateway (`src/backend/features/ai/gateway.ts`) refuses to run until this is set.

### doctor_profiles

One-to-one professional profile for a `role: "doctor"` user: `specialization`, `licenseNumber`,
`clinicName`. Created alongside the user during doctor registration.

### doctor_patients

Connection between a doctor and a patient, initiated by the doctor (by the patient's phone
number) and requiring patient approval. `status` is `"pending"` | `"accepted"` | `"rejected"`.
Only an `"accepted"` connection lets a doctor prescribe to that patient. Unique on
`[doctorId, patientId]`.

### daily_visits

A doctor's per-day patient list ("Patient List" in the UI). Adding a patient assigns them the
next sequential `tokenNumber` for that `doctorId` + `visitDate` (a calendar day, selectable via
a date picker — not just today); re-adding the same patient on the same day returns their
existing token instead of creating a duplicate. Requires an `"accepted"` `doctor_patients`
connection. Unique on `[doctorId, visitDate, patientId]` and on `[doctorId, visitDate, tokenNumber]`.
Lets the doctor disambiguate same-name patients (name + phone + token) and pre-fills a
prescription's patient and visit date from the selected entry. A visit's `prescriptions` (via
`Prescription.dailyVisitId`) determine whether its token badge shows as prescribed (green) or not
(default) in the UI.

### otp_verifications

Short-lived one-time codes for verifying a mobile number (registration) or logging in (OTP login).
Codes are stored **hashed**, expire in 5 minutes, allow 5 attempts, and are single-use. Not owned
by a user (a code can exist before the account is verified).

### family_members

Linked dependents and family profiles: `name`, `relationship`, `dateOfBirth?`, `gender?`,
`bloodGroup?`, `profilePhoto?`. Full CRUD as of Medical Records Phase 7A (`userId`-scoped) — the
table existed from the start, but the API was a `501` stub until then.

### medical_records

Uploaded health documents, generalized to any medical document type (doctor notes,
prescriptions, imaging reports, discharge summaries, vaccination records, billing, …), not just
the five original hardcoded categories. `documentType` (nullable String) is the AI-classified
specific type — a key into the `src/backend/features/medical-records/document-types.ts` registry (the
single source of truth for supported types; adding a type there is the only step needed to make
it classifiable, per the config-driven design). `category` is a coarser group (`clinical` |
`imaging` | `medication` | `procedure` | `administrative` | `other`) derived from `documentType`
via `groupFor()` when not explicitly passed. `physician` (nullable String) and
`extractionConfidence` (nullable Float, 0–100) are written by the on-upload classification
(`POST /ai/classify`), mirroring the `lab_reports` metadata auto-fill pattern below.

**Phase 2 (clinical processing).** For clinical narrative types (`doctor_note`,
`consultation_note`, `history_physical`), on-demand processing (`POST /medical-records/:id/process`)
populates: `summaryText` (nullable String — patient-friendly markdown summary),
`extractedDataJson` (nullable Json — a `ClinicalExtraction`
`{ kind: "clinical", sections, confidence, missingSections, generatedAt }`, where `sections` maps
each configured section key to narrative text or a string list), and `searchText` (nullable String
— a denormalized lowercase index built from the structured sections + summary + metadata, **not**
raw OCR, so `GET /medical-records?search=` can match structured content). These three columns are
always a **mirror of the latest `ExtractionVersion`** (see below) — as of the three-layer
persistence change (2026-07-14), raw OCR text is no longer discarded; it's kept in `ocr_results`
and every process call appends a new `extraction_versions` row instead of overwriting in place. The
section list per type lives in `src/backend/features/medical-records/clinical/clinical.registry.ts`.

**Layer 1 (original file) metadata.** `originalFilename`/`fileSizeBytes`/`sha256` (all nullable) are
captured at upload time from the client's `/upload` response and passed through on create; `fileUrl`
itself is never overwritten (a random storage key, immutable for the life of the record).

**Phase 3 (medication processing).** For medication types (`prescription`, `medication_list`),
the same `POST /medical-records/:id/process` populates `summaryText`, `searchText`, and
`extractedDataJson` as a `MedicationExtraction`
`{ kind: "medication", medications: MedicationItem[], confidence, generatedAt }`.
`extractedDataJson` is therefore a **discriminated union** (`ClinicalExtraction | MedicationExtraction`,
switched on `kind`). Each `MedicationItem` is one medication (never merged) with
name/generic/brand/strength/dosage(+normalized)/route/frequency(+normalized)/duration/quantity/
refills/start–end/prn/instructions/prescriber/status(`current|completed|discontinued|prn|unknown`)
plus per-item `confidence`. `searchText` indexes medication names/brand/generic/dosage/prescriber/
instructions so `?search=Metformin` matches. The model + normalizers live in
`src/backend/features/medical-records/medication/`.

**Phase 4 (imaging processing).** For radiology types (`xray_report`, `mri_report`, `ct_report`,
`ultrasound_report`), the same `POST /medical-records/:id/process` populates `summaryText`,
`searchText`, and `extractedDataJson` as an `ImagingExtraction`
`{ kind: "imaging", exam, indication, technique, comparison, radiologist, reportDate, regions[],
findings: ImagingFinding[], measurements: ImagingMeasurement[], impression: string[] (ordered),
recommendations[], normalFindings[], confidence, generatedAt }`. Each `ImagingFinding` is one
observation (finding/location/laterality/severity/measurement + a cautious plain-language
`explanation` + `sourceText` + per-finding `confidence`); normal statements go in `normalFindings`.
Modality is **derived** from `documentType` (not stored). `searchText` indexes
findings/impression/recommendations/regions/measurements/modality so `?search=nodule` matches. The
model lives in `src/backend/features/medical-records/imaging/`.

**Phase 5 (procedure processing).** For procedural types (`procedure_note`, `surgery_report`), the
same `POST /medical-records/:id/process` populates `summaryText`, `searchText`, and
`extractedDataJson` as a `ProcedureExtraction`
`{ kind: "procedure", procedureName, procedureCategory, procedureDate, indication, surgeon,
facility, operatingRoom, anesthesiaType, bodySite, estimatedBloodLoss, assistants[], steps[]
(high-level, ordered), devices: ProcedureDevice[] (device/manufacturer/model/location → future
implant registry), specimens: ProcedureSpecimen[] (specimen/collectionSite/purpose),
intraoperativeFindings[], complications[] (never inferred), postOpInstructions[], followUp[],
outcome: { status: "successful"|"completed"|"partial"|"aborted"|"converted"|"unknown"; original },
confidence, generatedAt }`. `searchText` indexes procedure/surgeon/facility/devices/complications/
outcome/bodySite so `?search=appendectomy` matches. The model lives in
`src/backend/features/medical-records/procedure/`.

**Phase 6 (remaining types).** Five clinical extensions (`diagnosis`, `treatment_plan`,
`discharge_summary`, `referral_note`, `clinician_note`) are config-only additions to the existing
clinical family (`ClinicalExtraction`, new named sections). Two new families handle the rest: an
`ImmunizationExtraction` `{ kind: "immunization", vaccines: VaccineItem[] (name/doseNumber/date/
manufacturer/lotNumber/route/site/provider/nextDueDate + per-vaccine confidence), confidence,
generatedAt }` for `immunization_record`/`vaccination_record` (`searchText` indexes vaccine
name/manufacturer/lot/provider), and a `BillingExtraction` `{ kind: "billing", recordType, provider,
date, serviceDescription, codes: BillingCode[] (code/system/description), amountCharged, amountPaid,
payer, denialReason, claimStatus: { status: "paid"|"denied"|"pending"|"partial"|"submitted"|
"unknown"; original }, confidence, generatedAt }` for `billing_record`/`insurance_claim` (`searchText`
indexes provider/service/codes/status/payer). Models live in
`src/backend/features/medical-records/immunization/` and `.../billing/`.

`extractedDataJson` is thus a discriminated union `ClinicalExtraction | MedicationExtraction |
ImagingExtraction | ProcedureExtraction | ImmunizationExtraction | BillingExtraction` (switched on
`kind`). All 21 classifiable types are now processable (`other` stays a classify-only catch-all).
Processing is dispatched by `processing.ts` (`processMedicalRecord`).

**Phase 7A (platform experience).** No processor/schema change — `extractedDataJson` is unchanged.
Three additions layer on top of the existing columns:

- **Filtering** — `GET /medical-records` now accepts a full `MedicalRecordFilters` object (see
  `api-contracts.md`); the `where`-builder maps `category`/`documentType` to `IN`,
  `physician`/`sourceName` to `contains`, `visitDate` to a range, `extractionConfidence` to a
  band, and `processed` to `summaryText IS (NOT) NULL` — no new columns.
- **Editing** — `updatedAt` (already `@updatedAt` on the model, previously unexposed) is now
  surfaced on the `MedicalRecord` TS type and returned by `PATCH /medical-records/:id`, which edits
  only `title/documentType/physician/sourceName/visitDate/notes/familyMemberId` — never
  `extractedDataJson`/`summaryText`/`searchText`/`fileUrl`.
- **Smart tags** — derived at read time from `documentType` + `extractedDataJson`
  (`src/backend/features/medical-records/tags.ts`), never stored — a group/family tag, a modality tag
  (imaging), status-enum tags (procedure outcome, claim status), and a small literal
  condition-keyword scan over clinical diagnosis sections. Not a column; recomputed on every read.

### saved_views

A user-named, saved Medical Records filter combination (Phase 7A §3), shown in the sidebar:
`userId`, `name`, `filterJson` (a serialized `MedicalRecordFilters` object, `Json`). New in this
phase (migration `20260713061326_add_saved_views`) — the one schema change Phase 7A needed.

### prescriptions

Prescription storage. Always owned by the patient (`userId`) so it appears in their own list
regardless of who wrote it. `prescribedById` optionally points to the doctor `User` who authored
it in-app (null for patient-entered prescriptions). `dailyVisitId` optionally points to the
`daily_visits` entry it was written under (`SetNull` — removing the queue entry never deletes the
prescription); doctors can write multiple prescriptions against the same visit (each "Prescribe"
adds a new one, it never overwrites) and can edit any prescription they authored via
`PATCH /doctor/prescriptions/:id`. `medicinesJson` is a JSON array; each entry
is `{ name, quantity?, doses: [{ slot: "morning"|"afternoon"|"evening"|"night", food: "before"|"after" }] }`.
`doses.length` is the per-day dose count; `quantity / doses.length` (rounded up) gives the course
length in days — computed on read (`src/backend/features/prescriptions/medicine.ts`), not stored. Legacy
records written before this schedule existed (`{ name }` only, no `doses`) still render as a
plain medicine name.

### lab_reports

Lab result storage. `extractedDataJson` (nullable JSON) holds AI-extracted structured values
(test name/value/unit/reference range/flag) written by `POST /ai/extract`; `summaryText` (already
existed) is written by `POST /ai/summary`. `extractionConfidence` (nullable Float, 0–100) records
the extraction-quality score of the on-upload metadata auto-fill (`POST /ai/analyze`), set at
create time and surfaced as the AI-confidence badge on the report. `extractedDataJson` mirrors the
latest `extraction_versions` row written by `POST /ai/extract` (`POST /ai/summary` persists raw OCR
but does not version, since it has no structured JSON to version — see `decision-log.md`). Same
Layer 1 `originalFilename`/`fileSizeBytes`/`sha256` columns as `medical_records`.

### reminders

Medicine and follow-up reminders. `prescriptionId` optionally points to the `prescriptions` row
that auto-generated it (`Cascade` — deleting the prescription deletes its generated reminders);
null for manually-created reminders. `doseSlot`/`doseFood` (nullable) record the originating
meal-slot + food-timing for prescription reminders, so a later meal-timing change can re-time a
row without regenerating the whole course. `retryCount`/`snoozedUntil` drive the dismiss/retry
policy (see below).

**Prescription reminders are individual instances, not a repeating row.** When a doctor creates or
edits a prescription, one reminder row is materialized **per course-day, per (medicine, dose slot,
food timing) triple** — e.g. a 5-day medicine dosed morning+night produces 10 rows — each with
`repeatType: "none"` and `courseEndDate: null`. A medicine with no `quantity` (course length
unknown) is skipped entirely; no open-ended reminders are generated.

**Scheduling never lands in the past, and the dose count is preserved by shifting forward, not
dropping.** For each dose, the first occurrence is that slot's clock time on the later of the
course's start day or the prescribed-at moment, rolled forward one day if that time has already
passed — then the full course (`durationDays` instances) runs forward from there. E.g. a 5-day
morning+night course prescribed at 3:00 PM skips today's already-passed 9 AM morning slot (starts
tomorrow) while tonight's 8 PM slot still fires today — 10 reminders total, none in the past. A
back-dated prescription (visit date days ago) shifts its **entire** course forward the same way,
rather than truncating days already gone. Titled `"<medicine name> — <time>"`,
`reminderType: "medication"`. The clock time is resolved per dose: the meal slot
(morning/afternoon/evening/night → breakfast/lunch/highTea/dinner) is anchored to the patient's own
`User.mealTimings` when set, else a fixed default (breakfast 9:00 AM, lunch 1:00 PM, high tea
5:00 PM, dinner 8:00 PM), then shifted by a before/after-food offset: **before food is always −30
minutes**; **after food** is per-meal (+10 breakfast, +15 lunch, +5 high tea, +15 dinner). A
medicine dosed both before and after the same meal gets two separate reminders, since they resolve
to different times (see `src/backend/features/reminders/prescription-reminders.ts`: `SLOT_TIMES`,
`AFTER_FOOD_OFFSET_MIN`, `BEFORE_FOOD_OFFSET_MIN`, `resolveDoseTime`, `buildPrescriptionReminders`).
Editing a prescription deletes and rebuilds all of its generated reminders in the same transaction
as the prescription write (loading the patient's current `mealTimings` at that moment), so they
never drift out of sync — see `syncPrescriptionReminders` in
`src/backend/features/reminders/reminders.service.ts`.

**Meal-timing changes re-time future instances in place — they don't regenerate the course.** When
a patient updates `User.mealTimings` (`PATCH /users/profile`), `reschedulePrescriptionReminders`
(same file) finds every still-`"active"` prescription reminder dated **tomorrow or later** that has
`doseSlot`/`doseFood` set, recomputes its clock time from the new timings via `resolveDoseTime`, and
updates just `scheduledAt`/`title` on that same calendar date — the number of rows and their dates
never change. Today's and past instances are left untouched; a preference change never rewrites
history. `User.mealTimings` also accepts `wakeUp`/`bedtime` alongside the four meal keys, but those
two are **display-only** — no dose slot maps to either, so they don't feed reminder generation yet.

**Dismiss uses a retry policy modeled on an SQS dead-letter queue.** `PATCH /reminders/:id` with
`{ dismiss: true }` never completes the reminder — it stays `status: "active"`, increments
`retryCount`, and sets `snoozedUntil` to 5 minutes later (`RETRY_DELAY_MS`/`MAX_RETRIES` in
`reminders.service.ts`). The `ReminderWatcher` re-fires the popup at `snoozedUntil` on its next
poll. After 2 retries, `snoozedUntil` goes back to `null` and the popup stops auto-firing for that
reminder, but it stays in the Active bucket — indefinitely if needed — until the patient explicitly
marks it done. A medication reminder is never silently completed.

**Prescription reminders are locked in the patient UI.** A reminder with a non-null
`prescriptionId` cannot be deleted (`deleteReminder` throws a `403` `ReminderError`) and can only be
marked done or dismissed once it's actually due — the "Upcoming" bucket hides the delete, complete,
and dismiss actions for these rows. Manually-created reminders (`prescriptionId: null`) keep full
patient control (edit via `PATCH`, delete, or mark done early) and aren't subject to the
dismiss/retry policy.

The reminders page buckets each reminder into **Active | Upcoming | Completed** for its filter
tabs (renamed from the earlier "Pending" label) — a client-side derivation (`classifyReminder` in
`reminder-schedule.ts`), not a stored status: `completed` = `status: "done"` (or `"cancelled"`);
`active` = a `status: "active"` reminder whose current occurrence is due/overdue and hasn't been
acknowledged (tapped an action on the toast, or the page's own acknowledge button — being merely
shown a toast doesn't count); `upcoming` = active-status and either not yet due or already
acknowledged. A dismissed-and-snoozed reminder stays in the Active bucket throughout its retries.
Acknowledgement is tracked client-side in `localStorage` (`sr:acknowledgedReminders`), separate
from `sr:shownReminders` (which only dedupes toast notifications). Buckets only ever move forward
(Upcoming → Active → Completed), never backward.

`courseEndDate` is always `null` on prescription reminders now that each course-day is its own
row (the course length is expressed by _how many rows_ were generated, not by a per-row end date);
the column and its auto-complete sweep remain live for any future use, but currently only apply to
manually-created reminders that set it directly (none do today via the UI). `completedAt` records
exactly when a reminder was marked `"done"` and anchors the 30-day retention window — a `"done"`
reminder is permanently deleted once `completedAt` is 30+ days in the past. Both the auto-complete
and the retention delete are swept on every `listReminders` call (`retireExpiredReminders` in
`reminders.service.ts`), so there's no separate cron job — any `GET /reminders` (from the page or
the `ReminderWatcher`) self-heals the table.

### timeline_events

Unified chronological health history.

### ai_insights

AI-generated summaries and explanations.

### audit_logs

Append-only trail of every AI operation (`action` e.g. `"ai.summary"`/`"ai.extract"`, the source
resource, which model ran, and how many identifiers were redacted). Deliberately has **no foreign
key to `users`** so the trail survives account deletion. Written once per AI gateway call
(`src/backend/features/ai/gateway.ts`) — see `architecture.md` → "AI layer".

### ocr_results

**Layer 2** of the three-layer document persistence (2026-07-14): the immutable raw output of one
OCR pass over a `medical_records`/`lab_reports` original file. Polymorphic `sourceType` (
`"medical_record" | "lab_report"`) + `sourceId` point at the parent record — same pattern as
`ai_insights`/`timeline_events` — rather than two separate tables per record type. Holds `rawText`,
`pagesJson` (blocks/lines/words/bboxes, only when the routed PaddleOCR service produced them —
`null` for the tesseract.js/PDF-text-layer fallback paths, never fabricated), `engine`/
`engineVersion`/`schemaVersion`, `ocrConfidence`, `durationMs`, and the OCR service's own
`requestId`/`jobId` when routed. Never updated — every OCR pass (every process call) inserts a new
row; never overwritten. **Never inlined into the parent record's own `GET :id` response** — only
reachable via its own dedicated, ownership-checked `GET .../:id/ocr-result` endpoint (same
ownership-check protection level as `extractedDataJson`, no additional encryption). Deleted
alongside its parent record (unlike `ai_insights`/`timeline_events`, which are left orphaned today —
raw OCR is more sensitive PHI, so cleanup-on-delete was added here).

### extraction_versions

**Layer 3** of the three-layer document persistence: one canonical-JSON snapshot per process call,
never overwritten. Same `sourceType`/`sourceId` pointer as `ocr_results`, plus `versionNumber`
(increments per source, unique on `[sourceType, sourceId, versionNumber]`), `schemaVersion`/
`extractorVersion` (so a future OCR engine or extractor change is traceable per version),
`extractedDataJson`/`summaryText`/`searchText`/`confidence` (the same shape written to the parent
record today), and `ocrResultId` linking back to the `ocr_results` row it was derived from. The
parent record's own `extractedDataJson`/`summaryText`/`searchText`/`extractionConfidence` columns
are always a mirror of the **latest** version, kept for backward-compatible reads — history is
reached via `GET .../:id/versions` and `GET .../:id/versions/:versionNumber`. This is the
`MedicalRecordVersion` table that Medical Records Phase 7A deferred to "Phase 7B" (see
`decision-log.md`), generalized to also cover `lab_reports`.

## Relationships

- A user has many family members
- A user has many medical records
- A user has many prescriptions
- A user has many lab reports
- A user has many reminders
- A user has many timeline events
- A user has many AI insights
- A user has many OCR results and extraction versions

## Future tables

- clinics
- hospitals
- lab_partners
- appointments
- subscriptions
- payments

## Rule

The patient must remain the center of the schema.
