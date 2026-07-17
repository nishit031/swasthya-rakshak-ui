# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

You are the lead frontend engineer for Swasthya Rakshak — a patient-first digital health companion. The current MVP is for patients only. Do not build clinic, hospital, insurance, billing, or telemedicine features unless explicitly asked.

This repo (`swathya-rakshak/`) is the **frontend only** — a Next.js app. The API is a separate Laravel service in the sibling repo `swathya-rakshak-backend/`; this app talks to it over HTTP via `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL`. There is no same-origin API in this repo — don't add `src/app/api/*` routes or server-side data access here; that logic belongs in the backend repo.

**Before implementing any task**, check the relevant docs in `docs/`: `architecture.md`, `api-contracts.md`, `database-schema.md`, `coding-standards.md`, `feature-flows.md`, `setup.md`, `testing.md`. If anything is unclear, ask a focused question before coding.

**After Implementing any task** do run these two skills in the given order first /sync-docs and then /ci-check

## Commands

All commands run from `swathya-rakshak/`:

```bash
npm run dev            # start the frontend (http://localhost:3000)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run test           # vitest run
npm run format:check   # prettier --check
npm run build          # production build
```

Copy `.env.example` → `.env` and set `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL` to the backend's origin
(`http://127.0.0.1:5000` for local dev — see `swathya-rakshak-backend/RUNBOOK.md` for starting it).

## Architecture

**Stack**: Next.js 15 + React 19, TypeScript. No database client, no ORM, no server-side auth
verification here — all of that lives in the Laravel backend. This app renders pages and calls
the backend's `/api/v1/*` REST contract.

**UI**: TailwindCSS + Framer Motion + lucide-react, with class-based dark mode and EN/HI i18n. Shared UI primitives live in `src/frontend/components/ui/*`; theme/language providers in `src/frontend/components/providers/*`; translation dictionaries in `src/frontend/i18n/*`. The `design` skill documents the full system. (This replaced the earlier inline-`React.CSSProperties` styling — do not reintroduce inline-style objects.)

**API client**: `src/backend/lib/api-client.ts` (`apiFetch`, handles auth headers + silent token
refresh) and `src/backend/lib/api-url.ts` (`apiUrl`/`fileUrl`, resolve a path against
`NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL`) are the only sanctioned way to call the backend. `src/backend/features/*`
otherwise holds browser-safe helpers the UI needs — PDF export (`jsPDF`, runs client-side),
per-document-type view registries/schemas (for rendering AI-extracted data), and shared
TypeScript types mirroring the backend's response shapes. It does **not** contain a server
implementation — despite the folder name, nothing under `src/backend/` runs on this app's server;
it's all imported into client components.

**API shape** — all responses follow this contract (defined by the backend):

```json
// success
{ "success": true, "message": "...", "data": {} }
// error
{ "success": false, "message": "...", "errors": [] }
```

## Data model

Every record is owned by a `User` (string PK). Most entities also accept an optional
`familyMemberId` to scope records to a dependent. Core models: `User`, `FamilyMember`,
`MedicalRecord`, `Prescription`, `LabReport`, `Reminder`, `TimelineEvent`, `AiInsight`. The schema
is owned by the backend repo (`swathya-rakshak-backend/database/migrations/`) — see this repo's
`docs/database-schema.md` for the shape the frontend relies on.

## Key rules

- **Ownership check on every private resource** is enforced by the backend — never build a UI
  path that assumes it can skip auth or bypass the backend's checks.
- **Never expose raw private file URLs** — use `fileUrl()`/signed access from the backend.
- **AI output must be cautious** — do not present AI as a doctor, do not overclaim certainty, keep text simple and user-friendly. All AI calls happen in the backend; this app never talks to an LLM directly.
- **No API contract changes** without checking the docs (and the backend repo) first; ask before architecture changes.
- **Do not add future roadmap features** (clinics, hospitals, labs, appointments, payments) into MVP code.
- Keep business logic out of UI components; keep components small and focused.
- Update `docs/` when implementation changes design or data flow.

## Environment variables

| Variable                      | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL` | Origin of the Laravel backend (`http://127.0.0.1:5000` for local dev) |
| `COMPOSE_PROJECT_NAME`        | Pins the shared Docker Compose volume/container names                 |
| `NODE_ENV`                    | Standard Next.js environment flag                                     |
