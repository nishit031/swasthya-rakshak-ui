---
name: ci-check
description: Run the same quality gates locally that GitHub CI runs (format, lint, types, tests, build) and report a clear pass/fail summary. Use after a feature change or before pushing/opening a PR, or whenever the user asks to "run CI locally", "check before push", or "verify quality gates".
---

# CI Check (local)

Mirror `.github/workflows/ci.yml` on the developer's machine so failures are caught before
they hit GitHub. Run every gate, keep going even if one fails, and end with a summary table.

All commands run from the repo root (`swathya-rakshak/`).

## Instructions

### Step 1: Prepare

### Step 2: Run every gate (don't stop on the first failure)

Run these in order and record the result of each. Run them one at a time so you can attribute
failures cleanly:

1. **Format** — `npm run format:check`
2. **Lint** — `npm run lint`
3. **Types** — `npm run typecheck`
4. **Tests** — `npm run test`
5. **Build** — `npm run build` with placeholder env vars (no live DB is needed at build time):
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swasthya_rakshak" \
   JWT_SECRET="ci_placeholder_jwt_secret" \
   JWT_REFRESH_SECRET="ci_placeholder_jwt_refresh_secret" \
   STORAGE_PROVIDER="local" SMS_PROVIDER="console" \
   NEXT_PUBLIC_APP_NAME="Swasthya Rakshak" NEXT_PUBLIC_FRONTEND_API_URL="http://localhost:3000" \
   npm run build
   ```
   Always run this locally — it catches real breakage early. But note in the summary whether
   CI will actually gate on it for the current branch: check the current branch name
   (`git branch --show-current`) against the `build` job's `if:` condition in
   `.github/workflows/ci.yml` — as of now it only runs in CI for `main` and `stage` (push or PR
   into them), not for `dev`/`dev-*`, to keep feedback fast on feature branches. Re-check that
   condition rather than assuming, since it can change.

`npm audit --audit-level=high` is informational in CI (non-blocking); run it only if the user
asks about dependency vulnerabilities.

### Step 3: Offer fixes for failures

- **Format fails**: this is auto-fixable. Show which files drift, then offer to run
  `npm run format` (it only restyles source text — no logic or UI change). Re-run
  `format:check` after to confirm green.
- **Lint fails**: report the rule + file:line. Fix genuine issues; never blanket-disable rules
  to force a pass.
- **Types fail**: report the `tsc` error and file:line and fix the type issue.
- **Tests fail**: report which test and the assertion. Fix the code or the test — do not delete
  a failing test to make the gate pass.
- **Build fails**: report the Next.js error. A missing-env error here usually means new code
  reads an env var at build time — add it to the placeholder block above (and to
  `.env.example`).

### Step 4: New-feature test reminder

`docs/testing.md` requires "no core feature ships without tests." If this run follows a feature
change, check whether the change touches a critical flow (signup/login, profile, medical
records, timeline, family members, reminders, AI summary, access control) and whether tests
were added. If a critical flow changed with no test, flag it and offer to add one. Tests are
colocated as `src/**/__tests__/*.test.ts` (see the existing `src/lib/__tests__/` examples).

### Step 5: Summary

End with a table so the state is scannable, e.g.:

| Gate   | Result                                                                  |
| ------ | ----------------------------------------------------------------------- |
| Format | ✅ / ❌                                                                 |
| Lint   | ✅ / ❌                                                                 |
| Types  | ✅ / ❌                                                                 |
| Tests  | ✅ (N passed) / ❌                                                      |
| Build  | ✅ / ❌ (gates CI on main/stage only — informational here on dev/dev-*) |

If everything is green, say it's safe to push / open a PR. If anything is red and unfixed,
list exactly what remains. Do not commit, push, or branch unless the user explicitly asks —
this skill only verifies.
