# Feature Flows

## 1. Onboarding flow

User enters name + mobile + password + gender -> receives OTP -> verifies OTP -> account activated, tokens
issued -> an optional **step 3 of 3** offers to set daily meal timings (wake-up, breakfast, lunch,
high tea, dinner, bedtime) via the same `PATCH /users/profile { mealTimings }` the Profile page
uses -> **Save & continue** persists them and enters the dashboard; **Skip for now** enters the
dashboard without saving. Returning users log in with phone+password or phone+OTP. Other profile
details (DOB, blood group) are still filled in later from the Profile page; gender is captured during
signup and can be edited later from Profile.

## 2. Upload flow

User uploads a report -> system stores file -> timeline updates

## 3. Timeline flow

User opens timeline -> sees all events in chronological order

## 3b. Patient Intelligence flow (Phase 7B)

User opens Health Profile -> `GET /patient-intelligence/profile` aggregates the caller's own
processed medical records **on read** (same "computed from records, not stored" pattern as the
Timeline flow above) -> conditions/medications/imaging/procedures/vaccinations/follow-ups/insights/
episodes/record-links are all derived deterministically from `extractedDataJson` — no OCR, no LLM
call. Every item on the page carries a **Fact** or **Pattern** badge so the patient can tell a
documented value (e.g. a diagnosis read from a record) from a computed observation (e.g. "3 MRI
studies of the lumbar spine") -> switching the family-member selector re-scopes the whole profile,
same as every other family-scoped page. An **AI Patient Summary** narrative and a version
compare/restore view are deferred to a follow-up phase (see `docs/decision-log.md`).

> **⚠️ As of `ce27746` (2026-07-15), this page is wrapped in `PlanGate` and requires a paid-plan
> entitlement** — a user without it sees an upsell card instead of their profile. This paywall has
> no decision-log entry explaining it and is flagged as scope-uncertain in `docs/progress.md` →
> Known Issues, not documented here as settled product behavior.

## 4. Family flow

User adds family member -> records can be linked to that person

## 5. Reminder flow

User creates a reminder (or a doctor's prescription generates one — see §9) -> a dashboard-wide
watcher polls `GET /reminders` every 30s -> once a reminder's fire time has passed (`scheduledAt`
for a reminder that hasn't been dismissed yet, or `snoozedUntil` after a dismiss — see below) and
it is still `"active"`, an in-app slide-in toast (top-right, below the dashboard nav, MS
Teams-style) surfaces it with the medicine name, dose (slot + before/after food), scheduled time,
and the prescription's diagnosis note if any, plus **Mark done** (`PATCH` status to `"done"`) and
**Dismiss** actions -> already-shown reminders are tracked in `localStorage` so a page reload does
not re-pop them; tapping a toast action separately records the occurrence as **acknowledged** (a
different `localStorage` key), which is what actually clears a recurring manual reminder from the
reminders page's "Active" tab. This is in-app only for now; SMS/push/mobile delivery is deferred
(see `decision-log.md`).

**Dismiss never completes a reminder — it retries, SQS-DLQ-style.** `PATCH /reminders/:id { dismiss:
true }` keeps the reminder `"active"`, bumps `retryCount`, and snoozes it 5 minutes
(`snoozedUntil`); the watcher re-fires the popup at that time. After 2 retries the reminder simply
stays in the Active tab — indefinitely — until the patient taps "Mark done". A medication reminder
can never be silently completed by ignoring it. This retry policy applies to non-recurring
reminders (every prescription dose, and one-time manual reminders); recurring manual reminders
keep their existing per-occurrence Taken/Dismiss behavior.

The reminders page shows three tabs — **Active | Upcoming | Completed** (renamed from "Pending").
Active surfaces reminders that are due/overdue right now and haven't been acknowledged/completed
yet (e.g. two morning medicine reminders the patient hasn't tapped "Taken" on since they woke up,
or a dismissed reminder still awaiting a retry) — the page also offers a direct acknowledge
(checkmark) action on each active card for recurring reminders, and **Mark done** + **Dismiss**
for non-recurring ones, not just via the toast. A reminder only ever moves forward — Upcoming ->
Active -> Completed — never backward. Upcoming and Completed are otherwise unchanged from before.

Each tab paginates client-side, 7 reminders per page, with its own independent page position (so
switching tabs doesn't lose your place) and a Previous/Next bar shown once a tab exceeds 7 items.
The list area's height is measured (grow-only, from the tallest page the list has actually
rendered) rather than guessed, so the pagination bar stays in a fixed position whether the current
page has 1 reminder or 7 — no layout jump when the last page of a tab is partially filled. This is
UI-only: `GET /reminders` still returns the full unpaginated list.

Medicine reminder times are anchored to the patient's own meal timings (optional, set during
onboarding or on the Profile page's "Daily Routine" section: breakfast/lunch/high tea/dinner —
`wakeUp`/`bedtime` are also collected but don't feed scheduling yet) rather than a single fixed
clock time per meal slot — see `database-schema.md` → `reminders` for the exact before/after-food
offset math. A patient who hasn't set a custom time for a given meal still gets the original fixed
default for that meal. If the patient later changes a meal time, every still-active prescription
reminder dated tomorrow or later has just its clock time adjusted to match (same calendar date,
same row count); today's and past instances are left exactly as they were.

Prescription reminders are **individual, pre-generated instances** (one row per course-day per
dose), not a single repeating reminder — a 5-day, twice-daily medicine creates 10 rows up front.
Scheduling never lands in the past: a dose slot whose clock time has already passed today is
skipped for today and the whole course shifts to start from the next occurrence of that slot,
without losing a dose — e.g. a course prescribed at 3 PM starts its night dose today but its
morning dose tomorrow, still 5 mornings + 5 nights. They're also **system-locked**: while
Upcoming, a patient can't edit, delete, or mark one done early; once a reminder becomes due
(Active), the only actions available are Mark done and Dismiss. Manually-created reminders are
unaffected by any of this — full edit/delete/early-complete control, same as before, and no
dismiss/retry snoozing.

## 6. AI summary flow

**AI-assisted upload (metadata auto-fill).** When the user picks a lab report file — PDF or a
**photo** (JPG/PNG/JPEG, incl. mobile camera capture) — in the Add-Lab-Report modal, it is uploaded
and then `POST /ai/analyze { fileUrl }` runs **before the report is saved**: same gateway as below
(consent-gated; the consent modal appears here if not yet granted), OCR + LLM extract the report's
metadata, and the modal auto-fills Test Name, Lab Name, and Report Date (all editable) while a
staged loader plays. The response carries an extraction-confidence score (shown as a 🟢/🟡/🔴 badge)
and flags any low-confidence field with a "please verify" hint; Report Date defaults to today when
not confidently detected (a redacted date reads as absent — see `progress.md`). Because the LLM
sees only redacted text, the lab/facility name and dates are corrected deterministically from the
raw on-box OCR text (`letterhead.ts` — letterhead org line wins; address-like answers are nulled
and flagged instead of shown; printed dates normalized day-first to YYYY-MM-DD). The same
correction applies to the Add-Medical-Record classify flow (`/ai/classify`): facility from the
letterhead, physician from the last non-"Ref. by" "Dr." line, and a synthesized
"<Type> — <facility>" title when the model leaves it blank. The Status dropdown
was removed. On Save, the chosen values plus `extractionConfidence` are persisted via
`POST /lab-reports`.

**Summarize / Extract (on a saved report).** The user taps **Summarize** / **Extract data** on a
report card (or calls the API directly). `POST /ai/summary` with `{ sourceType, sourceId }` ->
gateway checks the user has granted
AI-processing consent (`403` if not — the UI then shows a consent modal; Allow calls
`PATCH /users/profile { aiConsent: true }` and replays the action; consent is also managed on the
profile "AI Processing" toggle) -> the report's file is read and its text extracted (PDF text layer, else
self-hosted OCR `eng+hin`; photos and scanned PDFs are OCR'd on-box, see `ai-architecture.md`) ->
identifiers (names, phone, Aadhaar, PAN, ABHA, dates, email) are redacted
before the text is sent to the LLM -> the LLM's cautious response has identifiers restored (for a
lab report, a structured markdown summary — Overall Summary / Key Findings / Abnormal Results /
Normal Results / Follow-up; for a medical record, a short plain-language paragraph) -> saved as an
`AiInsight` and (for a lab report) into `summaryText`. The lab-report summary markdown is then
parsed client-side (`parse-summary.ts`) into a structured card view — report header (with the
confidence badge and a Normal/Review result badge), overall status, key findings, abnormal cards,
normal chips, follow-up, disclaimer, and an action bar (View Original / Download Summary PDF /
Regenerate) -> user sees summary. The expanded report card is a **tabbed workspace**
(`LabReportCard.tsx`) with an **AI Summary | Lab Values** toggle: the summary is the primary tab and
the extracted values are the second; the card is collapsed by default behind a toggle (expand state
persisted per report in `localStorage`), and it opens when either a summary or extracted data
exists. While a summary generates, an animated step checklist (`SummaryProgress`) plays in place of
the panel. **Download Summary** exports a formatted **PDF** (`summary-pdf.ts`, built with jsPDF —
title/lab/date, sections, bullets, page breaks, per-page disclaimer footer), not Markdown.
`POST /ai/extract` follows the same flow but asks the LLM for structured JSON (test values) instead
of prose; when the routed OCR service handled the document, the LLM rows are first **repaired
against its deterministic extraction** (`reconcile-tests.ts` — recovers a value the LLM misread as
a flag letter, fills missing units/ranges; exact-name matches only, never overwrites a parseable
LLM number). The result is saved into `extractedDataJson` and rendered in the **Lab Values** tab as
a compact, searchable/filterable table (`ExtractedValuesTable.tsx`) — one row per biomarker
(Test · Result · Reference Range · Status), abnormal/review rows sorted to the top, a report-level
"Extraction quality" badge, and an info-icon hover tooltip on unverified or no-range values. A
correctly-extracted value whose report prints **no reference range** (derived ratios like TG/HDL)
lands in a calm "No range printed" state that counts toward the quality score; only garbled/
unreadable values count against it, and a lone flag letter extracted as a value is deterministically
moved to the flag (`sanitizeTest`). Both
`summaryText` and `extractedDataJson` are returned by `GET /lab-reports`, so a previously-analysed
report shows its results on load without re-running the AI. See `architecture.md` → "AI layer" for
the redaction gateway design.

## 7. Doctor onboarding flow

Doctor registers via a separate `/doctor/register` page (name + mobile + password + optional
specialization/license/clinic) -> receives OTP -> verifies OTP -> account activated with
`role: "doctor"` -> redirected to the doctor dashboard (`/doctor`) instead of the patient dashboard.

## 8. Doctor↔patient connection flow

Doctor adds a patient by mobile number (`/patients`) -> a `"pending"` connection request is
created -> patient sees the request on `/my-doctors` and accepts or rejects it -> only on
acceptance can the doctor prescribe to that patient. Each side only ever sees its own
connections (a doctor never sees another doctor's patients, and vice versa).

## 9. Doctor prescribing flow

Doctor opens `/doctor-prescriptions`, which shows a **Patient List** for a selected date (a date
picker in the header, defaulting to today) -> "Add patient" opens a searchable popup over
connected (accepted) patients (by name/phone), with an "Add to list" action (silent add) and a
"Prescribe" action (add + immediately open the prescription form) -> adding assigns a sequential
token for that day, disambiguating patients who share a name -> each patient's box shows their
token (blue = not yet prescribed that day, **green** = has at least one prescription) and, once
prescribed, a compact medicine summary -> **clicking a box** opens the full prescription view if
already prescribed, or the prescribe form if not; a separate **"Prescribe" button on the box**
always opens a fresh prescription form regardless of prior prescriptions (prescribing is
additive — earlier prescriptions for that visit are never overwritten) -> the form opens with the
patient, hospital name (pre-filled from the doctor's `DoctorProfile.clinicName`), and visit date
(defaults to the selected date) already set -> doctor adds medicines via a structured editor:
name, quantity, and a per-meal-slot (morning/afternoon/evening/night) dose schedule with its own
before/after-food timing -> on save, the record is saved under the **patient's** account with
`prescribedById` set to the doctor and `dailyVisitId` linking it to that list entry -> it appears
immediately in the patient's own `/prescriptions` page, tagged "Prescribed by Dr. X", showing the
dose schedule and computed course length (e.g. quantity 10 at 2 doses/day -> "5-day course"), and
in the doctor's full prescription view for that visit, where each prescription has an **"Edit"**
action (opens the same form pre-filled, `PATCH`-ing the existing record instead of creating a new
one). Re-adding a patient to the same day's list returns their existing token rather than creating
a duplicate; token numbering is scoped per calendar day, so switching the date picker shows/starts
a separate list.

## Principle

Every feature must support the main goal: help the user understand and manage health data in one place.
