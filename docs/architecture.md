# Architecture Overview

## Goal

Build a clean, maintainable patient-first application that can scale later without rewriting the core.

## High-level structure

- Frontend: patient-facing web app — **this repo**, Next.js only
- Backend: API service — **a separate Laravel application**, `swathya-rakshak-backend/` (sibling
  repo). This repo talks to it over HTTP via `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL` and holds no server-side
  business logic, database client, or auth verification of its own. See `docs/decision-log.md`
  (2026-07-15/16) for how/why this repo was split out of a former Next.js-monolith architecture.
- Database: relational database for health data — owned and migrated by the backend repo
- Storage: secure file storage for medical documents — owned by the backend repo
- AI layer: summary and extraction assistance — owned by the backend repo (this app only renders
  the consent modal, confidence badges, and summary/extraction results it returns)

## Core principles

- Patient is the center of the system
- Every record belongs to a user or family member
- Keep future clinic/hospital features separate from MVP code
- Keep sensitive data secure
- Keep architecture simple enough to ship quickly

## MVP modules

- Authentication (patient and doctor roles)
- User profile
- Family members
- Medical records
- Prescriptions
- Lab reports
- Reminders
- Timeline
- AI summaries
- File storage
- Doctor↔patient connectivity (minimal: doctor profile, patient connection requests/approval,
  doctor-authored prescriptions, shared reminders — no clinics, appointments, or billing)

Beyond the original MVP list, **Patient Intelligence** (Phase 7B,
`src/backend/features/patient-intelligence/`) sits on top of Medical Records: a compute-on-read
aggregation of the six processors' structured output into one longitudinal health profile
(conditions, medication history, imaging/procedure/vaccination histories, deterministic
cross-record links, episodes of care, deterministic insights). Like Timeline, it stores nothing of
its own — no new Prisma table — and never calls OCR or an LLM. See `docs/decision-log.md`
(2026-07-14) and `docs/feature-flows.md` §3b. **As of `ce27746` (2026-07-15), the
`/patient-intelligence` page is gated behind `PlanGate` (a paid-plan entitlement)** — see the
"Beyond MVP: admin & subscription" section below; this predates that decision being logged.

