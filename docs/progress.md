# Project Progress

Last updated: 2026-07-17

## ⚠️ Architecture change since the last sync (2026-07-15/16, undocumented until now)

Two commits landed on this branch without a matching `docs/`/`decision-log.md` update:

- **`627cddb` "feat: clean frontend by removing backend deps"** — this repo is now genuinely
  **frontend-only**. Everything that used to live here — `prisma/schema.prisma`, every
  `src/app/api/v1/*/route.ts` handler, `middleware.ts`, all `*.service.ts`/`*.schema.ts` business
  logic, the AI gateway/redaction/OCR pipeline, `scripts/mock-llm-server.js`, and the manual
  `howtos/` verification guides — was deleted from this repo. The API is now a **separate Laravel
  application** in the sibling repo `swathya-rakshak-backend/` (real `app/Models`, `app/Http`,
  `routes/`, `database/migrations/` confirmed present there). This matches `CLAUDE.md`'s current
  instructions, but every doc below still described the old Next.js-monolith architecture (Prisma,
  JWT/middleware in this repo, etc.) until this sync.
- **`ce27746` "feat: scoped ownership"` (2026-07-15)** — added a full **admin panel**
(`src/app/(admin)/admin/{page,layout,users,plans,subscriptions,audit}.tsx`) and a **subscription/
billing system** (`/pricing`page,`subscription.types.ts`— plans, checkout, cancel — plus`admin.types.ts`, `EntitlementsContext`, `PlanGate`, `impersonation.client.ts`) with real,
non-stub UI wired to `/admin/_`and`/subscription/_` backend endpoints. **`PlanGate`already
gates the Patient Intelligence page behind a paid plan.** **No`decision-log.md`entry exists for
this**, and it directly contradicts`CLAUDE.md`'s standing rules — "Do not build clinic,
  hospital, insurance, billing, or telemedicine features unless explicitly asked" and "Do not add
  future roadmap features (… payments) into MVP code" — rules that predate this commit by many
  weeks. Flagged here, not removed; whether it was explicitly authorized out-of-band needs
  reconciling with the product owner. See "Known Issues" below.

Because the backend no longer lives in this repo, the module-status table below tracks **frontend
integration** (API client usage + UI), not backend implementation — that responsibility now belongs
to `swathya-rakshak-backend/`'s own docs (none exist there yet — its `docs/` directory is absent as
of this sync).

## MVP Module Status (frontend integration)

| Module          | API Client (`src/backend/features/*`)        | Frontend UI                                  | Status |
| --------------- | -------------------------------------------- | -------------------------------------------- | ------ |
| Authentication  | ✅ `auth.client.ts`/`auth.types.ts`          | ✅ login, register, doctor/register          | ✅     |
| User Profile    | ✅ `users.types.ts`                          | ✅ `/profile`                                | ✅     |
| Family Members  | ✅ `family-members.types.ts`                 | ✅ `/family`                                 | ✅     |
| Medical Records | ✅ 6 processor families, filters, tags       | ✅ `/medical-records` + 20+ components       | ✅     |
| Prescriptions   | ✅ `prescriptions.types.ts`, `medicine.ts`   | ✅ `/prescriptions`, `/doctor-prescriptions` | ✅     |
| Lab Reports     | ✅ extraction/values/summary helpers         | ✅ `/lab-reports` + 10 components            | ✅     |
| Reminders       | ✅ schedule/UI helpers                       | ✅ `/reminders`, `ReminderWatcher`           | ✅     |
| Timeline        | ✅ `timeline.types.ts`                       | ✅ `/timeline`                               | ✅     |
| AI Summaries    | ✅ `ai.types.ts`, `extraction-confidence.ts` | ✅ consent modal + summary/extract UI        | ✅     |
| File Storage    | ✅ `download.ts`                             | N/A (upload triggered from feature modals)   | ✅     |

Legend: ✅ Done · 🔄 In Progress · ⏳ Pending · N/A Not applicable

Beyond the original MVP list (all frontend-integrated): **Doctor↔patient connectivity**
(connections, doctor daily-visits/patient-list, doctor prescribing) and **Patient Intelligence**
(`/patient-intelligence`, compute-on-read health profile — now paywalled, see above). The
**Admin/Subscription system** is also present and functional end-to-end but is listed separately
in "Known Issues" rather than the table above, since it falls outside the MVP scope `CLAUDE.md`
defines and hasn't been confirmed as an intended addition.

## Recent Changes

- **2026-07-17**: Closed out the last two items (P3) from the lab-report UI improvement pass —
  success toasts and cross-report trend charts. Both pure frontend, no new API contract:
  - **Success toasts** — reused the app's existing `useNotification()`/`NotificationProvider`
    (already built, previously only consumed by `ReminderWatcher`) rather than building a new
    toast system; the Lab Reports page just wasn't calling it yet. Wired into save (add report),
    delete (single + bulk, count-aware), and summarize/extract (single shows its own toast; the
    bulk loop suppresses per-item toasts via a new `runAi(..., { silent })` flag and shows one
    aggregate toast instead, so summarizing 10 reports doesn't stack 10 toasts). Toasts
    auto-dismiss after ~3.5s (reminder toasts intentionally don't — a caller-side `setTimeout` +
    `dismiss(id)`, not a change to the shared primitive).
  - **Trends view** — new "Reports"/"Trends" tab on the Lab Reports page. New
    `src/backend/features/lab-reports/trends.ts` (`buildTrendSeries`, unit-tested) groups every
    report's extracted test values by test name (case-insensitive) across the whole list, keeping
    only tests with ≥2 numeric, dated points, sorted most-recently-tested first. New
    `LabTrendChart.tsx` renders each series as a hand-rolled SVG line chart (no charting library
    added — reuses the same `parseNumber`/`parseRange`/`classify` from `lab-values.ts` that the
    per-report values table already uses, so a value reads identically in both places) with a
    hover/focus tooltip, a shaded reference band, and a direct end-label. Followed the `dataviz`
    skill's procedure throughout; its palette validator caught a real accessibility gap — the
    app's existing success/warning colors (also used unchanged in `RangeBar`'s value marker) sit
    at CVD ΔE ~4 under protanopia, below the 6.0 floor — so out-of-range points render as a
    triangle, not just an amber dot, giving colorblind users a non-color signal the existing
    `RangeBar` marker doesn't have. Visually verified by hand (temporary throwaway route +
    Playwright screenshots, light/dark, deleted after): caught and fixed a real clipping bug where
    the end-of-line value label ran past the chart's right edge for longer unit strings.
- **2026-07-17**: Added a "Share" action to both the Lab Summary and Extracted Values views
  (`LabSummaryView`, `ExtractedValuesTable`). New `src/backend/lib/share.ts` (`shareReport`,
  unit-tested) tries, in order: (1) the native Web Share API with the generated PDF attached
  (`navigator.canShare({files})` — surfaces WhatsApp/email/etc. on mobile), (2) a title/text/link
  share for browsers that support Web Share but not file attachments, (3) copying the report's
  existing signed `fileUrl` to the clipboard. No new backend endpoint: deliberately reuses the
  already-signed, already-time-limited `fileUrl` from `GET /lab-reports/:id` (via the existing
  `fileUrl()` helper, same as every other view/download call site) instead of adding a dedicated
  "generate a share link" API — the lab-ui-improvement.md suggestion's "time-limited signed URL"
  requirement is met without any backend change or new architecture.
- **2026-07-17**: Three more Lab Reports UI improvements, all pure frontend, no new API contract:
  - **Drag-and-drop upload** — `AddLabReportModal`'s dropzone now handles `onDragOver`/
    `onDragLeave`/`onDrop` with a pulsing drag-active visual state, feeding into the same
    `onPickFile` path as click-to-browse.
  - **Mobile card layout for extracted values** — `ExtractedValuesTable` now renders a
    `sm:hidden` stacked-card view (`ValueCard`) alongside the existing `sm:block` table, so
    phones no longer need horizontal scrolling to read lab values.
  - **Version history UI** — new `LabReportVersionHistoryModal`, opened via a "History" icon on
    `LabReportCard` (shown once a report has been extracted at least once). Consumes the
    previously UI-less `GET /lab-reports/:id/versions` / `.../versions/:versionNumber` endpoints
    (documented in `api-contracts.md` already) to list past `POST /ai/extract` runs with
    timestamp + confidence, expandable to that version's extracted test values. Read-only — no
    restore/rollback, since no such endpoint exists.
- **2026-07-17**: Added batch actions (multi-select) to the Lab Reports page — a "Select" toggle
  puts each `LabReportCard` into checkbox mode, and a sticky `LabReportBulkActionBar` offers
  "Summarize all", "Extract all", and "Delete selected" (delete routed through the existing
  `DeleteLabReportModal`, extended with a `bulkCount` prop so it can confirm either one report or
  a batch). Pure frontend addition — reuses the existing `GET/DELETE /lab-reports` and
  `POST /ai/{summary,extract}` endpoints in a loop per selected id, no new API contract. Mirrors
  the Medical Records page's existing bulk-selection pattern (`BulkActionBar`, `selectMode`/
  `selected` state) for consistency.
- **2026-07-16**: `docs/` synced against the actual repo state for the first time since the
  frontend/backend split. No frontend code changed in this pass — this was a documentation-only
  correction (`architecture.md`, `api-contracts.md`, `database-schema.md`, `decision-log.md`, this
  file).
- **2026-07-15, `ce27746` "scoped ownership"**: added the admin panel + subscription/billing/
  entitlements system described above. Undocumented at the time; reconciliation with `CLAUDE.md`
  scope rules is an open item, not a decided direction.
- **2026-07-15/16, `627cddb`/`e51a887`**: split the Next.js monolith into this frontend-only repo
  plus a separate Laravel backend repo (`swathya-rakshak-backend/`). All Prisma/API-route/service
  code removed from here; `src/` stays regrouped as `src/frontend/` (UI) and `src/backend/`
  (browser-safe API-client/types/feature helpers only — no server implementation despite the name,
  per `CLAUDE.md`).
- **Everything dated 2026-07-02 through 2026-07-14** (Medical Records Phases 1–7B, Patient
  Intelligence, three-layer OCR persistence, routed OCR microservice, reminder engine hardening,
  lab-report AI-assisted upload, custom date pickers, security headers/env validation) was built
  when this repo still hosted the backend. That work is real and shipped — it's just now served by
  the Laravel backend instead of Next.js API routes. Full history below and in `decision-log.md`.

## What's Next

1. **Reconcile the admin/subscription/billing system with `CLAUDE.md`'s MVP scope** — confirm with
   the product owner whether this was intentionally authorized (and update `CLAUDE.md`/
   `architecture.md`'s MVP module list accordingly) or whether it should be pulled back out of the
   patient MVP path. Until decided, treat `/pricing`, `/admin/*`, and the `PlanGate` on Patient
   Intelligence as scope-uncertain, not confirmed product direction.
2. **Write the missing `decision-log.md` entry for the admin/subscription addition** — the split
   into two repos is now logged (this pass); the subscription/admin rationale is unknown and needs
   the original author's context.
3. **Stand up docs in `swathya-rakshak-backend/`** (its `docs/` directory doesn't exist yet) so
   `api-contracts.md`/`database-schema.md` here stop being the only record of the API shape — right
   now these describe another repo's implementation from the outside, which will drift the moment
   the backend changes without a matching update here.

## Known Issues / TODOs

- **No decision-log entry for the admin/subscription/billing/entitlements system** (`ce27746`,
  2026-07-15) — added a full admin panel, plan-based paywalling (`PlanGate` on Patient
  Intelligence), and checkout/cancel flows with no recorded reasoning, no alternatives-considered,
  and no scope sign-off visible in this repo's history. This is the single biggest doc/reality gap
  found in this sync — flagging for the product owner rather than guessing at intent.
- **`docs/architecture.md`'s "AI layer" and OCR sections describe code that no longer exists in
  this repo** (gateway, redaction, `ocr-service/`) — that logic now lives in
  `swathya-rakshak-backend/`. Kept in `architecture.md` as historical/contextual background (the
  frontend's AI-related UI — consent modal, confidence badges, summary parsing — still assumes
  that pipeline exists on the other side of `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL`), but it is no longer this repo's
  implementation to maintain or test.
- **`docs/api-contracts.md` and `docs/database-schema.md` are now secondhand** — they describe the
  Laravel backend's contract/schema from the frontend's point of view, not code in this repo. They
  can silently drift the moment the backend changes an endpoint shape without a corresponding
  frontend PR. Cross-check against `swathya-rakshak-backend/routes/` and `database/migrations/`
  when in doubt, not just this file.
- **No automated tests cover the admin/subscription pages** — `src/app/(admin)/**` and `/pricing`
  have no `__tests__/` coverage. If this system stays in scope, it's a critical flow per
  `docs/testing.md` ("no core feature ships without tests") the moment it's confirmed as intended
  MVP surface.
- Every item below predates 2026-07-15 and describes **backend behavior that now belongs to
  `swathya-rakshak-backend`**, not this repo — preserved here for historical context (and because
  the frontend UI built around each of them is unchanged), but re-file any still-unresolved ones
  against the backend repo:
  - `/ai/classify`/`/ai/analyze` can `422` on a free-tier LLM formatting glitch (unescaped newline
    in a JSON string) — falls back to manual entry by design, no LLM-call retry.
  - All 20 processable medical-record types across six families are implemented; only `other`
    stays classify-only. Deferred: medication interaction/adherence/reconciliation, imaging
    prior-comparison/DICOM, procedure implant-registry, immunization due-tracking, billing/claim
    reconciliation, global cross-feature search, plus an AI-insights panel.
  - Clinical processing re-OCRs on every run (two synchronous LLM calls per pass, one shared OCR
    pass); no OCR cache.
  - `/ai/analyze` auto-fill can return null/low-confidence fields the PII layer redacts (by
    design — the field stays editable).
  - Extraction confidence is real OCR-engine confidence when routed through the PaddleOCR service,
    a heuristic otherwise.
  - OpenRouter free-tier LLM calls have no retry/backoff on `429`.
  - No automated integration test exists for the AI route handlers (manual guide only,
    previously `howtos/ai-pii-reduction-test.md` — now deleted along with the backend code it
    tested).
  - OCR quality on badly-garbled phone photos is unproven; Devanagari-script names aren't redacted
    (Presidio runs English-only).
  - AI processing is synchronous (no job queue); PHI/extraction JSON isn't encrypted at rest;
    `familyMemberId` isn't ownership-validated on create; family members don't get their own meal
    timings; `wakeUp`/`bedtime` are stored but unused; the reminder dismiss/retry and reschedule
    paths have no automated test (manual-only, no Prisma-mock infra); patient-authored
    prescriptions have no update endpoint and don't generate reminders; reminder auto-completion
    only sweeps on the next `GET /reminders` (no cron); DB TLS is documented, not enforced; health
    data isn't encrypted at rest; auth tokens live in `localStorage`; SMS delivery is a stub (dev
    OTP via `devCode` only); reminder notifications are in-app/poll-only, no OS push; no
    server-side list pagination anywhere; `DatePicker`/`DateTimePicker` have no interaction tests.
