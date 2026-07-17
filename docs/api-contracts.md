# API Contracts

> **Ownership note (added 2026-07-16):** this contract is implemented by the separate Laravel
> backend repo, `swathya-rakshak-backend/` — not by any code in this repo. Since the
> frontend/backend split (`627cddb`, `docs/decision-log.md` 2026-07-15/16), this file is a
> secondhand description of that repo's routes, kept here because the frontend (`src/backend/lib/
api-client.ts` + `src/backend/features/*.types.ts`) is written against it. It can drift the
> moment the backend changes a shape without a matching frontend PR — cross-check
> `swathya-rakshak-backend/routes/` directly if in doubt. The `/admin/*` and `/subscription/*`
> endpoints below were added for this sync (2026-07-16) because real frontend code already calls
> them (`ce27746`, 2026-07-15) even though they were previously undocumented and are of
> uncertain MVP scope — see `docs/progress.md` → Known Issues.

## Base rules

- REST API
- Versioned routes
- Predictable JSON responses
- Secure access checks for every private resource

## Base path

/api/v1

## Success response

{
"success": true,
"message": "Operation successful",
"data": {}
}

## Error response

{
"success": false,
"message": "Something went wrong",
"errors": []
}

## Auth endpoints

Identity is the **mobile number** (10-digit Indian format, starts 6-9). There is no email login.

Registration (Phone + Password, verified by OTP):

- POST /auth/register — body { fullName, phone, password, gender }; creates an unverified `role: "patient"` account, stores `gender` on `User.gender`, and sends an OTP. `gender` is required and must be `"male"`, `"female"`, or `"other"`.
- POST /auth/doctor/register — body { fullName, phone, password, specialization?, licenseNumber?, clinicName? }; creates an unverified `role: "doctor"` account (with a `DoctorProfile`) and sends an OTP
- POST /auth/register/verify — body { phone, otp }; activates the account (patient or doctor) and returns tokens. The access/refresh tokens and `GET /auth/me` response both carry `role`.

Login:

- POST /auth/login — option 1: body { phone, password }; returns tokens
- POST /auth/login/request-otp — option 2 step 1: body { phone }; sends a login OTP
- POST /auth/login/verify-otp — option 2 step 2: body { phone, otp }; returns tokens

Session:

- POST /auth/logout — requires a valid access token
- POST /auth/refresh — body { refreshToken }; returns a new token pair
- GET /auth/me — requires a valid access token; returns the current user

OTP rules: 6-digit code, 5-minute expiry, 5 attempts, single-use, 60-second resend cooldown.
In non-production the OTP is returned as `data.devCode` (the `console` SMS provider also logs it);
in production it is sent only by SMS.

## User endpoints

- GET /users/profile — returns `{ id, fullName, phone, dateOfBirth, gender, profilePhoto, bloodGroup, mealTimings, aiConsent }` (`aiConsent` is a boolean — whether `User.aiConsentAt` is set).
- PATCH /users/profile — body { fullName?, dateOfBirth?, gender?, bloodGroup?, mealTimings?, aiConsent? }.
  `aiConsent: true` grants AI-processing consent (sets `aiConsentAt` to now), `false` revokes it (clears to null); omitting it leaves consent unchanged. This is how the app grants/revokes AI consent (point-of-use modal on Lab Reports, or the profile "AI Processing" toggle).
  `mealTimings` is `{ wakeUp?, breakfast?, lunch?, highTea?, dinner?, bedtime? }`, each an optional
  `"HH:MM"` (24-hour) string; provided keys are merged into the existing `mealTimings` object
  (omitted keys are left unchanged, not cleared). The four meal keys drive medicine reminder
  scheduling — see `database-schema.md` → `reminders` — and a change to them **reschedules every
  still-active prescription reminder dated tomorrow or later** (today's/past instances are never
  touched). `wakeUp`/`bedtime` are stored and shown on the profile but don't yet affect scheduling.
  This same body shape is also used by the optional one-time onboarding step shown right after
  registration (`/register` step 3 of 3) — no separate endpoint.

## Family endpoints

Implemented as of Medical Records Phase 7A (previously a `501` stub; the `FamilyMember` Prisma
model already existed). `userId`-scoped, same ownership + response-contract pattern as every other
feature.

- GET /family-members — lists the caller's own family members, oldest-created first.
- POST /family-members — body `{ name, relationship, dateOfBirth?, gender?, bloodGroup? }`
  (`dateOfBirth` accepts a plain `"YYYY-MM-DD"`, same `dateString` validator used elsewhere).
- PATCH /family-members/:id — same body, all fields optional.
- DELETE /family-members/:id — 404s (not 403) if the id isn't the caller's own, to avoid leaking
  existence.

## Medical record endpoints

- GET /medical-records — advanced filtering (Phase 7A), all combinable, built from
  `src/backend/features/medical-records/filters.ts` (`MedicalRecordFilters`) via `parseFilters` on the
  query string: `?search=` (case-insensitive `contains` across `title`/`physician`/`sourceName`/
  the denormalized `searchText` index), `?familyMemberId=`, `?documentType=a,b` (comma-separated,
  `IN`), `?category=a,b` (comma-separated `DocGroup` values, `IN`), `?physician=` / `?facility=`
  (contains, maps to `sourceName`), `?dateFrom=` / `?dateTo=` (`visitDate` range, `YYYY-MM-DD`),
  `?confidence=high|review|low` (bands: ≥85 / 60–84 / <60, matching `ConfidenceBadge`),
  `?processed=processed|unprocessed` (`summaryText` not-null / null), `?sortBy=createdAt|visitDate|updatedAt`
  (default `createdAt`, always most-recent-first). The `where`-builder (`buildWhere`, exported +
  unit-tested) lives in `medical-records.service.ts`; the filter _shape_ itself is client+server
  safe so the same type drives the URL-state hook, the API, and Saved Views' `filterJson`.
- POST /medical-records — body `{ title, fileUrl, fileType, category?, documentType?, physician?, extractionConfidence?, familyMemberId?, thumbnailUrl?, sourceName?, visitDate?, notes?, originalFilename?, fileSizeBytes?, sha256? }`.
  `category` is optional — when `documentType` is set and `category` is omitted, `category` is
  derived from the `document-types.ts` registry group (`groupFor`). The last three fields are Layer
  1 (original-file) metadata from the `/upload` response — optional/additive, see
  `database-schema.md` → `medical_records`.
- GET /medical-records/:id — single record with its file resolved to a signed URL (download source).
- PATCH /medical-records/:id — **record editing (Phase 7A)**: metadata only — body
  `{ title?, documentType?, physician?, sourceName?, visitDate? (nullable), notes?, familyMemberId? (nullable) }`.
  `familyMemberId: null` / `visitDate: null` explicitly clear the field (vs. omitting, which leaves
  it unchanged). Changing `documentType` re-derives `category`. **Never** edits
  `extractedDataJson`/`summaryText`/`searchText`/`fileUrl` — those are only written by
  `POST /:id/process`. Returns the updated record (now including `updatedAt`).
- DELETE /medical-records/:id — also deletes the stored file (best-effort) and its
  `ocr_results`/`extraction_versions` history.
- POST /medical-records/:id/process — **on-demand processing** (Phase 2–5). OCRs the stored file
  **once**, then dispatches (`processing.ts`) by `documentType` to the matching processor family,
  making two gateway LLM calls (structured extraction, then a patient-friendly summary) and
  persisting `extractedDataJson`, `summaryText`, and `searchText`; returns the updated record.
  **Request/response shape unchanged since the three-layer persistence change (2026-07-14)** — under
  the hood, each call now also inserts an immutable `ocr_results` row (Layer 2) and appends a new
  `extraction_versions` row (Layer 3, `versionNumber` + 1) rather than overwriting in place; the
  three columns above are mirrored from that new version. History: `GET :id/versions` /
  `GET :id/versions/:versionNumber`; raw OCR: `GET :id/ocr-result` (see below).
  - **Clinical** (`doctor_note`, `consultation_note`, `history_physical`, `diagnosis`,
    `treatment_plan`, `discharge_summary`, `referral_note`, `clinician_note`) → `ClinicalExtraction`
    (`kind: "clinical"`, named narrative sections; the last five are config-only registry entries).
  - **Medication** (`prescription`, `medication_list`) → `MedicationExtraction`
    (`kind: "medication"`, one `MedicationItem` per drug with strength/dosage/frequency/status/…;
    `searchText` indexes medication names so `?search=` finds them).
  - **Imaging** (`xray_report`, `mri_report`, `ct_report`, `ultrasound_report`) → `ImagingExtraction`
    (`kind: "imaging"`; radiology sections + `findings[]`/`measurements[]`/ordered `impression[]`/
    `recommendations[]`/`normalFindings[]`/`regions[]`; each finding carries a cautious plain-language
    `explanation` + `sourceText`; `searchText` indexes findings/impression/regions/modality).
  - **Procedure** (`procedure_note`, `surgery_report`) → `ProcedureExtraction` (`kind: "procedure"`;
    procedure/surgeon/facility/anesthesia/etc. + ordered `steps[]`, `devices[]`, `specimens[]`,
    `intraoperativeFindings[]`, `complications[]` (never inferred), `postOpInstructions[]`,
    `followUp[]`, and a normalized `outcome` (`{ status, original }`); `searchText` indexes
    procedure/surgeon/devices/complications/outcome).
  - **Immunization** (`immunization_record`, `vaccination_record`) → `ImmunizationExtraction`
    (`kind: "immunization"`; a `vaccines[]` table of name/doseNumber/date/manufacturer/lotNumber/
    route/site/provider/nextDueDate + per-vaccine confidence; `searchText` indexes vaccine
    name/manufacturer/lot/provider).
  - **Billing / administrative** (`billing_record`, `insurance_claim`) → `BillingExtraction`
    (`kind: "billing"`; provider/service/`codes[]` (CPT/HCPCS/ICD)/amountCharged/amountPaid/payer/
    denialReason + a normalized `claimStatus` (`{ status, original }`); `searchText` indexes
    provider/service/codes/status/payer).
    `extractedDataJson` is a discriminated union on `kind`. All 21 classifiable types are
    processable; `other` returns `400` (classify-only catch-all). Same AI error codes as the
    `/ai/*` endpoints (`403` no consent, `422` unparseable, `502`/`503` LLM/NER unavailable). Each
    family shares one config-driven base (`clinical/*`, `medication/*`, `imaging/*`, `procedure/*`,
    `immunization/*`, `billing/*`); adding a type is one registry entry.
- GET /medical-records/:id/ocr-result — **three-layer persistence (2026-07-14).** The latest raw
  OCR pass (Layer 2: `rawText`, `pagesJson`, engine/confidence/provenance). Ownership-checked like
  every other private resource; `404` if the record hasn't been processed yet. Never embedded in
  `GET /medical-records/:id` — raw OCR is only reachable through this dedicated endpoint.
- GET /medical-records/:id/versions — history of canonical-extraction versions (Layer 3), newest
  first: `{ id, versionNumber, schemaVersion, extractorVersion, kind, confidence, createdAt }` per
  entry (no `extractedDataJson`/`summaryText` — use the endpoint below for a specific version's
  full content).
- GET /medical-records/:id/versions/:versionNumber — one historical version's full
  `extractedDataJson`/`summaryText`/`searchText`. `404` if that version doesn't exist.

## Saved views endpoints (Phase 7A)

A user-named, saved Medical Records filter combination, shown in the dashboard sidebar under the
Medical Records nav item. New `SavedView` table (migration `20260713061326_add_saved_views`).

- GET /saved-views — lists the caller's own saved views, oldest first.
- POST /saved-views — body `{ name, filterJson }` where `filterJson` is a `MedicalRecordFilters`
  object (validated permissively — it's a client-built filter snapshot, not a query-execution
  boundary; the list service only ever reads recognized keys off it).
- DELETE /saved-views/:id — 404s if not the caller's own.

## Prescription endpoints

- GET /prescriptions — the caller's own prescriptions (includes `prescribedByName` when a connected doctor authored it)
- POST /prescriptions — patient adds their own prescription record
- DELETE /prescriptions/:id

## Doctor↔patient connection endpoints

Connections model a many-to-many doctor/patient relationship: a doctor sees every patient
they've requested, a patient sees every doctor who's requested them — each side only sees its
own rows. A connection must be `"accepted"` before the doctor can prescribe to that patient.

- GET /connections — role-aware: doctors get patient-side info, patients get doctor-side info
- POST /connections — doctor-only; body { patientPhone }; creates/reopens a `"pending"` request
- PATCH /connections/:id — patient-only; body { status: "accepted" | "rejected" }

## Doctor endpoints

- GET /doctor/profile — doctor-only; the caller's `DoctorProfile`
- PATCH /doctor/profile — doctor-only; body { specialization?, licenseNumber?, clinicName? }
- GET /doctor/patients — doctor-only; patients with an `"accepted"` connection
- GET /doctor/prescriptions — doctor-only; prescriptions authored by the caller
- POST /doctor/prescriptions — doctor-only; body { patientId, dailyVisitId?, doctorName?, hospitalName?, visitDate?, medicinesJson?, diagnosis?, attachmentUrl? }; requires an accepted connection with `patientId`. `medicinesJson` is `Array<{ name, quantity?, doses?: Array<{ slot: "morning"|"afternoon"|"evening"|"night", food: "before"|"after" }> }>` — `quantity`/`doses` are optional so legacy free-text entries still validate. The prescription is owned by the patient and appears automatically in their `GET /prescriptions`. Additive — prescribing again for the same patient/visit creates a new record rather than overwriting.
- PATCH /doctor/prescriptions/:id — doctor-only; same body shape (minus `patientId`/`dailyVisitId`, which never change); only the caller's own authored prescriptions (`prescribedById` match) can be edited.
- DELETE /doctor/prescriptions/:id — doctor-only; only the caller's own authored prescriptions (`prescribedById` match) can be deleted, and only if the prescription's `visitDate` is today or in the future (or unset) — a past visit's prescription returns `403` and can't be deleted. Deleting cascades to that prescription's auto-generated `Reminder` rows.

## Doctor daily-visit (Patient List) endpoints

Lets a doctor run a per-day patient list with sequential token numbers, so patients who share a
name are disambiguated by token + phone instead of a name-only picker. The day is selectable (not
just today) via `date`. Requires an accepted connection with the patient.

- GET /doctor/daily-visits?date=YYYY-MM-DD — doctor-only; the list for that day (default: today), ordered by `tokenNumber`, each entry including its `prescriptions` (drives the prescribed/unprescribed badge state)
- POST /doctor/daily-visits — doctor-only; body { patientId, date? }; adds the patient to that day's list (default: today), assigning the next sequential token (idempotent — re-adding the same patient on the same day returns their existing token and prescriptions)
- DELETE /doctor/daily-visits/:id — doctor-only; removes an entry from the caller's list

## Lab report endpoints

- GET /lab-reports — returns the caller's reports; each includes `summaryText` and
  `extractedDataJson` (the persisted AI summary / structured extraction), so a previously-analysed
  report shows its results (incl. the reference-range view) on load without re-running the AI.
- POST /lab-reports — body includes optional Layer 1 (original-file) metadata from the `/upload`
  response: `originalFilename?, fileSizeBytes?, sha256?` (same fields as `POST /medical-records`).
- DELETE /lab-reports/:id — also deletes its `ocr_results`/`extraction_versions` history.
- GET /lab-reports/:id — single report with its file resolved to a signed URL (download source).
- GET /lab-reports/:id/ocr-result — **three-layer persistence (2026-07-14).** Same as the
  medical-records endpoint above: latest raw OCR pass, never embedded in `GET :id`.
- GET /lab-reports/:id/versions / GET /lab-reports/:id/versions/:versionNumber — canonical-JSON
  extraction history written by `POST /ai/extract`. Note: `POST /ai/summary` persists raw OCR
  (Layer 2) but does not append a version, since it produces only `summaryText`, not structured
  JSON — see `decision-log.md` (2026-07-14).

## Reminder endpoints

- GET /reminders — as a side effect, also auto-marks any reminder past its `courseEndDate` as
  `"done"` and permanently deletes any `"done"` reminder whose `completedAt` is 30+ days old,
  before returning the list (see `database-schema.md` → `reminders`). Each row also carries
  `prescriptionDiagnosis` (its prescription's diagnosis note, or `null`) for display in the
  notification popup.
- POST /reminders
- PATCH /reminders/:id — setting `status: "done"` also stamps `completedAt`; setting it back to
  any other status clears `completedAt`. `{ dismiss: true }` is a separate, mutually-independent
  action: it never changes `status`, but bumps `retryCount` and sets `snoozedUntil` to 5 minutes
  later (up to `MAX_RETRIES` = 2 times, after which `snoozedUntil` goes back to `null`) — an
  SQS-DLQ-style redrive so a medication reminder never silently completes just because it was
  dismissed (see `database-schema.md` → `reminders`).
- DELETE /reminders/:id — `403`s if the reminder has a non-null `prescriptionId`: prescription
  reminders are system-managed and can only be completed or dismissed (via `PATCH`), never deleted
  or edited by the patient. Manually-created reminders (`prescriptionId: null`) delete normally.

## Timeline endpoint

- GET /timeline

## Patient Intelligence endpoints (Phase 7B)

- GET /patient-intelligence/profile?familyMemberId? — the caller's longitudinal `PatientProfile`,
  aggregated **on read** from `listMedicalRecords` (same pattern as `/timeline`) — no stored
  profile table, no OCR, no LLM call. Buckets records by `extractedDataJson.kind` (not
  `category`/`group` — immunization types are grouped `clinical` but keyed `immunization`) and
  returns: `conditions[]` (documented-condition timelines, reusing `tags.ts`'s `CONDITION_KEYWORDS`),
  `medications[]` (cross-record status timeline: started/changed/dose_modified/stopped/current/
  discontinued/unknown), `imaging[]`/`procedures[]`/`vaccinations[]` (grouped histories),
  `recentHospitalizations`/`recentVisits`/`providers`/`facilities`/`followUps`/`recentRecords`,
  `episodes[]` (deterministic time+entity clustering — a "pattern", not a fact), `links[]`
  (deterministic cross-record links above a confidence threshold), and `insights[]` (deterministic
  observations, e.g. "Hypertension appears in N records"). Every item carries a `provenance`:
  `"fact"` (read straight from structured extraction) or `"pattern"` (computed here) — never
  `"ai_summary"` this phase. **Deferred to the next phase**: an LLM-based AI Patient Summary
  (would route through the existing `runGateway` consent→redact→LLM→audit gateway, cached as an
  `AiInsight` with `sourceType: "patient"`) and a version compare/restore UI over the existing
  `ExtractionVersion` table. See `docs/decision-log.md`.

## AI endpoints

Both endpoints run every call through a redaction gateway before any text reaches the LLM (see
`architecture.md` → "AI layer") and require the caller to have granted AI-processing consent
(`User.aiConsentAt` set) — otherwise they return `403`. Consent is granted/revoked via
`PATCH /users/profile { aiConsent }` (surfaced as a point-of-use modal on the Lab Reports page and
a toggle on the profile). Source text is extracted from PDFs (text layer, else self-hosted OCR) and
images (OCR) — so photographed/scanned reports are supported.

- POST /ai/summary — body `{ sourceType: "lab_report" | "medical_record", sourceId, familyMemberId? }`;
  generates a cautious summary of the caller's own document (ownership-checked) and returns the
  created `AiInsight`. For a `lab_report` source, the summary is **structured markdown** — fixed
  `## Overall Summary` / `## Key Findings` / `## Abnormal Results` / `## Normal Results` /
  `## Follow-up` sections (see `ai.service.ts`'s `LAB_SUMMARY_SYSTEM`) — and is also written into
  that report's `summaryText`. A `medical_record` source still gets the original free-form
  3-5-sentence plain-language summary. Persists the OCR pass as a Layer-2 `ocr_results` row
  regardless of `sourceType`; does not append an `extraction_versions` row (no structured JSON).
- POST /ai/extract — same body shape; extracts structured data (test name/value/unit/reference
  range/flag) as JSON and returns the created `AiInsight`. For a `lab_report` source, also writes
  the parsed JSON into that report's `extractedDataJson` **and** appends a new Layer-3
  `extraction_versions` row (`kind: "lab"`) linked to the Layer-2 `ocr_results` row it read from.
- POST /ai/analyze — body `{ fileUrl }` (a path from `POST /upload`, before the report is saved).
  OCRs the file through the same consent→redact→LLM→audit gateway and returns
  `{ testName, labName, reportDate, documentType, confidence, lowConfidenceFields[] }` to
  auto-fill the Add-Lab-Report form. No record is created; the caller persists the chosen values
  (plus `extractionConfidence`) via `POST /lab-reports`. Same error codes as summary/extract.
- POST /ai/classify — body `{ fileUrl }` (a path from `POST /upload`, before the record is saved).
  The Medical-Records equivalent of `/ai/analyze`: OCRs the file through the same gateway, then
  classifies its document type against the `document-types.ts` registry and extracts general
  metadata. Returns
  `{ documentType, title, facility, physician, recordDate, confidence, lowConfidenceFields[] }` —
  `documentType` is a registry key or `null` if the AI couldn't confidently classify it (the
  Add-Medical-Record form falls back to manual type selection). No record is created; the caller
  persists the chosen values via `POST /medical-records`. Same error codes as summary/extract.
- Errors: `403` (no AI consent), `404` (source not found / not owned by caller), `422` (the AI
  returned output that couldn't be parsed as JSON — `extract` only), `502` (the LLM service is
  unavailable), `503` (name-redaction NER configured but unreachable — fails closed so no
  un-redacted name reaches the LLM), `500` (any other unexpected error, returned as JSON — never a
  bare body).

## File upload

- POST /upload

## Subscription endpoints (⚠️ beyond original MVP scope — see `progress.md` → Known Issues)

Added 2026-07-15 (`ce27746`), documented here for the first time 2026-07-16 — no prior
decision-log entry exists for this feature.

- GET /subscription/plans — lists available plans (`SubscriptionPlan[]`: code `free|individual|family`, price, billing interval, features).
- POST /subscription/checkout — body `{ planCode }`; returns a `CheckoutResult` (`orderId`, amount, provider, `paymentId`). A mock payment gateway auto-approves in this pilot; a real gateway (e.g. Razorpay) would collect payment via a widget between checkout and confirm.
- POST /subscription/confirm — body `{ orderId }`; finalizes the subscription after checkout.
- POST /subscription/cancel — cancels the caller's active subscription.

## Admin endpoints (⚠️ beyond original MVP scope — see `progress.md` → Known Issues)

Added 2026-07-15 (`ce27746`), documented here for the first time 2026-07-16. Role-gated to
`role: "admin"` (see `AuthUser.role` in the Auth section above, which also now includes `"admin"`
alongside `"patient"`/`"doctor"`).

- GET /admin/metrics — dashboard summary metrics for the admin home page.
- GET /admin/users?query= — lists users (`AdminUserSummary[]`), optionally filtered.
- GET /admin/users/:id — a single user's detail (`AdminUserDetail`: subscription state + record counts, whitelisted fields only — "never a health table" per the type's own comment).
- POST /admin/users/:id/suspend / POST /admin/users/:id/reactivate — toggles account suspension.
- POST /admin/users/:id/impersonate — returns a short-lived, redaction-forced impersonation access token (`ImpersonationResult`) so an admin can view the app as that user for support purposes; every PHI response during impersonation is redacted and audited server-side per the type's own comment. No refresh token is issued for an impersonation session (must be re-initiated if it expires).
- GET /admin/plans — lists all plans (including inactive) for management.
- PATCH /admin/plans/:id — body `{ unitPriceInPaise? , isActive? }`; updates a plan's price or active flag.
- GET /admin/subscriptions — lists all subscriptions (`AdminSubscriptionRow[]`) across users.
- POST /admin/subscriptions/:id/cancel — admin-initiated cancellation of a user's subscription.
- GET /admin/payments — lists payments (`AdminPaymentRow[]`).
- POST /admin/payments/:id/refund — issues a refund for a payment.
- GET /admin/audit-log — lists `AuditLogRow[]` (admin actions/audit trail).

## Security rules

- Validate ownership on every private resource
- Do not expose raw private file URLs
- Use signed access where needed
- Protect all private endpoints