> **⚠️ Beyond MVP: admin & subscription (2026-07-15, `ce27746`, undocumented at the time).** A full
> admin panel (`src/app/(admin)/admin/*` — users, plans, subscriptions, audit log) and a
> subscription/billing/entitlements system (`/pricing`, `subscription.types.ts`, `admin.types.ts`,
> `EntitlementsContext`, `PlanGate`, `impersonation.client.ts`) exist in this repo, wired to
> `/admin/*` and `/subscription/*` backend endpoints. This directly overlaps the roadmap items
> `CLAUDE.md` explicitly excludes from MVP scope ("insurance, billing, … Do not add future roadmap
> features … payments"). No decision-log entry explains why or by whom this was authorized. Treat
> it as scope-uncertain pending product-owner reconciliation — see `docs/progress.md` → Known
> Issues. It is not reflected in the "MVP modules" list above.

## Tech stack (this repo — frontend only)

- **Next.js 15** (App Router) + **React 19** + **TypeScript**. No database client, no ORM, no
  server-side auth verification, and no `src/app/api/*` routes live in this repo — all removed in
  `627cddb` (2026-07-15/16, see `docs/decision-log.md`). Every prior mention in this file of
  Prisma, `middleware.ts`, or a locally-hosted AI gateway/OCR pipeline describes code that has
  **moved to `swathya-rakshak-backend/`** (a separate Laravel application) and is kept below only
  as historical/contextual background for the frontend UI that was built around it.
- **API client**: `src/backend/lib/api-client.ts` (`apiFetch`) and `src/backend/lib/api-url.ts`
  (`apiUrl`/`fileUrl`) are the only sanctioned way to call the backend, per `CLAUDE.md`.
  `src/backend/features/*` otherwise holds browser-safe helpers only — PDF export, view
  registries/schemas for AI-extracted data, and TypeScript types mirroring the backend's response
  shapes (many files carry a `// Mirrors <BackendClass> (app/...)` comment pointing at the exact
  Laravel source it tracks).
- **AI layer (backend-owned, frontend-consumed)**: the consent gate, PII/PHI redaction, LLM calls,
  and audit logging described in the paragraphs below now live in `swathya-rakshak-backend/`. This
  app's role is limited to: showing the AI-consent modal, calling `POST /ai/{summary,extract,analyze,classify}`
  via `apiFetch`, rendering the returned summary/confidence/extracted-values, and letting the user
  grant/revoke consent via `PATCH /users/profile { aiConsent }`. The pipeline design below is
  preserved for context (it explains the shape of the responses this UI renders) but is no longer
  code in this repo to maintain or test:
  - `analyzeMetadata` (`POST /ai/analyze`) is the pre-save auto-fill path — it takes a
    just-uploaded `fileUrl` (no saved record yet) and returns lab/test/date metadata plus an
    extraction-confidence score (fields-returned + the OCR engine's real mean confidence when a
    routed OCR service handled the document, else an OCR-text-quality heuristic on the tesseract
    fallback). Because the LLM only ever sees PII-redacted text (names/locations are
    `<PERSON_n>`/`<LOCATION_n>` placeholders), facility/physician/labName answers from it are
    sanity-checked against deterministic parsing of the raw on-box OCR text (letterhead org line →
    facility, last non-"Ref. by" `Dr. <Name>` → physician, address detection, day-first date
    normalization) — deterministic candidates win, and address-like or placeholder-leftover LLM
    values are nulled (flagged for review) rather than shown.
  - Every AI call routes through a single gateway chokepoint: consent gate (`User.aiConsentAt`,
    `403` if unset) → **redact** PII/PHI (reversible, in-memory tokenization of structured Indian
    identifiers by regex, plus Presidio NER for names/addresses, on by default and **failing
    closed** with `503` if unreachable) → call the LLM (OpenRouter's OpenAI-compatible API;
    wrapped to surface `502` on failure) with **redacted text only** → rehydrate identifiers in
    the response → write an append-only audit-log row. Text is pulled from uploaded files via PDF
    text-layer extraction, else self-hosted OCR (`tesseract.js` `eng+hin`; images and scanned PDFs
    OCR'd on-box). Pilot-scoped design (10–15 users): synchronous processing (no job queue),
    local-disk storage, no encryption-at-rest/embeddings/self-hosted LLM — see
    `docs/decision-log.md` for the scope cuts and scale-up path.
  - **Routed OCR (`ocr-service/`, now part of the backend repo)**: a self-hosted FastAPI
    microservice (PaddleOCR, CPU) that classifies each document, routes it to the right extraction
    path, and returns normalized text + structure plus deterministic, no-LLM field extraction
    across lab/prescription/clinical/procedure/imaging/administrative categories, each field with
    confidence + provenance. Never calls an LLM. A CPU-hosted Qwen2.5-VL (Ollama) escalation engine
    handles handwriting transcription; its text still flows through the redaction gateway.
- **Stale build config (found during the 2026-07-16 doc sync)**: `next.config.ts` still sets
  `serverExternalPackages: ["pdf-parse", "pdfjs-dist", "tesseract.js", "sharp", "@napi-rs/canvas"]`
  — a workaround for the AI/OCR route handlers that no longer exist in this repo (see above), and
  none of those five packages are in `package.json` anymore either. It's dead, harmless
  configuration (Next.js ignores externals it never needs to bundle), left over from the
  `627cddb` cleanup. Safe to delete; flagged in `docs/progress.md` rather than removed
  unilaterally in a docs-only pass.

## Security posture

- **HTTP security headers** on every response (`next.config.ts` `headers()`, still current in this
  repo): HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a
  `Permissions-Policy` denying camera/mic/geolocation.
- **Everything else in this section moved to `swathya-rakshak-backend/` with the 2026-07-15/16
  split** — centralised env validation (`requireEnv`/`requireSecret`), JWT secret loading,
  boot-time `validateEnv()`, bcrypt password/OTP hashing, and `DATABASE_URL` TLS all describe
  Laravel-side code now; `src/backend/lib/env.ts`, `middleware.ts`, and `src/instrumentation.ts` no
  longer exist in this repo (confirmed absent as of this sync). Preserved as context for what the
  frontend can assume the backend already enforces, not as this repo's own implementation.
- **Secrets at rest / encryption**: unchanged product-level fact, now a backend concern — passwords
  and OTP codes are bcrypt-hashed (one-way); health data and uploaded files are **not** encrypted at
  rest yet (deferred — see `progress.md` / `decision-log.md`).
- **Auth tokens live in browser `localStorage`** (MVP; httpOnly-cookie migration is a known
  pre-production item) — this is still directly relevant to this repo, since `src/backend/lib/
api-client.ts` is what reads/writes them on the frontend side.

## UI styling

- The entire app — dashboard shell, every dashboard feature page (family, medical records,
  prescriptions, lab reports, reminders, timeline, profile, dashboard home), auth pages, and
  landing/marketing — uses **TailwindCSS + Framer Motion + lucide-react**, with class-based dark
  mode and EN/HI i18n. There is no inline `React.CSSProperties` styling anywhere in the codebase
  (verified: zero `style={{` usages across `src/app`). See the `design` skill for the palette,
  tokens, and component patterns.
- Shared UI primitives in `src/frontend/components/ui/*`; theme/language providers in `src/frontend/components/providers/*`; translation dictionaries in `src/frontend/i18n/*`

## Design rules

- Feature-based folders
- Thin controllers
- Business logic in services
- Reusable UI components
- Shared types for API and frontend
- Minimal coupling between modules

## Future expansion

The architecture should later allow clinic, hospital, and lab modules, but they must not pollute the MVP structure.
