# Decision Log

## Purpose

Record important product and engineering decisions so Claude does not guess later.

## Format

Date:
Decision:
Reason:
Alternatives considered:
Why rejected:

## Example

Date: 2026-06-26
Decision: Patient-first MVP
Reason: The product must be marketable quickly and the team has limited build time.
Alternatives considered: Clinic-first launch
Why rejected: Longer sales cycle and more complex MVP.

Date: 2026-06-30
Decision: Mobile number (not email) is the sole account identity, verified by OTP at registration.
Reason: Prevents one person opening multiple accounts; email is easy to duplicate, a phone number is harder to. Matches the Indian patient audience.
Alternatives considered: Email + password; phone + password without OTP.
Why rejected: Email allows trivial multi-account abuse. Phone without OTP doesn't prove the user owns the number.
Notes: Email field removed from the User model. Login supports phone+password and phone+OTP. SMS delivery is pluggable (`SMS_PROVIDER`); dev uses a console provider that logs the code.

Date: 2026-06-30
Decision: Stateless JWT auth — access/refresh tokens stored in the browser (localStorage), sent as a `Bearer` header; `middleware.ts` verifies the token and injects `x-user-id` into request headers for API routes to read via `getUserId()`.
Reason: Keeps API routes stateless and decoupled from token verification; a single middleware guards all `/api/v1/*` routes. Routes never re-verify the JWT.
Alternatives considered: httpOnly cookie sessions; verifying the token inside each route.
Why rejected: Cookie sessions add CSRF handling and server-side session state; per-route verification duplicates logic. localStorage is acceptable for the MVP (revisit for XSS hardening before production).
Notes: Logout is client-side token disposal (stateless JWTs can't be revoked server-side); a token-blocklist hook is left in `auth.service.logout` for later.

Date: 2026-06-30
Decision: File upload via local disk for dev — `POST /api/v1/upload` accepts multipart form data, stores under `public/uploads` with a randomized filename, and returns `{ fileUrl, fileType, fileSize }`. Limited to 10 MB and JPEG/PNG/WebP/PDF.
Reason: Records/lab-reports reference an already-uploaded `fileUrl`, so upload is a separate step the client calls first. Local disk keeps dev simple.
Alternatives considered: Direct S3/GCS upload; embedding the file in the create-record request.
Why rejected: Cloud storage is deferred (swap `src/lib/storage.ts` later); embedding files bloats JSON payloads and couples upload to each create endpoint.

Date: 2026-06-30
Decision: Adopted a Tailwind + Framer Motion + lucide-react UI system (with class-based dark mode and EN/HI i18n), ported from the sibling "Swasthya-Rakshak_AI-Diagnostic" project, replacing the previous inline-`React.CSSProperties` styling.
Reason: The team admired the AI-Diagnostic project's UI/UX and wanted that polish across our screens. Tailwind makes dark mode and a full vivid restyle across every page far cheaper to maintain than hand-written inline-style objects, and the source components were already Tailwind/Framer/Lucide.
Alternatives considered: (a) Keep inline styles, port only the "look"; (b) Hybrid — keep inline styles but add Lucide icons + subtle motion.
Why rejected: With dark mode + i18n + a restyle of all surfaces requested, inline styles would have required re-deriving theming by hand on every component. Full adoption was the lower-friction path.
Scope: Visual layer only. Backend, Prisma schema, API routes, auth, and the `userId` ownership model are unchanged. We did NOT bring over the AI-Diagnostic clinic/hospital/telemedicine/doctor/lab/inventory pages — patient-first MVP scope is preserved. New deps: tailwindcss/postcss/autoprefixer (dev), framer-motion, lucide-react. The 3D `HeartAnimation` (three.js) was replaced by a lightweight Framer-Motion `HeartbeatHeart` to avoid pulling in three.js. The `design` skill and its references were rewritten to document the new system. Pexels hero/testimonial images are hotlinked (host allow-listed in `next.config.ts`).
Notes: A new public landing page now lives at `/` (`src/components/marketing/LandingPage.tsx`); logged-in users are redirected to `/dashboard`.

Date: 2026-07-01
Decision: Dashboard feature pages and auth pages use inline `React.CSSProperties` (not Tailwind), while the dashboard shell layout and landing page use Tailwind/Framer/Lucide. This hybrid is intentional for the MVP.
Reason: The dashboard shell and landing page were ported from the AI-Diagnostic project (Tailwind-based). The feature pages (family, medical-records, prescriptions, lab-reports, reminders, timeline, profile, dashboard/home) and auth pages were purpose-built or visually overhauled in this project using inline styles, matching the approved design-system palette tokens without adding Tailwind class dependencies to every feature page.
Alternatives considered: Migrate all feature pages to Tailwind; keep everything inline.
Why rejected: Full Tailwind migration of feature pages adds scope without current business value; the inline-style approach is already consistent with the design system tokens. The hybrid is low-friction and the split is clear — layout/marketing = Tailwind, feature pages/auth = inline styles.
Notes: The `design` skill documents inline-style patterns as the authoritative standard for feature pages. Do not reintroduce Tailwind classes into the feature page files.

Date: 2026-07-01
Decision: Added a `DailyVisit` model (doctor's per-day patient queue with sequential token numbers) and structured `medicinesJson` (name + quantity + per-meal-slot dose schedule with before/after-food timing) to the doctor prescribing flow.
Reason: A plain name-only patient dropdown breaks once a doctor has many patients or two patients share a name; a free-text medicine textarea can't express dosage/frequency/course length, so nothing meaningful reflected on the patient side. The doctor also had to retype the hospital name and visit date on every prescription despite that data already existing (`DoctorProfile.clinicName`, "today").
Alternatives considered: A searchable patient picker (name + phone) with no new model; a single before/after-food toggle per medicine instead of per time-slot.
Why rejected: The user explicitly wanted a daily token/queue system (matches how doctors already track patients day-to-day) rather than just a better search box, and wanted per-time-slot food timing for flexibility (e.g. a medicine taken before breakfast but after dinner).
Notes: Reminders are **not** auto-generated from the dose schedule yet — it is display-only on both the doctor's and patient's prescription views (`src/components/prescriptions/MedicineList.tsx`). `doses`/`quantity` are optional in the schema so the patient's own free-text prescription form (unchanged) still validates. See `docs/database-schema.md` (`daily_visits`, `prescriptions.medicinesJson`) and `docs/api-contracts.md` (`/doctor/daily-visits`).

Date: 2026-07-01
Decision: Reworked the doctor prescription screen around a date-scoped "Patient List" (date picker replaces the "add to today" button), linked `Prescription.dailyVisitId -> DailyVisit` (`SetNull`), made prescribing additive (multiple prescriptions per visit, never overwritten), and added a doctor-only `PATCH /doctor/prescriptions/:id` to edit an existing one. Removed the separate "authored prescriptions" panel — each patient box now shows its own prescription(s) inline and is clickable for the full view.
Reason: After trying the first version, the doctor wanted the list framed around "which day" rather than "today only" (so it reads sensibly once you can change dates), wanted the add-patient action to double as a quick "add + prescribe", wanted an at-a-glance signal (token color) for who's been seen, and wanted a mistake-tolerant flow — prescribing again should never silently replace a fresh, possibly-still-valid earlier prescription.
Alternatives considered: A single prescription per visit (overwrite semantics with an edit-in-place default); a bottom-of-page "all prescriptions" list kept alongside the queue.
Why rejected: Overwrite semantics silently discard a valid earlier record if the doctor clicks "Prescribe" again by habit — explicit "Edit" is safer and matches the user's explicit request ("previous prescription will remain, doctor can edit it too"). The bottom panel duplicated what's now shown per-patient-box and added scroll distance between a patient and their own history.
Notes: Box click is state-dependent (view if prescribed, else new-prescription form); the box's own "Prescribe" button is unconditional (always new). `daily-visits.service.listDailyVisits`/`addDailyVisit` now `include` prescriptions so the UI never needs a second round-trip to know a visit's prescribed state.

Date: 2026-07-01
Correction: The 2026-07-01 "hybrid" entry above (dashboard feature pages + auth pages use inline `React.CSSProperties`) no longer matches the code. A repo-wide check (`grep -c "style={{"` across every file in `src/app` and `src/components/auth`) found **zero** inline-style usages — every dashboard feature page, auth page, and the dashboard shell/landing page use Tailwind classes exclusively. This matches `CLAUDE.md`'s current instruction ("This replaced the earlier inline-`React.CSSProperties` styling — do not reintroduce inline-style objects").
Reason: Found while auditing `docs/progress.md` against the actual codebase (`/sync-docs`); the hybrid split was likely true briefly but the feature pages were migrated to Tailwind at some point without a decision-log entry recording it.
Notes: `docs/architecture.md`'s "UI styling" section has been corrected to describe the current all-Tailwind state. Do not resurrect the inline-style pattern.

Date: 2026-07-01
Decision: Reminder notifications are delivered as an in-app slide-in toast only (MS Teams-style, bottom-right), via a new generic `NotificationProvider`/`useNotification()` toast system and a `ReminderWatcher` client component that polls `GET /reminders` every 30s. No repeat auto-advance: a repeating reminder (`repeatType`) fires once and is marked done manually; `scheduledAt` is not bumped automatically.
Reason: SMS and mobile push are explicitly out of scope until the SMS/mobile integration work; building a generic toast primitive now (rather than a reminder-specific one) lets it double as the app's general toast system later. Recurrence scheduling is a backend/cron concern best tackled alongside real notification delivery, not bolted onto the client poller.
Alternatives considered: Browser `Notification` API (OS-level toast) in addition to in-app; auto-advancing `scheduledAt` on mark-done for repeating reminders.
Why rejected: OS notifications need a permission prompt and add complexity (visibility/service-worker handling) disproportionate to the current MVP goal; auto-advance without a real scheduler risks silently drifting reminders if the tab isn't open when a recurrence "should" have fired.
Notes: No schema/API changes — reuses `GET /reminders` and `PATCH /reminders/:id`. New: `src/components/ui/Toast.tsx`, `src/components/providers/NotificationContext.tsx`, `src/components/reminders/ReminderWatcher.tsx`, `src/features/reminders/reminder-ui.ts` (shared type→icon/tone config extracted from `reminders/page.tsx`). Fired-reminder de-dupe uses `localStorage` (`sr:firedReminders`), not a server flag.

Date: 2026-07-01
Decision: Sign-out now redirects to the public landing page (`/`) instead of `/login`.
Reason: The dashboard layout's auth guard (`useEffect` checking `getAccessToken()`) redirects any unauthenticated visitor straight to `/login`; routing logout to `/login` directly was harmless but redundant, and `/` reads better as a "you've signed out" destination for a patient-facing app than dropping straight back onto a login form.
Alternatives considered: Keep redirecting to `/login`.
Why rejected: No functional bug, but `/` is the more natural post-logout landing spot; the auth guard already handles the `/login` bounce for any other unauthenticated access attempt, so this only changes the one explicit sign-out click path.
Notes: Only `handleLogout` in `src/app/(dashboard)/layout.tsx` changed. The unauthenticated-access guard (invalid/missing token, failed `/auth/me`) still redirects to `/login` — unchanged.

Date: 2026-07-01
Decision: Doctor-authored prescriptions now auto-generate the patient's medicine reminders from the structured dose schedule. Added a nullable `Reminder.prescriptionId` FK (`onDelete: Cascade`) so a prescription's reminders can be found and replaced on edit, and disappear if the prescription is deleted. Generation is one **daily-repeating** reminder per (medicine, dose slot) pair — not one row per day of the course — first firing on the prescription's `visitDate` (or today, if unset) at a fixed clock time per slot: morning 9:00 AM, afternoon 1:00 PM, evening 5:00 PM, night 8:00 PM. Reminder title is `"<medicine name> — <time>"`, `reminderType: "medication"`. On edit, all of that prescription's auto-generated reminders are deleted and rebuilt from the current medicines (inside the same `prisma.$transaction` as the prescription write), so edits never leave stale/duplicate reminders behind.
Reason: The dose schedule (quantity, per-slot doses, before/after-food timing) was explicitly display-only until now (see the 2026-07-01 `DailyVisit`/medicine-schedule entry above) — this was a known, intentional gap. The user asked for it to drive real reminders. Daily-repeating (vs. materializing every day of a multi-day course) keeps the row count small and reuses the existing `repeatType: "daily"` field exactly as designed.
Alternatives considered: No schema change, tagging reminders by encoding the prescription id into `title`/`reminderType` instead of a real FK; materializing one reminder per day for the full course duration.
Why rejected: String-tagging is fragile (breaks if title format ever changes, pollutes user-facing text) and the app already has a real relational schema — a FK is the natural fit and CLAUDE.md's "no schema change without asking" bar was cleared explicitly with the user first. Per-day materialization can produce dozens of rows per prescription and needs `quantity` to be set; daily-repeat needs neither.
Notes: New `src/features/reminders/prescription-reminders.ts` (`SLOT_TIMES`, `buildPrescriptionReminders`, `buildPrescriptionRemindersFromJson`) and `syncPrescriptionReminders` in `src/features/reminders/reminders.service.ts` (transaction-scoped delete+recreate). Wired into `createPrescriptionForPatient` and `updatePrescriptionByDoctor` in `src/features/prescriptions/prescriptions.service.ts`. Scope: doctor-authored prescriptions only — patient-authored free-text prescriptions (`createPrescription`) are untouched, since they don't carry a structured `doses` schedule. No API contract changes. Migration: `20260701103948_link_reminder_to_prescription`.

Date: 2026-07-01
Decision: The reminders page now shows only **Upcoming** and **Completed** filter tabs; the "All" tab was removed (explicit UI cleanup request), and the default view on load changed from "All" to "Upcoming".
Reason: User request — "All" mixed both states into one list with no clear default, and Upcoming/Completed already cover everything a reminder can be in day-to-day use.
Notes: `src/app/(dashboard)/reminders/page.tsx` — `filter` state type narrowed from `"all" | "active" | "done"` to `"active" | "done"`; the `filtered` derivation simplified to a single equality check. The "Add reminder" empty-state CTA now shows on the Upcoming empty state (previously it only showed for the removed "All" state).

Date: 2026-07-01
Decision: Reminder toasts anchor top-right, just below the sticky dashboard top nav (`top-20 right-4`), instead of bottom-right.
Reason: User preference after seeing the bottom-right placement in use.
Notes: Only `ToastViewport`'s wrapper classes in `src/components/ui/Toast.tsx` changed; the slide-in-from-right animation and `z-50` stacking (above the header's `z-40`) are unchanged.

Date: 2026-07-01
Decision: Added `DELETE /api/v1/doctor/prescriptions/:id` — a doctor can delete a prescription they authored, but only if its `visitDate` is today, in the future, or unset. A past visit's prescription can't be deleted (`403`).
Reason: Doctors previously had no way to remove a prescription entered by mistake (only `PATCH` existed). The user asked for a delete action but also wanted historical records protected from being erased after the fact once the visit date has passed.
Alternatives considered: Unrestricted delete (matching the simplicity of the patient-side delete); a soft-delete/archive flag instead of a hard delete.
Why rejected: Unrestricted delete would let a doctor quietly erase a patient's medical history days or weeks later; a soft-delete flag adds schema/query complexity (filtering it out everywhere) for a need the date guard already satisfies simply.
Notes: `deletePrescriptionByDoctor` in `src/features/prescriptions/prescriptions.service.ts` (date-only comparison, ignores time-of-day). The delete cascades to that prescription's auto-generated `Reminder` rows via the `prescriptionId` FK added earlier — no extra cleanup code needed. UI: a red trash-icon button next to "Edit" on each prescription card in the doctor's visit-detail modal (`src/app/(dashboard)/doctor-prescriptions/page.tsx`), with an inline error message (not a browser `alert()`) if the delete is rejected.

Date: 2026-07-01
Decision: Prescription-generated reminders now auto-disable once their medicine's course is complete, are visibly labeled "From prescription" on the reminders page, and completed reminders are permanently deleted 30 days after completion. Added `Reminder.courseEndDate` (set at generation time from `computeCourse`'s `durationDays`; null — and the reminder repeats indefinitely — when the medicine has no `quantity`, since the course length is then unknown) and `Reminder.completedAt` (stamped whenever a reminder transitions to `status: "done"`, whether by the patient or automatically). Both the course-completion auto-done and the 30-day retention delete are swept inside `listReminders` (`retireExpiredReminders` in `reminders.service.ts`) rather than a separate job — every `GET /reminders` (from the Reminders page or the `ReminderWatcher`'s poll) self-heals the table.
Reason: User request, in three parts: (1) a visible tag distinguishing prescription-driven reminders from manually-created ones, (2) reminders should stop firing once the prescribed course is actually finished rather than repeating forever, (3) completed reminders shouldn't accumulate forever — 30-day retention before deletion.
Alternatives considered: A flat 30-day cap applied to every generated reminder regardless of course length (rejected by the user — the course length itself, when known, should drive completion, not a fixed cap); deriving the retention clock from `updatedAt` instead of a dedicated `completedAt` (rejected — `updatedAt` changes on any edit, not just completion, so it would give an inexact/resettable retention window); a separate cron/scheduled job for the sweep instead of doing it inline in `listReminders` (rejected — the app has no job-scheduling infra yet, and every path that reads reminders already calls `listReminders`, so an inline sweep gets the same effect for free).
Notes: Migration `20260701110718_reminder_course_end_and_completed_at`. `RETENTION_DAYS = 30` and the `retentionCutoff(now)` helper are exported from `reminders.service.ts` (kept as a pure function so it has direct unit-test coverage without mocking Prisma — see `src/features/reminders/__tests__/reminders.service.test.ts`). UI: a gray "From prescription" badge (clipboard icon) renders on any reminder with a non-null `prescriptionId`, in `src/app/(dashboard)/reminders/page.tsx`.

Date: 2026-07-01
Decision: Reminder recurrence is now computed on the fly from the `scheduledAt` anchor + `repeatType`, rather than firing a fixed `scheduledAt` once. New pure helpers in `src/features/reminders/reminder-schedule.ts` — `firstSlotOccurrence` (generation: roll a slot forward to the next occurrence at/after the prescribed-at moment), `currentDueOccurrence` (watcher: what's due now), `nextOccurrence` (display: next upcoming). Prescription reminder generation (`buildPrescriptionReminders`) now takes `(medicines, courseStartDay, referenceNow)`: each slot's first fire is the slot time on the course start day rolled forward past `referenceNow` (the create/edit moment), so a 1:35 PM prescription schedules the 8 PM dose today and the 9 AM dose tomorrow instead of firing past-slots immediately. The `ReminderWatcher` now de-dupes fired toasts by `reminderId::occurrenceISO` (was `reminderId` alone) so a daily reminder fires once per day for the whole course instead of once ever.
Reason: `repeatType: "daily"` was cosmetic — the watcher's per-id localStorage dedup meant a daily medicine reminder fired only on day 1, and slots were built off `visitDate` at midnight so same-day afternoon prescriptions fired morning/afternoon slots immediately as overdue. A real patient needs a reminder every day at the right time, starting from when the medicine was actually prescribed.
Alternatives considered: Advancing the stored `scheduledAt` forward on each fire (server- or client-side); a server cron to materialize per-day rows.
Why rejected: Mutating `scheduledAt` is racy across tabs and fights the "fire the due one now" poll (an eager advance hides the currently-due occurrence); a cron needs infra the MVP doesn't have. On-the-fly occurrence computation keeps `scheduledAt` as a stable anchor, needs no migration/backfill (existing rows recur correctly on the next poll), and reuses the existing `courseEndDate` auto-complete + 30-day retention sweep unchanged.
Notes: Recurring-reminder acknowledgement changed per user: the toast's primary action is now "Taken" (`reminders.notification.taken`) which only clears today's alert (no status change) — the reminder fires again next occurrence and the course ends only at `courseEndDate` or via the card's explicit mark-done. One-time reminders keep "Mark done". The reminders page card's mislabeled "Created at {scheduledAt}" line was fixed to show "Next: {nextOccurrence}" (or "Completed {completedAt}") plus "Added {createdAt}" (the true creation timestamp). Timezone: all slot math is in the app's local timezone (fine for the India-only/IST MVP); a timezone-robust representation is deferred with the SMS/mobile work.

Date: 2026-07-02
Decision: Implemented patient profile persistence (`GET`/`PATCH /users/profile`), which had been
a `501` stub since the module was scaffolded, as part of adding optional per-patient meal-timing
settings.
Reason: The user asked for custom meal-timing reminder scheduling, which needs somewhere durable
to store a patient's meal times — the natural home is the profile they already had a (non-working)
edit form for. Fixing the stub was cheaper and more correct than bolting meal timings onto a new,
separate endpoint while leaving the existing profile save silently broken.
Alternatives considered: A dedicated `/users/meal-timings` endpoint, leaving `/users/profile`
stubbed.
Why rejected: Would leave the pre-existing profile-edit bug (DOB/gender/blood-group edits silently
not persisting) unfixed and split patient settings across two endpoints for no benefit.
Notes: Added `User.mealTimings Json?` (migration `20260702062953_add_meal_timings`) — chosen as a
single JSON blob (`{ breakfast?, lunch?, highTea?, dinner? }`, each `"HH:MM"`) rather than four
separate nullable columns, matching how the schema already prefers JSON for small optional
structured data (`Prescription.medicinesJson`). `FamilyMember` was deliberately NOT given a
`mealTimings` field in this pass — dependents' reminders use the account owner's timings or the
fixed defaults; see the meal-timing-offset entry below.

Date: 2026-07-02
Decision: Medicine reminder times now anchor to the patient's own meal timings (when set) instead
of a single fixed clock time per meal slot, with a before/after-food offset applied per meal:
before food is always −30 minutes; after food is +10 (breakfast), +15 (lunch), +5 (high tea), +15
(dinner). The reminder de-dupe key changed from `medicine+slot` to `medicine+slot+food`, since
before/after doses of the same medicine at the same slot can now produce two different times.
Reason: User request, with a concrete worked example (patient with an 8 AM breakfast should get a
"before breakfast" reminder at 7:30 AM and an "after breakfast" reminder at 8:10 AM, not the old
fixed 9:00 AM for both). The previous fixed-time model ignored both real patient schedules and the
before/after-food distinction entirely (it was captured on the medicine but never affected
`scheduledAt`).
Alternatives considered: A single offset for all meals regardless of before/after; storing
per-medicine absolute times instead of deriving them from meal time + offset.
Why rejected: The user explicitly specified different after-food offsets per meal (10/15/5/15
minutes) — a single offset would not match lunch/dinner's larger digestion-time gap vs. high tea's
smaller one. Deriving from meal time + offset (rather than storing an absolute time per medicine)
keeps a single source of truth (the patient's meal schedule) that automatically re-applies to
every future prescription once set, rather than requiring the doctor to know the patient's
schedule at prescribing time.
Notes: `SLOT_TIMES` (defaults), `AFTER_FOOD_OFFSET_MIN`, `BEFORE_FOOD_OFFSET_MIN`, and
`resolveDoseTime` in `src/features/reminders/prescription-reminders.ts`.
`syncPrescriptionReminders` (`reminders.service.ts`) loads `User.mealTimings` inside the same
transaction as the prescription write, so a prescription always uses the patient's _current_
meal timings at write time — it does not retroactively reschedule if the patient changes their
Daily Routine later (noted as a known limitation in `progress.md`, not a bug). A malformed custom
time (fails `HH:MM` regex) silently falls back to the default rather than erroring.

Date: 2026-07-02
Decision: Added a third "Pending" tab to the reminders page (now Pending | Upcoming | Completed),
distinct from the persisted `Reminder.status` field. Pending = an active reminder whose current
occurrence is due/overdue and has not been acknowledged; acknowledgement is a new client-side
concept (tapping a toast action or the page's own acknowledge button), separate from merely being
shown a toast.
Reason: User reported logging in at 10 AM after two morning reminders should have fired, and
finding no way to see that they were sitting un-acted-upon — "Upcoming" only shows future
occurrences (via `nextOccurrence`), so a reminder that had already fired silently looked identical
to one still hours away once its badge read "Overdue" buried inside the Upcoming list.
Alternatives considered: Adding a real persisted `"pending"` value to `Reminder.status`; treating
"pending" as simply all `status: "active"` reminders (same set as the old "Upcoming").
Why rejected: A persisted status would need a schema/enum migration and doesn't fit the existing
model, where `status` already means done-vs-not and "is it due" is correctly a derived,
time-dependent fact (recomputed every poll) rather than stored state. Treating pending = all
active reminders would make "Upcoming" redundant (identical to "Pending") since every active
reminder would qualify for both.
Notes: The single source of truth is the new `classifyReminder(reminder, now, acknowledged)` in
`src/features/reminders/reminder-schedule.ts`, unit-tested. The `ReminderWatcher`'s single
`sr:firedReminders` localStorage key (toast dedup) was split into two purposes:
`sr:shownReminders` (dedupe toast pop-ups, unchanged behavior) and `sr:acknowledgedReminders`
(new — drives the Pending/Upcoming split). Being shown a toast does NOT acknowledge it; only an
explicit action (Taken/Dismiss/Mark done on the toast, or a new checkmark button on the reminders
page's pending cards) does.

Date: 2026-07-02
Decision: Built a custom, hand-rolled `DatePicker`/`DateTimePicker` (`src/components/ui/`) to
replace every native `<input type="date">`/`type="datetime-local">` in the app, rather than
adding a date-picker library (e.g. `react-day-picker`). The popover portals to `document.body`
and is positioned from the trigger's `getBoundingClientRect()` (flip-above-if-no-room-below,
horizontal clamp, close-on-scroll), rather than being positioned inline/`absolute` relative to
the trigger.
Reason: The native date-picker popup's position, size, and internal styling are entirely
browser-controlled — the earlier `color-scheme` CSS fix (2026-07-02, see `progress.md`) could
theme it but not move or resize it, and the placement itself looked broken (screenshot from
user: popup rendered awkwardly positioned in dark mode). Fixing placement requires owning the
popup, which native inputs don't allow. On the library-vs-hand-rolled choice: no date-utility or
picker library exists anywhere in this codebase today (dependencies are deliberately minimal —
only `framer-motion`/`lucide-react` beyond the framework), and most popular date-picker libraries
at evaluation time had peer-dependency ranges capped below React 19, risking install friction.
The actual UI requirement (single-month grid, month nav, year-jump, Today/Clear) is a small,
well-bounded amount of code to hand-roll correctly. On inline-vs-portal positioning: 6 of the 8
call sites render inside `Modal` (`overflow-y-auto`, `max-h-[90vh]`) — an inline-`absolute`
popover risks being clipped by the modal's scroll boundary the moment it needs to render below
the visible area (e.g. the last field in a form). Portaling to `document.body` with
viewport-relative (`position: fixed`) coordinates sidesteps that entirely, independent of where
in the DOM tree the trigger sits.
Alternatives considered: `react-day-picker` or similar library; positioning the popover
`absolute` within its own DOM subtree instead of via a portal; reposition-on-scroll instead of
close-on-scroll.
Why rejected: A library adds a dependency and a React-19 compatibility question for a
requirement this small. Inline `absolute` positioning would still be clipped inside `Modal`,
defeating the purpose of the fix. Reposition-on-scroll needs a scroll listener on every ancestor
scroll container and recomputes on every scroll event — meaningfully more code and a class of
subtle bugs (stale rects during momentum scroll) for a feature whose value is "small and calm";
closing on scroll matches how native `<select>`/date popups already behave, so it's not a UX
regression versus what was replaced.
Notes: New files — `src/components/ui/date-grid.ts` (pure calendar math: month-grid generation,
local-time-safe `toISODate`/`parseISODate` that avoids a UTC-shift-by-one-day bug near midnight
for timezones behind UTC, e.g. all of India; 17 unit tests), `usePopoverPosition.ts` (the
rect-based positioning hook, reusable for any future anchored popover), `DatePicker.tsx`,
`DateTimePicker.tsx` (composes `DatePicker` with a native `<input type="time">` — the time
spinner's popup is small and wasn't the placement complaint, so it stays native). `FieldWrap` was
exported from `Field.tsx` (was module-private) so the new components share the exact same
label/wrapper markup as `Input`/`Select`. Migrated all 8 call sites
(family/profile DOB, lab-reports/medical-records/prescriptions/doctor-prescriptions visit dates,
the doctor daily-visits queue-date filter, reminders' date-&-time) with the `onChange` signature
changed from a synthetic event to a plain string value (`(value: string) => void`) — a
one-line-per-call-site change, chosen over faking a `ChangeEvent` object to preserve
`e.target.value` syntax. Because the date trigger is a `<button>`, not a native form control, a
`required` field no longer gets browser constraint validation from the date half — the one
call site using `required` (`reminders/page.tsx`) now validates the value explicitly before
submit. Keyboard support ships with click-to-select and Escape-to-close only for v1; arrow-key
day navigation (roving tabindex per the ARIA APG date-picker pattern) is deferred. The
`date`/`datetime-local`-specific CSS in `globals.css` (added for the earlier `color-scheme` fix)
was removed as dead code; the `time`-only rules remain.

Date: 2026-07-02
Decision: The health Timeline is aggregated on read from the patient's prescriptions, medical
records, and lab reports — it does NOT write or read its own `TimelineEvent` rows.
Reason: Aggregation can never drift out of sync with the underlying records, reflects deletes
automatically, needs no write path in every create-service (nor transaction coupling), needs no
migration, and immediately surfaces records that already existed before the feature shipped.
Alternatives considered: Writing a `TimelineEvent` row inside each record/prescription/lab-report
create transaction (as the original docs suggested), with matching deletes.
Why rejected: Invisible for pre-existing records, adds a maintenance-prone write path to every
module, and risks drift/orphans.
Notes: `src/features/timeline/timeline.service.ts` maps each source row to the `TimelineEvent`
shape with type-prefixed ids (`prescription:`/`medical_record:`/`lab_report:`) and snake_case
`referenceType` values the timeline UI maps to icons. The `TimelineEvent` table stays reserved for
future custom events; reminders are intentionally excluded (operational/recurring, not history).

Date: 2026-07-02
Decision: Record "export" is a per-record download of the original file via signed access
(`GET /medical-records/:id` and `GET /lab-reports/:id` return the record with a signed `fileUrl`;
the frontend downloads it). A `GET /lab-reports/:id` route was added (the stub only had DELETE).
Storage stays on local disk behind the `@/lib/storage` abstraction.
Reason: Matches the MVP need (patients get their file back), honors "never expose raw private URLs,"
and keeps the S3/GCS swap a one-file change.
Alternatives considered: ZIP bundle of all records, a generated combined-PDF summary, wiring a real
cloud bucket now.
Why rejected: Added scope/dependencies not needed for the MVP; deferred.
Notes: Client helpers in `src/lib/download.ts`. Also fixed two latent validation bugs surfaced while
wiring these: date fields used `z.string().datetime()` (rejects the `YYYY-MM-DD` our DatePicker
emits) → new `dateString` in `src/lib/validation.ts`; and `fileUrl` used `z.string().url()` (rejects
the relative `/uploads/…` path our upload returns) → `z.string().min(1)`.

Date: 2026-07-02
Decision: Family Members is deferred to its own later pass; `familyMemberId` on medical records /
lab reports / timeline is an optional pass-through with no ownership validation for now.
Reason: Product-owner request to ship records/reports/timeline first; no family members can be
created until that pass, so no invalid id can be supplied via the UI meanwhile.
Alternatives considered: Building family members in the same pass and validating `familyMemberId`.
Why rejected: Explicit scope decision to keep this pass focused.

Date: 2026-07-02
Decision: A first, config-only security-hardening pass — HTTP security headers, centralised
environment-variable validation (with production-only rejection of placeholder/weak secrets),
a boot-time env check via Next's `instrumentation.ts`, and documenting the production
`DATABASE_URL` TLS (`?sslmode=require`) pattern in `.env.example`. No schema or API changes.
Reason: The app is not production-ready and stores unencrypted PHI, but several hardening measures
are cheap now and pay off later without derailing MVP scope. Security headers and boot-time
validation are annoying to retrofit under deadline; having them from the MVP makes production
hardening incremental. Centralising env access into one pure module (`src/lib/env.ts`) removes the
secret-loading logic duplicated between `auth.ts` and `middleware.ts` and gives future secrets (AI
keys, SMS tokens) a single validation home.
Alternatives considered: (a) Doing nothing until a dedicated pre-production security sprint;
(b) also implementing field-level encryption of health data at rest and migrating auth tokens from
`localStorage` to httpOnly cookies in the same pass.
Why rejected: (a) leaves free, low-risk wins on the table and makes the eventual sprint larger;
(b) field-level encryption adds real schema/query complexity (encrypted columns can't be filtered
or searched normally) for an MVP with no real patient data yet, and the httpOnly-cookie migration
touches the auth flow, middleware, and CSRF handling — both are deferred as their own scoped tasks
rather than bundled into a config-only pass.
Notes: `requireSecret` (in `src/lib/env.ts`) enforces its checks only when `NODE_ENV === "production"`,
so local dev and Vitest (which injects valid-length test secrets) are unaffected. The placeholder
set already lists `AI_API_KEY`/`AI_MODEL`, so those are covered the moment they're wired into
`validateEnv()`. HSTS is emitted always but is inert over plain HTTP, so it only takes effect once
the app is served over TLS. Database-connection TLS itself is validated only for presence of
`DATABASE_URL`, not enforced to use SSL — that stays a deployment/config responsibility, documented
in `.env.example`. Field-level PHI encryption and the httpOnly-cookie token migration remain open
pre-production items (tracked in `progress.md` → Known Issues).

Date: 2026-07-02
Decision: Implemented `ai.service.ts` (`generateSummary`/`extractData`, previously
`throw new Error("not implemented")`) around a mandatory redaction gateway
(`src/features/ai/gateway.ts`): every AI call is consent-gated (`User.aiConsentAt`), redacts PII/PHI
before any text reaches the LLM, and writes an append-only `AuditLog` row. Scoped deliberately small
for a 10–15-user pilot: synchronous processing (no job queue), local-disk storage (no S3), the
first-party Anthropic API (no Bedrock), no field-level encryption, and no embeddings/RAG.
Reason: The app processes real patient medical documents; sending raw identifiers to a third-party
LLM is both a DPDPA/privacy risk and against `CLAUDE.md`'s "AI output must be cautious" rule if
mishandled. A full production architecture (Bedrock in an India region, KMS envelope encryption,
pgvector/embeddings, an async queue, Presidio as a required — not optional — sidecar) was designed
and reviewed, but the actual near-term deployment target is 10–15 users under a small budget, where
that infrastructure is pure overhead with nothing to protect yet (no real queue depth, no scale
requiring async processing, no volume justifying a GPU-backed embeddings service).
Alternatives considered: (a) Build the full production architecture now; (b) skip redaction
entirely for the pilot and add it before a wider launch.
Why rejected: (a) most of that infrastructure (queue, KMS, S3, pgvector, Bedrock) has no pilot-scale
justification and would sit idle — building it now is speculative complexity with a real dollar
cost. (b) is not acceptable: redaction is the one piece that is not optional at any user count,
since it's the boundary between "our infra" and "third-party LLM" for real PHI — this is built in
full, not cut.
Notes: Structured Indian identifiers (Aadhaar, PAN, ABHA, phone, email, date) are redacted by regex,
in-app, with no dependency (`redact.ts`, unit-tested — asserts no raw identifier survives, clinical
content like lab values is preserved, and the tokenize/rehydrate round-trip is lossless). Names and
addresses need NER, not regex — that's the optional Presidio analyzer container (`presidio.ts`,
`docker-compose.yml`); it's off by default (`PRESIDIO_URL` unset) so a fresh checkout doesn't
require Docker just to hit the AI endpoints, but means **names are not redacted until it's turned
on** — flagged in `progress.md` as a real gap, not a footnote. The redaction token map is
request-scoped and lives in memory only; it is never persisted, so there is nothing to encrypt or
expire. OCR (scanned/image documents) is not wired — `extract-text.ts` reads a PDF's text layer or
plain text only and throws a clear error otherwise, rather than silently producing garbage from an
empty extraction. There is currently no endpoint/UI to set `User.aiConsentAt`, so the feature is
built but not yet reachable by a real user — tracked as the top "What's Next" item in
`progress.md`. New deps: `@anthropic-ai/sdk`, `pdf-parse` (v2 API — ships its own types; do not
add `@types/pdf-parse`, which targets the incompatible v1 shape). Schema additions:
`User.aiConsentAt`, `LabReport.extractedDataJson`, `AuditLog` (no FK to `User`, by design — the
audit trail must survive account deletion). Migration `20260702124042_ai_redaction_pilot`. The
larger production architecture (Bedrock/Mumbai residency, KMS, pgvector/RAG chatbot, async queue)
remains the documented scale-up path, not abandoned — revisit once user count or compliance
requirements justify the added infrastructure.

Date: 2026-07-03
Decision: Added `serverExternalPackages: ["pdf-parse", "pdfjs-dist"]` to `next.config.ts`, and added
`howtos/ai-pii-reduction-test.md` — a manual, step-by-step guide to verify PII/PHI redaction with
real captured request/response examples (including a local mock-LLM capture point via
`AI_BASE_URL`).
Reason: While manually testing the redaction gateway end-to-end, `POST /ai/summary` and
`/ai/extract` returned a `500` — `TypeError: Object.defineProperty called on non-object` — for
**every** request, including a plain `.txt` file with no PDF involved. Root cause: `pdf-parse`'s
dependency `pdfjs-dist` assumes a plain Node `require` and breaks when Next.js's route-handler
webpack bundler tries to bundle it; the crash happens at module-import time (`extract-text.ts`'s
top-level `import { PDFParse } from "pdf-parse"`), before the code ever checks the file's mime
type. This was a real production bug shipped in the previous pass (2026-07-02), not a test-setup
mistake. Once found, the fix (`serverExternalPackages`) and a repeatable way to prove the fix and
the redaction guarantee together were both needed, since the original guidance for testing this
feature (Prisma Studio GUI clicks for consent/fixture setup) was also the likely reason a prior
manual attempt silently stalled.
Alternatives considered: (a) Lazy-`require()` `pdf-parse` only inside the PDF branch of
`extract-text.ts`, instead of the Next.js config change; (b) leave redaction testing undocumented
and rely on `redact.test.ts` alone.
Why rejected: (a) a lazy `require` inside the function body would dodge the _module-eval-time_
crash for non-PDF files, but a real PDF upload would still hit the exact same
webpack-bundling failure the moment `pdf-parse` is actually invoked — it only hides the bug for
the common case, it doesn't fix it. `serverExternalPackages` is the documented Next.js mechanism
for exactly this class of package (native Node deps that don't survive bundling) and fixes both
cases. (b) `redact.test.ts` proves the tokenizer's logic in isolation but can't catch a bundling
crash in the route handler — an end-to-end guide is the only way to verify the actual API surface,
and it's also the guide new contributors will use to re-verify the redaction guarantee by hand
after any change to the AI pipeline.
Notes: Confirmed fixed by re-running the exact request that crashed before, with a full server
restart (config changes are not hot-reloaded) — see `howtos/ai-pii-reduction-test.md`. The guide's
Step 6/7 use direct SQL (`psql`) instead of Prisma Studio for granting AI consent and creating the
test `LabReport` row, specifically because the GUI approach is easy to fumble silently (wrong row,
forgot to save) with no clear error — SQL is idempotent and copy-pasteable. The guide also
documents, as an observed (non-security) cosmetic artifact, that Presidio's detected span for a
name can swallow a trailing newline (`<PERSON_1>Phone:` instead of `<PERSON_1>\nPhone:`) — not a
redaction leak, just a formatting quirk, left as-is.

## Lab-report OCR, Presidio-on-by-default, and consent-as-a-profile-field

Date: 2026-07-03

Three decisions taken to make the AI feature usable end-to-end for the patient MVP:

- **OCR engine: self-hosted `tesseract.js` (`eng+hin`), not Claude vision.** Photographed/scanned
  reports are the common case, so `extract-text.ts` now falls back to OCR (images, and no-text-layer
  PDFs rasterized via the already-installed `pdfjs-dist` + `@napi-rs/canvas`). Chose local OCR over
  sending the raw image to a vision model because the golden rule requires PII to be redacted from
  **text** before any LLM call — pixels can't be pre-redacted, so OCR must produce text on-box first.
  Traineddata is committed under `tessdata/` (read via `langPath`) so nothing is fetched at runtime.
  `sharp` normalizes (grayscale + upscale) before OCR. Deferred: Devanagari-script _name_ detection
  (needs a Hindi NLP model in Presidio) and fuzzing the ID regexes for badly-garbled photos
  (measure-first — a proof test asserts legible OCR is redacted).
- **Presidio (name/address NER) is on by default and fails closed.** `PRESIDIO_URL` is now set in
  `.env.example`; without it, names on a lab-report photo would reach the LLM. If it's configured
  but unreachable, `runGateway` throws `AiError(503)` rather than send un-redacted names — a
  deliberate fail-closed choice at the PII boundary. Language is an env knob (`PRESIDIO_LANGUAGE`,
  default `en`, which catches Latin-script names — the common case on Indian reports).
- **AI consent is a `User` profile field, not a new endpoint.** `PATCH /users/profile { aiConsent }`
  sets/clears `aiConsentAt` (via a pure, unit-tested `consentTimestamp` mapper). Reused the existing
  profile endpoint rather than adding `POST /ai/consent` — consent is a user attribute, and the
  profile page is where it's managed; the Lab Reports page grants it inline via a point-of-use modal.
- **AI failures never escape as a bare 500.** The LLM call is wrapped (`AiError` 502), the AI routes
  return JSON errors for any unexpected exception, and `apiFetch` tolerates a non-JSON body — a
  down dependency (mock/real LLM, Presidio) now shows a clean message instead of crashing the client.

Date: 2026-07-06
Decision: Prescription reminders switched from one `repeatType: "daily"` row per (medicine, dose
slot, food) to individual pre-generated instances (one row per course-day per dose); locked them
against patient edit/delete/early-complete; added meal-timing-change rescheduling scoped to
tomorrow-or-later instances; and added an optional post-registration onboarding step plus
`wakeUp`/`bedtime` fields (store/display-only) on `mealTimings`. No schema migration for any of
this — `mealTimings` stayed the same `Json?` column, and `courseEndDate`/`repeatType` are existing
`Reminder` fields just no longer used the same way for prescription rows.
Reason: User request, four parts. (1) Individual instances give real per-dose completion history
and audit trail, which a single repeating row can't (there's nothing to "complete" per-day when
occurrences are computed on the fly). (2) Prescription reminders are clinical instructions, not a
patient's own todo list — allowing edit/delete/early-complete let a patient silently mark a dose
"taken" without taking it, or delete the record of a missed one. (3) The patient explicitly wanted
a real, worked example of "change breakfast time -> future doses shift, today's doesn't" — a
retroactive-safe rebuild was the concrete requirement, not just a preference in the abstract. (4)
Setting timings during onboarding (vs. only discovering the Profile page later) means a patient's
first prescription already gets personalized times instead of the generic defaults.
Alternatives considered: keeping the daily-repeating model and only changing UI permissions;
storing wake-up/bedtime in a reshaped `mealTimings` structure with new dose-slot support;
rescheduling ALL instances (including past/today) on a preference change; a dedicated
`/onboarding` endpoint.
Why rejected: the daily-repeating model has no place to record "this specific Tuesday's dose was
taken" — it only tracks reminder-level state, not occurrence-level, so real completion auditing
needs materialized rows regardless of the UI-permission question. A dose-slot reshape for
wake-up/bedtime was explicitly declined by the user after discussing that neither is a meal with a
before/after-food axis — nothing in the current dose model would consume them, so the reshape
would add complexity with no immediate payoff (revisit only when a feature needs them). Rewriting
past/today instances on a preference change would silently alter a patient's medication history
after the fact — the same "never rewrite history" principle already applied to reminder editing
elsewhere in this app. A dedicated onboarding endpoint would duplicate `PATCH /users/profile`'s
exact body shape for no benefit.
Notes: `buildPrescriptionReminders` (`prescription-reminders.ts`) now loops course-day × unique
dose and drops instances before `referenceNow`; medicines with no `quantity` are skipped (no
open-ended reminders). New `reschedulePrescriptionReminders` (`reminders.service.ts`) queries
distinct `prescriptionId`s among the user's active reminders with `scheduledAt >= tomorrow`,
regenerates from each prescription's original `visitDate ?? createdAt` anchor, and swaps in only
the future-dated rows — called inside `updateProfile`'s transaction. `deleteReminder` now throws
`ReminderError(403)` when `prescriptionId` is set; the reminders page hides delete unconditionally
for these rows and hides the complete action until the reminder's bucket is "pending". Removed the
now-dead `firstSlotOccurrence` (`reminder-schedule.ts`) — no caller needed a "roll forward from a
single anchor" helper once generation walks each course-day directly. Onboarding step lives in
`register/page.tsx` as a third step after OTP verification; "Skip for now" and any save failure
both continue to the dashboard (best-effort, non-blocking — the patient can always set timings
later from the Profile page). No test infra exists for Prisma-transaction functions in this repo,
so `reschedulePrescriptionReminders` was verified manually end-to-end instead of unit-tested
(see `progress.md`).

Date: 2026-07-07
Decision: Audited the reminder feature end-to-end against the intended Upcoming → Active →
Completed lifecycle and fixed a live-breaking classification bug plus four spec gaps in one pass:
(1) `classifyReminder` was comparing `reminder.status !== "pending"` against data that is always
written as `"active"` — every reminder therefore fell into the `completed` bucket and the
Active/Upcoming tabs were permanently empty; fixed by comparing against `"active"` and renaming the
bucket/tab/i18n key from `pending` to `active` throughout. (2) `buildPrescriptionReminders` kept a
same-day dose whose clock time had already passed (surfacing it as instantly "overdue"); it now
skips that slot for today and shifts the whole course forward one day, preserving the exact dose
count instead of losing or front-loading one. (3) Dismissing a reminder previously either did
nothing server-side (prescription reminders) or silently ended the reminder's local due-state
(manual one-time reminders); added a real dismiss/retry policy — 2 retries, 5 minutes apart,
modeled on an SQS dead-letter-queue redrive — so a dismissed medication reminder always resurfaces
and is never silently completed. (4) `reschedulePrescriptionReminders` deleted and rebuilt a
prescription's entire future course on every meal-timing change; it now re-times each future row
in place using new `doseSlot`/`doseFood` columns, so a preference change can't accidentally change
row counts or drop history. Also added client-side pagination (7/page, per-tab position, measured
grow-only list height so the pagination bar doesn't jump) to the reminders page.
Reason: A direct request to make the reminder engine "production-grade" with a deterministic,
one-directional lifecycle (Upcoming → Active → Completed, never backward), matching a worked
example (a course prescribed at 3:00 PM should start its night dose today and its morning dose
tomorrow, 10 total reminders, none in the past). The audit found the bucketing bug was already
live and breaking the feature for every user before any of the requested behavior changes.
Alternatives considered: For dismiss/retry, keeping retry state in `localStorage` only (rejected —
fails the explicit "survive app restarts and work across devices" requirement, so it was pushed
into two new DB columns instead); for the reminders-page layout, three simultaneous stacked
sections instead of the existing tab switcher (rejected by explicit user choice — keep the tabs,
just rename Pending → Active); for the pagination height fix, first tried a hardcoded
`min-h-[760px]` guess and then invisible filler DOM rows — both rejected after the user reported
the position still moved (the guessed pixel height didn't match real rendered card height); settled
on measuring the list's actual `scrollHeight` via a ref and keeping the tallest value seen
(grow-only), which is correct regardless of card height, text wrapping, font, or zoom.
Notes: Migration `20260707111658_reminder_retry_and_dose_fields` adds `Reminder.retryCount`
(`Int @default(0)`), `snoozedUntil`/`doseSlot`/`doseFood` (all nullable). `MAX_RETRIES = 2` and
`RETRY_DELAY_MS = 5 * 60_000` live in `reminders.service.ts`. `listReminders` now joins
`prescription.diagnosis` as `prescriptionDiagnosis` on each row so the notification popup can show
it as "instructions" without a second request. Three new unit tests in
`prescription-reminders.test.ts` pin the exact worked example from the request (10 reminders,
correct dates, none scheduled at/before the prescribed-at moment). The dismiss/retry branch of
`updateReminder` and the rewritten `reschedulePrescriptionReminders` remain manually verified only
(no Prisma-mocking test infra in this repo, consistent with the 2026-07-06 entry) — verified live
against a real doctor/patient/prescription flow on the local dev DB, including all 3 dismiss
retries and a meal-timing change. See `progress.md` for the full change list and updated Known
Issues.

Date: 2026-07-08
Decision: (1) Added a lab-report-specific summary prompt (`LAB_SUMMARY_SYSTEM` in `ai.service.ts`)
that asks the LLM for a structured, patient-friendly summary — `## Overall Summary`, `## Key
Findings`, `## Abnormal Results`, `## Normal Results`, `## Follow-up` (with two fixed conditional
closing lines) — instead of the previous free-form "3-5 short sentences." Only `sourceType ===
"lab_report"` uses it; `medical_record` summaries keep the original generic `SUMMARY_SYSTEM`
prose prompt. Added `markdown-to-jsx` (new dependency) to render the structured summary as
headings/bullets on the Lab Reports page instead of raw `##`/`*` text. (2) Switched `llm.ts` from
the first-party `@anthropic-ai/sdk` client to a plain `fetch` call against OpenRouter's
OpenAI-compatible `/chat/completions` endpoint, and moved `AI_MODEL` to an OpenRouter free-tier
model (`google/gemma-4-26b-a4b-it:free`). Removed the now-unused `@anthropic-ai/sdk` dependency.
Reason: (1) The terse prose summary wasn't the "insightful" patient-facing output the product
needed — a fixed section structure (findings/abnormal/normal/follow-up) is more scannable and
matches how a lab report is actually read. (2) The user explicitly wants to avoid per-call LLM
cost at MVP/pilot scale and already had an OpenRouter key; OpenRouter's free-tier models are $0,
whereas the first-party Anthropic API bills per token from the first request.
Alternatives considered: (1) Rewriting the prompt without markdown (plain section labels in a
`whitespace-pre-wrap` block) to avoid adding a rendering dependency; a hand-rolled ~30-line
markdown-ish parser instead of a library. (2) Keeping `@anthropic-ai/sdk` and pointing its
`baseURL` at OpenRouter; staying on the mock LLM server for the pilot instead of a real (free)
model.
Why rejected: (1) The fixed fallback and hand-rolled-parser options were both rejected by the user
in favor of a real markdown renderer (`markdown-to-jsx`) — small, dependency-light, and robust to
whatever markdown the model actually emits, versus a parser that could mangle unexpected output.
(2) `@anthropic-ai/sdk`'s `messages.create()` implements the Anthropic Messages API contract,
which OpenRouter does not speak (it's OpenAI-schema `/chat/completions`) — pointing the SDK's
`baseURL` at OpenRouter would send Anthropic-shaped requests to an endpoint that doesn't understand
them, not just relocate the same calls. Staying on the mock was rejected because canned responses
don't reflect real documents and don't demonstrate the feature's actual value to the user.
Notes: `llm.ts`'s `complete(system, content, maxTokens)` signature is unchanged, so `gateway.ts`
needed no edit — `AiError` 502 on failure still applies the same way. `AI_BASE_URL` keeps its
original purpose as a test-only full-URL override (now overriding the OpenRouter endpoint instead
of the Anthropic client's `baseURL`); `scripts/mock-llm-server.js` returns an Anthropic-shaped
response body and would need updating separately if mock-mode testing is wanted again with the new
provider — not done in this pass. **Free-tier models are shared and can be rate-limited upstream**
(observed directly while testing: `google/gemma-4-26b-a4b-it:free` and
`meta-llama/llama-3.3-70b-instruct:free` both returned `429` with a `retry_after_seconds` hint
under normal testing load) — this is an OpenRouter free-tier characteristic, not a bug in the
gateway; `gateway.ts` already surfaces any `complete()` failure as a clean `502` rather than
crashing. Updated `.env.example`, `docs/architecture.md`, and `docs/ai-architecture.md` to
describe OpenRouter instead of "first-party Anthropic API."

Date: 2026-07-08
Decision: Redesigned the Lab Report feature into an AI-assisted flow (UI/UX-focused) with four
architecture choices, without touching the OCR / PII-redaction / summary / extract logic. (1) Added
a new pre-save `POST /ai/analyze` endpoint (`analyzeMetadata`) that OCRs the just-uploaded file and
returns `{ testName, labName, reportDate, documentType, confidence, lowConfidenceFields }` to
auto-fill the Add-Lab-Report form before the record is saved — routed through the existing
`runGateway` chokepoint, keyed on the `fileUrl` for the audit row since no record id exists yet.
(2) Confidence is an authentic extraction-quality heuristic (fields-returned + OCR-text quality),
persisted on a new nullable `LabReport.extractionConfidence` column; the OCR module is not modified.
(3) The structured summary UI parses the existing summary Markdown client-side into cards — the
Summarize and Extract actions stay separate (Extract keeps driving `LabResultChart`). (4) The
511-line `lab-reports/page.tsx` was split into components under `src/components/lab-reports/`.
Reason: The product owner asked for a polished, AI-assisted experience that minimizes manual entry
and communicates AI confidence, with an explicit constraint not to change the working OCR/redaction/
LLM pipeline. Pre-save auto-fill needs OCR+LLM on a file that isn't a saved record yet, which the
existing `/ai/summary` and `/ai/extract` (both require a saved `sourceId`) can't serve — a new
endpoint was the clean fit and was explicitly permitted. Confidence had to come from somewhere
authentic since none exists in the pipeline; a field-completeness + OCR-quality heuristic is honest
about what it measures, whereas asking the LLM to self-rate is poorly calibrated theatre. Parsing
the summary Markdown avoided changing the (frozen) summary prompt while still yielding card-based UI.
Alternatives considered: (a) save-first then patch metadata via `/ai/extract`, or a manual
"Auto-fill" button, instead of a pre-save analyze endpoint; (b) surface Tesseract's real OCR
confidence, or an LLM self-reported confidence, instead of the heuristic; (c) auto-run Summary +
Extract together so abnormal/normal cards get structured reference-range data; (d) keep everything
inline in `page.tsx`.
Why rejected: (a) the product spec explicitly wanted "review the auto-filled fields before Save,"
which save-first can't give; the user chose the pre-save endpoint. (b) surfacing Tesseract
confidence means editing the frozen `ocr.ts` (out of scope by constraint), and LLM self-rating isn't
trustworthy — the user asked for "integrity and authenticity," which the grounded heuristic serves.
(c) the user explicitly wanted Summarize and Extract to stay independent ("the extract one just
extracts data, nothing related to summary"), so the summary view is built purely from the summary
Markdown. (d) the monolith was already 511 lines and would exceed 700; the user approved the split.
Notes: New files — `src/app/api/v1/ai/analyze/route.ts`, `src/features/ai/extraction-confidence.ts`
(+ test), `src/features/lab-reports/parse-summary.ts` (+ test), and seven components under
`src/components/lab-reports/`. `METADATA_SYSTEM` prompt + `analyzeMetadata` added to `ai.service.ts`
(existing `generateSummary`/`extractData` untouched); `aiAnalyzeSchema` added to `ai.schema.ts`.
Migration `20260708071547_lab_extraction_confidence` (nullable `LabReport.extractionConfidence`).
The analyze call uses `maxTokens: 1500` — the OpenRouter reasoning model (`nemotron-nano-9b-v2:free`)
consumed a 500-token budget entirely on reasoning and returned empty `content`. Known limitation
recorded in `progress.md`: the redaction gateway can strip a report date or lab/location name before
the LLM sees it, so those fields can auto-fill as null/low-confidence (by design — the field stays
editable, date defaults to today). Two requested items were deliberately skipped: "Edit Metadata"
(needs a `PATCH /lab-reports/:id` that doesn't exist) and low-confidence "suggestion dropdowns" (no
alternate candidates come back from the backend). `docs/api-contracts.md` and
`docs/database-schema.md` updated for the new endpoint and column.

Date: 2026-07-08
Decision: Lab-report summary card UX polish (UI-only): (1) the rendered summary is collapsible,
collapsed by default behind a toggle, with expand state persisted per report in `localStorage`
(`sr:labSummaryExpanded`); (2) while a summary generates, an animated 5-step checklist
(`SummaryProgress`) plays in place of the generic loader; (3) "Download Summary" now exports a
formatted PDF (via a new `jspdf` dependency), replacing the previous Markdown (`.md`) export.
Reason: The full summary made every report card very tall (collapse keeps the list scannable); the
generic spinner gave no sense of progress (the checklist makes the AI processing feel transparent);
and a Markdown file isn't something a patient can hand to a doctor — the user explicitly asked for
a professionally formatted, printable/shareable PDF and explicitly "do not export Markdown or plain
text."
Alternatives considered: (a) browser print-to-PDF (`window.print()` on a styled print view, zero
deps) or `@react-pdf/renderer` instead of jsPDF; (b) reflecting real per-step pipeline timing in the
progress checklist rather than a cosmetic timer; (c) keeping the summary always-expanded.
Why rejected: (a) `window.print()` isn't a real one-click download (it opens the browser dialog and
depends on the user choosing "Save as PDF") and gives weak, browser-dependent control over
page-breaks/footer/margins — the user chose jsPDF for a true download with full layout control;
`@react-pdf/renderer` is a much heavier dependency for the same result. The repo is deliberately
dependency-lean, so adding jsPDF was confirmed with the user before proceeding. (b) the summary is a
single blocking `POST /ai/summary` request — there's no streamed per-step signal to reflect, so the
checklist is cosmetic-by-design (the same honest pattern already used by the upload `StagedLoader`);
faking precise backend timing would be dishonest, not more accurate. (c) always-expanded is the
current pain point being fixed.
Notes: New files — `src/components/lab-reports/SummaryProgress.tsx`,
`src/features/lab-reports/summary-pdf.ts` (+ `__tests__/summary-pdf.test.ts`). `jspdf` is imported
**dynamically** inside `summary-pdf.ts` so it never enters the initial client bundle or SSR — it
loads only when the user clicks Download; `/lab-reports` shared first-load JS is unchanged (~102 kB).
`buildSummaryPdf` is split from the `downloadSummaryPdf` side-effect so the layout is unit-testable
(the smoke test asserts a valid `%PDF` header + non-empty output). PDF section labels/footer come
from `t(...)`, so the document is localized (EN/HI). No backend, schema, API, or AI-pipeline change.
The collapse animation and the actual in-browser file download were not automated (no
puppeteer/playwright in the repo; not worth adding for verification) — verified via
types/lint/build/render + the PDF-generation unit test, with the interactive bits left for a manual
browser check.

Date: 2026-07-08
Decision: Lab-report workspace redesign (UI-only): (1) merge the AI summary and extracted data into
one in-card tabbed workspace (**AI Summary | Lab Values**) instead of an inline summary + a separate
full-screen extracted-data modal; (2) render extracted values as a single flat table (one row per
biomarker: Test · Result · Reference Range · Status) instead of a card-per-field grid with a
LOW/NORMAL/HIGH range bar on every value; (3) move the "why can't this value be judged" detail
(unverified OCR / no reference range) into a small **info icon with a native `title` tooltip** in the
Status column, dropping the large per-row warning cards; (4) remove the inline AI "interpretation"
text per row (kept only in the PDF export); (5) trim the summary action bar to View Original /
Download Summary PDF / Regenerate.
Reason: The user's brief said the extracted-data experience felt fragmented and too tall — too many
nested boxes, a heavy modal, and an oversized range visual repeated for every value. A flat table
with abnormal-first sorting and a single report-level quality badge is far more scannable and reads
as a clinical dashboard. The user explicitly asked to remove the range-bar dropdowns and the loud
error blocks, and to replace them with a hover info icon.
Alternatives considered: (a) a right-side slide-over panel or keeping the redesigned content in a
modal, rather than in-card tabs; (b) a per-row **Confidence %** column as the brief's mockup showed;
(c) a CSS/JS-positioned styled tooltip instead of the native `title` attribute; (d) keeping row
expansion for the AI interpretation text.
Why rejected: (a) reports render as a vertical list of cards, so a per-card slide-over/modal is
awkward and disruptive — an in-card tab keeps context and matches the brief's "collapsible section
inside the summary workspace" option (confirmed with the user). (b) there is **no per-test confidence
stored** — `ExtractedTest` has only name/value/unit/referenceRange/flag; status and verified are
derived at render, and the only real scores are the report-level `extractionConfidence` and the
derived `computeValuesQuality().score`. Showing a fabricated or repeated-per-row % would be
dishonest, so per-row signals are a derived Status chip + verified/info indicator, with one
report-level quality badge in the header (confirmed with the user). (c) a positioned tooltip is
clipped by the table's `overflow-x-auto` container and needs extra JS/CSS; the native `title`
attribute renders outside any overflow, works on hover, is keyboard/AT-reachable via `aria-label`,
and is one line — the lazy correct choice. (d) the matched interpretation text just restated the
row (value + range) and cluttered the table; the user asked for it to be removed, so it now lives
only in the PDF.
Notes: New file `src/components/lab-reports/ExtractedValuesTable.tsx`. Removed
`LabResultChart.tsx` and the short-lived `ExtractedDataModal.tsx` / `ExtractedValueCard.tsx`. All
derivation utils (`lab-values.ts`, `extracted-values.ts`) and the PDF/CSV/copy exporters are reused
unchanged. New EN/HI i18n keys under `labReportsAi`. No backend, schema, API, or AI-pipeline change.
Typecheck, lint, 36 lab-report/AI tests, and `next build` all green; tab switching and the hover
tooltip are left for a manual browser check.

Date: 2026-07-09
Decision: Medical Records classification is stored as a new `documentType` column (a
`document-types.ts` registry key), with the existing `category` kept as a coarser group derived
from it (`groupFor(documentType)`), rather than replacing `category` or splitting the concept
across two independent free-text fields.
Reason: Keeps `category` meaningful and backward-compatible for existing records/queries while
giving classification its own precise, registry-validated slot. A config-driven registry (not an
enum, not a hardcoded switch) matches the rest of the schema's plain-`String` convention (there
are no Prisma `enum`s anywhere in this schema) and is the only file that needs a new line when a
document type is added later.
Alternatives considered: Add a `documentType` column and drop/repurpose `category` entirely;
store classification as a Prisma `enum`.
Why rejected: Dropping `category` would be a breaking change for the 5 pre-existing hardcoded
categories on records saved before this pass. An `enum` requires a migration for every new
document type, defeating the "config-driven, add-a-line" goal the feature spec calls for.
Notes: Confirmed with the user before implementation (asked directly rather than assumed).

Date: 2026-07-09
Decision: Medical Records Phase 1 ships document classification + general metadata extraction
only — no per-type AI summary generation, no per-type extracted-data tables/display, in this pass.
Reason: The feature spec explicitly scopes Phase 1 to "architecture and foundation" — establishing
the document-type abstraction and reusing the OCR/redaction/LLM pipeline cleanly — and defers
document-specific extractors/summaries to subsequent phases. Building summary generation for 21
document types in one pass would be per-type work disproportionate to a foundation phase.
Alternatives considered: Also wire an on-card AI-summary action (reusing `generateSummary`, which
already accepts `sourceType: "medical_record"`) using the existing generic prompt.
Why rejected: The generic prompt isn't per-type (the spec explicitly says "each document type
should have its own prompt template — do not use one generic summarization prompt"), so wiring it
now would ship something the spec says not to, and would need to be redone once per-type prompts
land. Confirmed with the user before implementation.
Notes: `document-types.ts` reserves `summaryPrompt?`/`metadataFields?` fields per type, left
`undefined`, as the extension seam for the deferred phase.

Date: 2026-07-09
Decision: Medical Records Phase 2 processes clinical documents through ONE shared, config-driven
base (`clinical.registry`/`.schema`/`.prompt`/`.processor` + a `ClinicalSectionsView` renderer),
configured per type by a section list, rather than a per-type implementation or a big switch. Only
three clinical types are implemented (`doctor_note`, `consultation_note`, `history_physical`);
others stay registered but non-processable.
Reason: The phase's goal is a reusable foundation, not breadth. All clinical notes share the same
shape (named narrative/list sections + a summary), so one base configured by data eliminates
duplicated prompt/schema/renderer logic and makes adding a type a single registry entry.
Alternatives considered: A processor/prompt/renderer per document type; a switch on documentType.
Why rejected: Both duplicate near-identical logic and grow linearly with each new type; the spec
explicitly forbids large switch statements and asks for a registry/factory.
Notes: Extraction is validated/coerced (`validateSections`) — unknown keys dropped, missing nulled,
never invented. Confirmed with the user before building.

Date: 2026-07-09
Decision: Clinical processing is on-demand (a "Process document" button → `POST
/medical-records/:id/process`), not automatic on upload; and raw OCR text is never persisted.
Reason: Matches the Lab Reports on-demand pattern, keeps the upload/classify pipeline untouched
(a Phase 2 constraint), and avoids spending two LLM calls on every upload. Not storing OCR keeps
the "raw OCR immutable" requirement trivially satisfied (the uploaded file is the single immutable
source, re-OCR'd each run) and avoids a new unredacted-PHI-at-rest column.
Alternatives considered: Auto-process after save; cache the OCR text in a column to avoid re-OCR.
Why rejected: Auto-process adds cost/latency to every upload; caching OCR adds a plaintext-PHI
surface for a pilot-scale, synchronous flow where re-OCR is acceptable.
Notes: Both confirmed with the user before building. Efficiency win retained: a single OCR pass
feeds both the extraction and summary LLM calls.

Date: 2026-07-09
Decision: Medical Records search is scoped to the feature via `GET /medical-records?search=` backed
by a denormalized `searchText` column (structured sections + summary + metadata, lowercased), not a
global cross-feature search and not raw-OCR search.
Reason: The deliverable wants structured content (diagnosis, meds, physician, …) searchable "from
the record". A denormalized index is a real, cheap `contains` filter (no full-text preview flag or
`@@fulltext` needed) and deliberately excludes raw OCR so search hits clean structured data.
Alternatives considered: Client-side filter over fetched records; a global search bar spanning all
features; Postgres full-text / JSON querying.
Why rejected: Client-side can't search structured JSON without shipping it all; global search is a
much larger scope beyond this phase; full-text/JSON querying is heavier than a denormalized column
for pilot scale.
Notes: `searchText` is populated at process time; unprocessed records remain findable by
title/physician/sourceName.

Date: 2026-07-09
Decision: Medical Records Phase 3 adds a medication processor family (`prescription`,
`medication_list`) as a sibling of the Phase 2 clinical family, dispatched by a new `processing.ts`
(`processMedicalRecord`) that routes on `documentType`. `extractedDataJson` becomes a discriminated
union (`ClinicalExtraction | MedicationExtraction`, keyed by `kind`). The clinical processor is left
untouched; the dispatcher does one extra PK lookup to read `documentType`.
Reason: Keeps each family cohesive and the clinical code (already shipped + tested) unchanged, while
giving a single dispatch point the route calls. The `kind` discriminator was designed into Phase 2
exactly for this, so the card/renderer/timeline/PDF branch cleanly with no refactor.
Alternatives considered: Refactor clinical + medication into one shared skeleton with a strategy
object; make the route itself branch.
Why rejected: Merging skeletons would touch the shipped clinical processor for little gain (the
~15-line load/OCR/persist wrapper is not the duplication worth removing); a route-level branch
scatters dispatch logic and isn't unit-testable. The negligible extra PK lookup is worth the
isolation.
Notes: `medication/*` mirrors `clinical/*` (registry + one processor + one prompt builder + schema),
NOT the per-type `prescription.processor.ts`/`medication-list.processor.ts` files the spec sketched
— those would be near-empty boilerplate; both types differ only by registry config, consistent with
Phase 2. Confirmed the extracted-medications UX (click-to-expand table rows) with the user.

Date: 2026-07-09
Decision: Medication dosage/frequency are normalized deterministically (small lookup tables in
`medication.schema.ts`), storing BOTH the original text and a normalized form (or null when not
confidently parsed); duplicate medications are merged only on an EXACT match (name + strength +
frequency + instructions). The rich `MedicationItem` is a flat per-drug object with room for future
fields (e.g. RxNorm codes).
Reason: Deterministic normalization is testable and predictable (no extra LLM round-trip), and
preserving the original keeps the extraction faithful. Conservative exact-only dedupe honors the
spec's "never merge uncertain matches". The flat model lets later phases (interaction checks,
adherence, reconciliation, cross-record history) layer on without reshaping stored data.
Alternatives considered: Ask the LLM for normalized values; fuzzy-merge similar drug names.
Why rejected: LLM-normalized values are non-deterministic and untestable; fuzzy dedupe risks
collapsing distinct regimens (a safety concern for medications).
Notes: Frequency map is order-sensitive (multi-dose patterns before the generic "daily" rule, so
"twice daily" isn't swallowed by "daily") — covered by a unit test. The shared jsPDF scaffolding was
extracted into `pdf-layout.ts` at this point (rule of three: lab summary, clinical, medication).

Date: 2026-07-10
Decision: Medical Records Phase 4 adds imaging (`xray/mri/ct/ultrasound_report`) as a third
processor family under the same registry/dispatcher pattern as clinical (P2) and medication (P3):
`imaging/*` with schema/registry/prompt/processor/search-text, an `ImagingExtraction`
(`kind: "imaging"`) union member, and an `ImagingView` renderer. Modality is derived from
`documentType` (not extracted). Each extracted finding includes a cautious, one-line plain-language
`explanation` in addition to the verbatim `sourceText`.
Reason: The three-family pattern is proven and keeps the codebase uniform (one config-driven base
per family, no switch statements, one dispatcher). Deriving modality avoids an extra unreliable
extraction field. The per-finding explanation adds real patient value; the prompt constrains it to
defining the term (never inferring severity/diagnosis), and the faithful source sentence is always
shown alongside, so it doesn't overstate — consistent with the app's caution rule.
Alternatives considered: a per-type imaging processor/prompt; extracting modality via the LLM;
source-sentence-only expandable rows (no explanation).
Why rejected: per-type processors duplicate near-identical logic; LLM-extracted modality is
redundant with the (already-classified) documentType; source-only rows are more faithful but less
useful, and the caution risk is mitigated by prompt constraints + showing the source verbatim.
Notes: The plain-language-explanation choice was confirmed with the user before building. Free-tier
OpenRouter models remain transiently flaky (occasional 422 / empty summary with no retry — the
known limitation from earlier phases); the pipeline degrades gracefully (clean 422, manual type
fallback) and produced complete, accurate structured output when the model cooperated.

Date: 2026-07-10
Decision: Medical Records Phase 5 adds procedure (`procedure_note`, `surgery_report`) as a fourth
processor family under the same registry/dispatcher pattern as clinical (P2), medication (P3), and
imaging (P4): `procedure/*` with schema/registry/prompt/processor/search-text, a `ProcedureExtraction`
(`kind: "procedure"`) union member, and a `ProcedureView` renderer. Outcome is normalized to an enum
(`successful|completed|partial|aborted|converted|unknown`) while preserving the report's original
wording (`{ status, original }`); complications are only captured when explicitly stated (never
inferred); devices/specimens are structured object arrays. The "Procedure Timeline" of high-level
steps renders as a visual vertical timeline (numbered dots + connecting line).
Reason: The four-family pattern is proven and keeps the codebase uniform (one config-driven base per
family, one dispatcher, no switch statements) — directly serving the "efficient and consistent"
requirement. Normalizing the outcome (like medication status / imaging severity) enables a status
badge, timeline, and future filtering, while `original` keeps it faithful. Structured device objects
prepare the model for a future implant registry without reshaping stored data.
Alternatives considered: a per-type procedure processor/prompt; free-text outcome only; rendering
steps as a plain numbered list.
Why rejected: per-type processors duplicate near-identical logic; a free-text-only outcome loses the
consistency (badge/timeline/search) the other families have; the visual vertical timeline was chosen
by the user over a plain list for a more polished, Health-Timeline-consistent look.
Notes: The step-timeline rendering choice was confirmed with the user before building. Verified
end-to-end; free-tier OpenRouter flakiness (occasional 422/empty summary, no retry) remains the known
limitation from earlier phases, with graceful degradation.

Date: 2026-07-10
Decision: Medical Records Phase 6 makes the final 9 classifiable types processable by **reuse first**,
not new architecture. The five clinical extensions (`diagnosis`, `treatment_plan`,
`discharge_summary`, `referral_note`, `clinician_note`) are added as **config-only** entries in
`clinical.registry.ts` — the generic clinical processor/prompt/schema/`ClinicalSectionsView`/PDF/
search already iterate `config.sections`, so no new code is needed beyond the section i18n labels.
Only two genuinely different shapes get a new family: `immunization/*` (a structured `vaccines[]`
table, mirroring medication) and `billing/*` (administrative fields + a codes array + a normalized
`claimStatus`, mirroring procedure). Billing/insurance were deliberately routed to a **dedicated
administrative family** (status badge, amounts, codes) rather than forced into the clinical section
model — confirmed with the user.
Reason: The registry/dispatcher pattern was built to make exactly this cheap: adding a type is a
registry entry when the shape fits an existing family, or one small family when it doesn't. Reusing
the clinical base for the five narrative types avoids ~5× duplicated processor/view/PDF/search code;
giving immunization and billing their own families keeps each renderer honest to its data (a vaccine
table and a claim-status card are not clinical sections). No schema migration — all six families
share the existing `summaryText`/`extractedDataJson`/`searchText` columns; `extractedDataJson` is now
a six-member discriminated union on `kind`.
Alternatives considered: modeling immunization/billing as clinical sections (config-only, zero new
files); a single generic "table" family for both; per-type processors.
Why rejected: clinical-section reuse would render a vaccine list and a claim as flat narrative text,
losing the per-row confidence, status badge, amounts, and codes table; a single generic table family
would need conditional columns per type (a switch by another name); per-type processors duplicate
logic. After this phase all 21 classifiable types are processable (`other` stays a classify-only
catch-all). Known limitation unchanged: free-tier OpenRouter transient 422/empty-summary with no
retry, degrading gracefully.

Date: 2026-07-13
Decision: Medical Records Phase 7A ("Platform Experience & Record Management") adds no new
processor families — it turns the completed six-family processing layer into an EHR-style
management surface: advanced combinable filtering persisted in the URL, tags derived from
structured data (never AI-generated), saved views, better search UX, metadata editing, bulk
operations, grouped/collapsible timeline, distinct empty states, and an accessibility pass.
**Scope split confirmed with the user**: Version History (a `MedicalRecordVersion` snapshot table +
reprocess-keep-previous + version comparison) is deferred to **Phase 7B**, specifically so 7A ships
with exactly one migration (`SavedView`) instead of two unrelated schema changes bundled together.
**Saved Views were confirmed as a database table** (cross-device sync), not `localStorage`, even
though that's the app's existing client-persistence precedent — the user explicitly chose
cross-device over the lower-effort option. **Family Members CRUD was built in this phase** (the
user chose this over deferring it) to unblock the family-member filter and bulk move-to-member; it
required no migration since the `FamilyMember` table already existed — only its service/routes were
a `501` stub. Building it surfaced a latent bug: `family-members.schema.ts` used
`z.string().datetime()`, which rejects the plain `"YYYY-MM-DD"` the app's own `DatePicker` emits —
every real submission from the Family page would have 400'd had the endpoint ever gone live. Fixed
by switching to the shared `dateString` validator already used by `medical-records.schema.ts`.
Reason: The processing architecture (Phases 1–6) is complete and shouldn't be touched; the
remaining gap was pure list/record-management UX, which is what an EHR needs beyond raw
extraction. Deriving tags from `deriveTags()` (mirroring `processedHighlight`'s per-`kind` switch)
keeps the "no AI tags" rule structurally enforced — there's no code path that could call the LLM
for a tag. Making bulk "assign tags" a non-feature is a direct consequence: since tags recompute
automatically from structured data, a manual assignment would just be silently overwritten, so it
was correctly left out rather than built and later found useless.
Alternatives considered: `localStorage` for saved views (rejected — no cross-device sync, and the
user wanted one); folding smart tags into the existing `searchText` index instead of a live
`deriveTags()` call (rejected — tags need per-tag color/tone and a click-to-filter payload,
which a flat search string can't carry); deferring Family Members entirely (rejected by the user —
worth building now since two Phase 7A features depend on it).
Notes: `usePopoverPosition` (previously used only by `DatePicker`) had a width hardcoded to match
DatePicker's calendar (288px); the new wider filter popover (320px) overflowed the viewport until
this was caught by **live browser verification** (Playwright against the dev server — not just
unit tests) and fixed by parameterizing the hook's width/height-estimate with the old values as
defaults, so `DatePicker` needed no changes. `MedicalRecordCard`'s callback props were restructured
to take the record/id (rather than being pre-bound per card) specifically so `React.memo` has a
chance to skip re-rendering unrelated cards when search/selection state changes elsewhere on the
page — a `memo()` wrap alone, with per-card closures still recreated on every render, would have
been a no-op optimization. Verified end-to-end in a real browser: registered a fresh account,
added a family member, created a record via the API, and drove filters/tags/edit/select-mode/bulk-bar/
timeline — zero console errors, and this run is what caught the popover bug above.

Date: 2026-07-13
Decision: Added a self-hosted, routed OCR / document-understanding microservice (`ocr-service/`,
Python + FastAPI + PaddleOCR, CPU) and wired it into the app behind an `OCR_SERVICE_URL` flag.
`extract-text.ts` gains one guarded branch: when the env var is set, PDF/image uploads are POSTed
to the service and its returned text is used; on any failure it falls back to the existing
in-process `tesseract.js` path. The service classifies each document (structure tier +
medical-group hint + X-ray-film detection), routes it (PDF text-layer → direct extract; printed →
PaddleOCR; X-ray film → an image-analysis stub that does **not** OCR; report → PaddleOCR),
normalizes into one JSON schema (text + pages/blocks/lines/bboxes + per-field confidence &
provenance), and does **deterministic** lab/billing field extraction. It never calls an LLM. Each
request is isolated by `request_id`/`job_id` with its own temp dir, a lock-guarded in-memory job
store (sha256 idempotency, TTL), and a bounded engine pool. Added a Python CI job (ruff/mypy/pytest,
light deps only) and a `pip` dependabot entry; the service container sits alongside `db` and
`presidio-analyzer` in `docker-compose.yml` (`8081:8000`).
Reason: The task called for a routed pipeline (cheap CPU OCR for the ~80% structured case; a GPU
vision-language engine reserved for messy/handwritten docs) — a genuinely different capability than
the single `tesseract.js` path, and PaddleOCR/Qwen/RolmOCR are Python-only. A separate service is
the clean home for that stack (mirrors the existing Presidio-over-HTTP pattern) and keeps the
heavy, version-sensitive Paddle deps out of the Next app. Splitting extraction so the service does
OCR + deterministic parsing while the **LLM extraction stays in the Next redaction gateway**
preserves the golden rule: OCR runs on-box and produces text, which is still redacted before any
cloud LLM. The env flag + tesseract fallback make adoption risk-free and fully reversible.
Alternatives considered: (a) replace `tesseract.js` in-process with a Python-shelled PaddleOCR;
(b) have the service also run redaction + a self-hosted LLM and return finished medical fields;
(c) send raw images to a cloud vision model.
Why rejected: (a) can't host the GPU VLM upgrade and pollutes the Node app with a Python runtime;
(b) duplicates the existing gateway and needs a self-hosted LLM to honor the golden rule — out of
scope for the CPU MVP; (c) is the explicitly rejected 2026-07-03 option (pixels can't be
pre-redacted). GPU is deferred: the `OcrEngine` protocol + `escalated` routing flag are the seams,
so a Qwen2.5-VL / RolmOCR engine drops in behind the same schema/API with no backend change. Real
X-ray image analysis is a documented stub (needs an imaging model on GPU). The in-memory job store
assumes one process — Redis is the upgrade at >1 replica. Full design in `ocr-service/README.md`.

Date: 2026-07-13
Decision: Completed the OCR service's Section-F deterministic extraction for all categories
(prescription, clinical, procedure, imaging, administrative — alongside the existing lab/billing),
still with no LLM. `ExtractedField` gained `attributes` (medication dose/frequency/route/duration)
and `low_confidence`; narrative types share one header-based section splitter. Dispatch order was
made lab-first-by-signal: a strong lab signature (≥2 rows carrying a reference range) is checked
before the classifier's group hint, prescription detection requires a dosage form/frequency/route
(strength alone is ambiguous with a lab value), and the classifier no longer keys on bare `mg` or
`total`.
Reason: A lab row ("Haemoglobin 13.5 g/dL 13.0-17.0") and a drug line share the "name number unit"
shape, and the keyword classifier is fallible — `mg` occurs in `mg/dL`, `total` in "Total WBC
Count" — so a lab report was misrouting to the prescription parser (caught by running the fixtures
through the pipeline, not by a unit test). The reference range is the reliable discriminator: lab
reports carry them, prescriptions don't. Making the strong-lab signal beat the group hint, and
requiring an actual dosing marker for prescriptions, fixes it deterministically without an LLM.
Persistence stays opt-in (`PERSIST_ARTIFACTS` off by default) to honor the "raw OCR text is never
durably stored" rule; when enabled it now writes the full per-job artifact set with a TTL sweep.
Alternatives considered: rely on the LLM/classifier to disambiguate; make prescription detection
content-only; persist artifacts by default per Section H.
Why rejected: no LLM is allowed in this service; content-only prescription detection re-eats lab
rows; default persistence puts PHI on disk against the app's stated posture. GPU/VLM and a second
OCR engine remain out of scope (rasterize is the CPU fallback for weak pages).

Date: 2026-07-14
Decision: Three-layer document persistence — every processed `MedicalRecord`/`LabReport` now
permanently keeps its original file (Layer 1), its raw OCR output (Layer 2, new `OcrResult` table),
and a versioned canonical extraction (Layer 3, new `ExtractionVersion` table) — instead of
re-OCR'ing on every process call and discarding the OCR text. This **supersedes** the 2026-07-09
decision above ("raw OCR text is never persisted") and **fulfills** the `MedicalRecordVersion`
snapshot table deferred to Phase 7B, generalized to cover both `MedicalRecord` and `LabReport` via
the existing `sourceType`/`sourceId` polymorphic pattern (`AiInsight`/`TimelineEvent`) rather than
two separate tables.
Reason: Future OCR engines or improved extractors need to reprocess historical documents without
requiring the user to re-upload, and every reprocess needs to stay auditable (old versions kept,
never overwritten). Re-deriving OCR on every run made that impossible — the OCR output simply
didn't exist anywhere after the request completed.
What changed: `OcrResult` (immutable, one row per OCR pass, `rawText`/`pagesJson`/engine/confidence/
provenance) and `ExtractionVersion` (immutable, one row per process call, `versionNumber` increments
per `(sourceType, sourceId)`, links back to the `OcrResult` that produced it) — both real FKs to
`User`/`FamilyMember` for cascade/ownership, `sourceType`/`sourceId` pointing at the parent record.
`MedicalRecord`/`LabReport` gained nullable `originalFilename`/`fileSizeBytes`/`sha256` (Layer 1;
`uploadFile` in `storage.ts` now hashes the buffer). `POST .../process` and `POST /ai/extract` keep
their exact existing request/response shape — they now append a version and mirror it onto the
existing `extractedDataJson`/`summaryText`/`searchText` columns, rather than overwriting in place;
`POST /ai/summary`'s `generateSummary` persists the raw-OCR layer but does not version (see below).
New, additive read endpoints: `GET .../:id/ocr-result` (latest raw OCR, never inlined into the main
`GET :id` — same ownership-check protection as `extractedDataJson`, no new encryption layer) and
`GET .../:id/versions` / `GET .../:id/versions/:versionNumber` (history). Deleting a record now also
deletes its `OcrResult`/`ExtractionVersion` rows (raw OCR is PHI and shouldn't outlive the record —
unlike the pre-existing `AiInsight`/`TimelineEvent` orphaning behavior, which was left as-is).
Scoping call: `generateSummary` (`POST /ai/summary`, produces only `summaryText`) persists Layer 2
but does **not** create an `ExtractionVersion` — `ExtractionVersion.extractedDataJson` is required
(it's the canonical structured JSON), and a summary-only call has no structured JSON to version.
Only `extractData`/the six processors (which always produce structured JSON) create versions.
Alternatives considered: a single shared table keyed by a real FK per record type; encrypting raw
OCR at rest; versioning the summary-only call too (via a nullable `extractedDataJson`).
Why rejected: two FK-based tables would duplicate every column pair per record type as new record
types are added; the app doesn't encrypt `extractedDataJson` today either, so raw OCR at the same
protection level isn't a new class of exposure, just a new instance of the existing one; making
`extractedDataJson` nullable to fit a summary-only version would blur "canonical medical JSON" into
"any AI output," which is what `AiInsight` already covers.
Notes: Pre-save exploratory OCR (`POST /ai/analyze`, `POST /ai/classify` — before a record exists)
intentionally stays ephemeral; persisting those would create rows for files the user never saves.
Reprocessing with a different extractor while reusing a prior `OcrResult` (skip re-OCR) is a
documented future follow-up, not built — every process call re-OCRs today, same as before this
change.

Date: 2026-07-14
Decision: Medical Records Phase 7B — Patient Intelligence Layer, built as a **compute-on-read**
aggregation domain (`src/features/patient-intelligence/`) over the six existing processors'
structured output, with **no new Prisma table and no writes**. Scope was deliberately split:
build the full aggregation spine (health profile, condition/medication/imaging/procedure/
vaccination histories, deterministic cross-record linking, episode clustering, deterministic
insights, one new `GET /patient-intelligence/profile` route, one new dashboard page) now; defer the
LLM-based AI Patient Summary and a version compare/restore UI to a follow-up.
Reason: The app already has exactly one precedent for patient-level aggregation — `GET /timeline`
— and it is explicitly aggregated on read from the underlying records, not stored, so it can never
drift out of sync and needs no update-on-write plumbing. Reusing that pattern for the much larger
Phase 7B surface avoids a stale-cache class of bugs a stored `PatientProfile` table would introduce
(profile out of sync after an edit/delete/reprocess) for a dataset (tens to low-hundreds of records
per patient at pilot scale) cheap enough to recompute per request. Every value returned is tagged
`provenance: "fact"` (read straight from `extractedDataJson`) or `"pattern"` (a deterministic
observation computed here, e.g. "Hypertension appears in 8 records") — mirroring the house rule
that tags/categories are derived, never LLM-generated — so the UI can honestly distinguish
documented fact from computed pattern without a third, LLM-backed "ai_summary" provenance this
phase.
What changed: `patient-intelligence.types.ts` (`PatientProfile` + `Provenance`), `care-events.ts`
(`CareEvent` normalization + recent-visits/hospitalizations/follow-up rollups — follow-ups are
surfaced only when a record's own text states one, never an invented due date),
`condition-index.ts` (reuses `tags.ts`'s newly-exported `CONDITION_KEYWORDS` — the same keyword
scan already powering smart tags, not a second implementation), `medication-history.ts` (reuses
`medication.schema.ts`'s `dedupeMedications`; classifies cross-record transitions as started/
changed/dose_modified/stopped/current/discontinued/unknown), `timeline-analyzer.ts` (episode
clustering by time-window + shared provider/facility/body-region/diagnosis — a documented heuristic
ceiling, `ponytail:`-flagged upgrade path to a smarter grouper), `record-linker.ts` (deterministic
links above a confidence threshold — "no AI guessing," per spec), `health-profile.ts` (the
orchestrator: imaging/procedure/vaccination group-bys + deterministic insights), and
`future/interfaces.ts` (empty seams: `DrugInteractionEngine`, `FhirExporter`, `Hl7Exporter`,
`PacsClient`, `DicomMetadataReader`, `ClinicalDecisionSupportEngine`, `ExternalProviderConnector` —
interfaces only, no implementations, per spec). New dashboard page + `PATIENT_NAV` entry
("Health Profile"); new `patientIntel` i18n namespace (EN+HI).
Alternatives considered: a persisted `PatientProfile` table updated on every record
create/update/delete/reprocess; linking a specific medication to a condition via a shared
diagnosis/indication field.
Why rejected: the update-on-write table needs a sync hook on every one of the six processors plus
the edit/delete/bulk-move paths, and any missed hook (or a direct DB edit) leaves a profile that
silently disagrees with the records it describes — the exact failure the app's own Timeline
decision already ruled out. Medication-to-condition linking was rejected because `MedicationItem`
carries no indication field — inferring the link would be a guess, not a fact; instead
`ConditionTimeline.medicationNames` only lists medications mentioned in the **same** clinical
record's own `medications` free-text section (a real co-occurrence, not an inferred prescribing
reason).
Deferred (explicit, next phase): an LLM-based AI Patient Summary — would reuse `runGateway`
unchanged (`sourceType: "patient"`, `sourceId: userId`, consent-gated exactly like every other AI
call) and cache its output as an `AiInsight`, the one place this phase's "no LLM" rule would lift;
and a version compare/restore UI over the already-existing `ExtractionVersion` table (Phase 7A
already built the snapshot-on-reprocess table itself — see the 2026-07-14 three-layer-persistence
entry above — so Phase 7B's remaining version-history gap is UI plus a user-facing `reason` field,
not a new table).

## Deterministic-field reconciliation, honest quality score, and CPU-hosted VLM escalation

Date: 2026-07-14

Three decisions from the OCR-accuracy pass (extractor version `2026.07` → `2026.07.2`), driven by
two real failing documents: a handwritten prescription that yielded "no medications identified"
and a clean lipid-profile PDF that scored 67% with three "Needs Review" rows.

- **The OCR service's deterministic extraction is now consumed, not discarded.** The Next backend
  previously used only `text` from the PaddleOCR service; `extract-text.ts` now surfaces
  `fields` + real `ocr_mean` confidence, `ocr-persistence.ts` persists them inside the existing
  `pagesJson` Json column (no migration) and returns them to processors. Lab extraction repairs
  LLM rows against the deterministic rows (`reconcile-tests.ts` — LLM-first, exact-normalized name
  match only, never overwrites a parseable LLM number; fuzzy matching rejected because
  "HDL"⊂"Non-HDL" and "LDL"⊂"VLDL" mispairs are worse than no repair). The medication processor
  uses deterministic prescription rows as a fallback when the LLM finds nothing, and the real
  engine confidence replaces the text-length heuristic in `extraction-confidence.ts`.
- **Score semantics change: values without a printed reference range no longer penalize.** A new
  `unrated` bucket ("No range printed") counts as judged in `computeValuesQuality` — derived
  ratios (TG/HDL, Non-HDL) legitimately print no range, and a correctly-extracted value is not an
  extraction failure. Only unverified/garbled values still penalize. A flag letter extracted as
  the value ("L") is deterministically salvaged into `flag` (`sanitizeTest`). The reported lipid
  case moves 67% → 89% with identical extraction output. Alternative (excluding range-less rows
  from the denominator) rejected: extracting them IS part of the job, so they should count when
  done right.
- **Handwriting escalation: self-hosted Qwen2.5-VL via Ollama, on CPU.** Cursive is beyond
  PaddleOCR; the 2026-07-03 "pixels can't be pre-redacted" rule stands, so cloud vision remains
  rejected. The already-designed `gpu_vlm` routing seam now has a real engine
  (`ocr-service/app/ocr/vlm_engine.py`) that transcribes verbatim over localhost and feeds the
  existing text pipeline — enabled by `OCR_VLM_ENABLED` alone, no GPU required (accepted
  trade-off: 30s–3min/page CPU latency; user explicitly accepted). When everything still fails,
  the medication processor now returns an honest "handwriting couldn't be read reliably — add
  manually" error instead of a confidently-empty result, gated on real OCR confidence < 0.55.

## Deterministic letterhead parsing over the redaction-blinded LLM classifier

Date: 2026-07-14

Testing the Add Medical Record flow showed the classifier systematically confusing fields on the
ISHNAVI prescription: facility = "SEC 14, VASANTH MG" (address fragment), physician = "ISHNAVI"
(the clinic), title blank. Root cause is structural, not prompt quality: `runGateway` PII-redacts
the OCR text before the LLM sees it, and placeholders are deduped by value — so the letterhead
"ISHNAVI CLINIC" and the doctor "Dr. ISHNAVI PATEL" both read `<PERSON_1> …` to the model. It
cannot distinguish a clinic from a doctor from a city it cannot see; the only readable footer text
was the address fragment, which it dutifully returned as facility. A returned `<PERSON_1>` then
rehydrates to "ISHNAVI" in whatever field the model put it. (Related latent bug: a returned
`<DATE_n>` rehydrates to the original printed format, so "format as YYYY-MM-DD" could never
survive the round-trip.)

Decision: **do not weaken redaction** (the 2026-07-03 golden rule stands). Instead, new pure
module `src/features/ai/letterhead.ts` parses the RAW, pre-redaction OCR text on-box —
`findFacility` (org-token line in the top-8-line letterhead region, org-bearing segment only, so
an address can never ride along), `findPhysician` (last non-"Ref. by" `Dr. <Name>` match,
credential tails stripped), `isAddressLike`, `hasPlaceholder`, `normalizeDateString` (day-first
Indian convention). Merge precedence in `analyzeMedicalRecord`/`analyzeMetadata`: deterministic
candidate wins; else the LLM value is kept only if it isn't address-like, isn't a placeholder
leftover, and (for physician) isn't contained in the facility name; otherwise the field is nulled
— a blank "please verify" field (auto-flagged via `scoreExtraction`'s missing-field rule, which
the modal's meta card already renders) beats a confidently wrong value. Title is synthesized as
"<Type label> — <facility>" when the LLM leaves it blank. The prompts were additionally made
placeholder-aware (return `<PERSON_1> CLINIC` verbatim — it rehydrates) since the LLM remains the
fallback for layouts the regexes don't recognize.

Alternative considered: dropping PERSON/LOCATION from Presidio's KEEP set just for the pre-save
classify/analyze actions. Rejected — it opens a PII path to the cloud LLM for the one flow that
runs before the user has even saved the document, inverting the privacy posture for a prefill
convenience.

## 2026-07-14 — `src/` regrouped into `src/frontend` and `src/backend`

Decision: `src/components/*` and `src/i18n/*` moved to `src/frontend/`; `src/lib/*`,
`src/features/*`, and `src/types/*` moved to `src/backend/`. `src/app` (Next.js App
Router — pages + `/api/v1` route handlers), `src/middleware.ts`, and `src/instrumentation.ts`
stay where the framework requires them; they already import from both groups via the `@/*`
alias, which still resolves to `./src/*` (`tsconfig.json`), so only the import paths inside them
changed (e.g. `@/lib/env` → `@/backend/lib/env`), not their location.

Why: requested folder-level separation between UI code and business logic/API-support code
without leaving Next.js's fullstack model — Next.js requires routes and API handlers to live
under `app/`, so a true separate backend service isn't compatible with this app's architecture.
An actual separate AI service already exists as `ocr-service/` (self-hosted FastAPI); AI code
under `src/features/ai/` (now `src/backend/features/ai/`) stays with the backend since it runs
in-process with the gateway, Prisma, and auth.

Alternative considered: three real top-level services (frontend, backend, ai-service) each with
their own server. Rejected for MVP — Next.js API routes are the backend by convention here;
splitting to a separate Express/Fastify backend and pulling `src/features/ai` out into its own
deployable service is a multi-day re-architecture (auth/session handling, deployment, inter-service
calls), not a folder move, and out of scope for the current patient-only MVP.

Notes: all 171 `@/{lib,features,components,i18n,types}` import sites updated in one pass;
`vitest.config.ts` coverage globs updated (`src/lib/**` → `src/backend/lib/**`); `tsc --noEmit`,
`vitest run` (308 tests), and `next build` all verified green after the move.

## Frontend/backend split into two repos

Date: 2026-07-15/16
Decision: Removed the entire backend implementation from this Next.js repo —
`prisma/schema.prisma` and all migrations, every `src/app/api/v1/*/route.ts` handler,
`middleware.ts`, all `*.service.ts`/`*.schema.ts` business logic, the AI gateway/redaction/OCR
pipeline, `scripts/mock-llm-server.js`, and the `howtos/` manual verification guides
(`627cddb` "feat: clean frontend by removing backend deps"). The API is now served by a separate
Laravel application, `swathya-rakshak-backend/` (confirmed on disk: real `app/Models`, `app/Http`,
`routes/`, `database/migrations/`). This repo now only renders pages and calls the backend's
`/api/v1/*` contract over HTTP via `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL`, per `CLAUDE.md`'s current instructions.
Reason: not recorded at the time this commit landed — reconstructed here during the 2026-07-16
`/sync-docs` pass, since `docs/architecture.md`, `docs/api-contracts.md`, and
`docs/database-schema.md` all still described the old Next.js-monolith architecture (Prisma, JWT
verification, and the AI pipeline living in this repo) for a full day+ after the split without a
matching decision-log entry or doc update.
Alternatives considered: not recorded — no prior entry exists to draw them from.
Notes: `src/` keeps its `src/frontend/` (UI) / `src/backend/` (browser-safe API-client, types, and
feature helpers only — no server implementation despite the folder name) split from the earlier
2026-07-14 regrouping entry above; only the contents of `src/backend/` changed (from real business
logic to types/clients/helpers), not the split itself. All three docs above were updated in this
same pass to stop describing removed code as current — see each file's new "ownership note" /
inline flags, and `docs/progress.md`'s "⚠️ Architecture change" section for the full list of what
moved where.

## Admin panel + subscription/billing system (undocumented at the time — reconstructed after the fact)

Date: 2026-07-15 (commit `ce27746` "feat: scoped ownership"); this entry written 2026-07-16
Decision: unknown — no decision-log entry, alternatives, or reasoning was recorded when this
commit landed. What's known from the code itself: it added a full admin panel
(`src/app/(admin)/admin/{page,layout,users,plans,subscriptions,audit}.tsx`), a subscription/
billing system (`/pricing`, `subscription.types.ts` — plans/checkout/confirm/cancel — with a mock
auto-approving payment gateway), an entitlements/plan-gating layer (`admin.types.ts`,
`EntitlementsContext`, `PlanGate`), and an admin "test as user" impersonation flow
(`impersonation.client.ts` — swaps the admin's token for a short-lived, redaction-forced
impersonation token). `PlanGate` already gates the Patient Intelligence page
(`/patient-intelligence`) behind a paid-plan entitlement.
Reason: not recorded.
Alternatives considered: not recorded.
Why rejected: n/a — no alternatives were logged.
**This is flagged, not endorsed.** It directly overlaps roadmap items `CLAUDE.md` explicitly
excludes from MVP scope: "Do not build clinic, hospital, insurance, billing, or telemedicine
features unless explicitly asked" and "Do not add future roadmap features (… payments) into MVP
code" — rules that predate this commit by many weeks (`CLAUDE.md` has existed since before Medical
Records Phase 1, 2026-07-09). Whether this was explicitly authorized outside this repo's own
history (e.g. agreed directly with the product owner, or scoped in the backend repo) is unknown
from here. See `docs/progress.md` → Known Issues and `docs/api-contracts.md`'s new Admin/
Subscription sections (added in this same sync pass since real frontend code already calls those
endpoints, regardless of the open scope question) for what exists today. Treat this as an open
reconciliation item, not confirmed product direction, until the product owner weighs in.

Date: 2026-07-17
Decision: Introduced a structured **medicine knowledge base** in the backend (`Medicine` +
`PrescriptionMedicine` tables, `MedicineCatalogService`/`MedicineRetrievalService`/`MedicineChatService`,
`POST /medicines/ask`, admin CRUD, `MedicineSeeder`), with catalog embeddings stored **in-DB as a JSON
float column** and cosine similarity computed in PHP behind a keyword pre-filter. This is a deliberate,
scoped **exception** to the 2026-07-02 "no embeddings/RAG" deferral above.
Reason: The deferral's rationale was "no volume justifying a GPU-backed embeddings service" for a few
dozen PHI records per user. That rationale does not apply here: the medicine catalog is a **shared,
non-PHI** reference set of a few hundred rows, embedded once at write/seed time — not per-user PHI, and
not a per-request cost. A few-hundred-row in-PHP cosine loop needs no pgvector, no new infrastructure,
and no GPU service, so the "speculative idle infrastructure" objection doesn't hold.
Alternatives considered: (a) pgvector column + SQL similarity; (b) an external vector DB; (c)
keyword-only retrieval with no embeddings.
Why rejected: (a)/(b) reintroduce exactly the infrastructure the pilot deferral avoided, for a catalog
small enough not to need it; (c) is in fact the graceful-degradation default — embeddings are optional
(`EMBEDDINGS_URL`/`EMBEDDINGS_MODEL` unset → keyword-only), so tests/CI/local dev run with no embedding
infra at all. The embeddings enhancement is additive, not a hard dependency.
Notes: The PHI boundary is unchanged. `Gateway::run` stays **completions-only**; embeddings run through
a separate `App\Services\Ai\Embeddings` client that only ever embeds (i) non-PHI catalog text (never in
the seeder — backfilled by `php artisan medicines:embed`) and (ii) the user's question **after** the
consent check AND `Redaction::redact()`, on a self-hosted host (same box already serving OCR) so text
stays on-infra. The authoritative `AuditLog` row is still written by the subsequent `Gateway::run` call.
`Medicine.embeddingJson` is `$hidden` so vectors never leave the API. `/medicines/ask` is a stateless
mirror of the future `/companion/chat` contract (minus `sessionId`); `MedicineRetrievalService` is
isolated so the existing Companion orchestrator can wrap it later. Backend detail lives in
`swathya-rakshak-backend/docs/medicine-knowledge.md`.

## Use

Whenever a major product, API, schema, or architecture decision is made, add it here.
