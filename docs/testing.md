# Testing Strategy

## Goal

Protect the core patient experience and avoid regressions.

## Critical flows to test

- Signup and login
- Create profile
- Upload medical record
- View timeline
- Add family member
- Add reminder
- Generate AI summary
- Access control on private records

## Test types

- Unit tests
- Integration tests
- API tests
- UI smoke tests
- Permission tests

## Release rule

No core feature should ship without tests.

## Bug fix rule

Every bug fix should include a regression test when practical.

## Tooling

We use [Vitest](https://vitest.dev) (Node environment). Config lives in `vitest.config.ts`,
which mirrors the `@/*` path alias and injects test-only `JWT_SECRET` / `JWT_REFRESH_SECRET`.

Commands:

```bash
npm run test           # run the suite once (used by CI)
npm run test:watch     # watch mode for local development
npm run test:coverage  # run with a v8 coverage report
```

Conventions:

- Colocate tests next to the code under a `__tests__/` folder, named `*.test.ts`
  (e.g. `src/backend/lib/__tests__/auth.test.ts`).
- Start with pure functions and utilities (no DB, no network). Integration/API tests
  against a real Postgres are a planned next step — see the CI pipeline in
  `.github/workflows/ci.yml`.
- **Manual, end-to-end verification guides** live under `howtos/` at the repo root (outside
  `docs/`, since they're runbooks rather than design references) — e.g.
  `howtos/ai-pii-reduction-test.md` walks the full AI redaction pipeline (consent gate → redact →
  LLM call → rehydrate → audit log) with a local mock-LLM capture point, real example
  outputs, and dummy error messages. Use these where an automated integration test doesn't exist
  yet (see `redact.test.ts` for what _is_ automated) but the flow still needs a repeatable way to
  verify by hand.

## Continuous integration

CI runs on push and PRs targeting `main`, `dev`, `stage`, and any `dev-*` branch (see the `on:`
block in `.github/workflows/ci.yml`), with parallel jobs:

- **quality** — `npm run lint`, `npm run format:check`, `npm run typecheck` — runs on every
  branch above, including `dev`/`dev-*`, for fast feedback.
- **test** — `npm run test` — runs on every branch above.
- **build** — `npm run build` (placeholder env vars; no live DB needed) — runs **only for
  `main` and `stage`** (push or PR targeting them). A full production build is comparatively
  slow, so it's skipped on `dev`/`dev-*` and only gates the branches that actually ship; see
  the job's `if:` condition.
- **audit** — `npm audit --audit-level=high` (informational, non-blocking) — runs on every
  branch above.

`.github/dependabot.yml` opens weekly dependency-update PRs.

**CodeQL is currently disabled** (`.github/workflows/codeql.yml` is manual-only,
`workflow_dispatch`). This repo is private on the GitHub Free plan, which doesn't include
GitHub Advanced Security — the analyze step fails on every automatic run with "Code scanning is
not enabled for this repository." The workflow's triggers are commented out in the file, ready
to restore once the repo is public or the org has GHAS.

## Enforcing checks (branch protection)

CI only _reports_ status until a branch is protected to _require_ it. This must be done in the
GitHub UI or API (it is a repo setting, not a file in the repo). Protect the long-lived
branches — `main`, `stage`, and `dev` (the transient `dev-*` feature branches don't need
rules).

**Important:** only require a status check that actually runs on that branch, or PRs will block
forever waiting on a check that never reports:

- the `build` job (`"Production build"`) only runs for PRs/pushes targeting `main` or `stage`
  (see the CI job's `if:` condition) — don't require it on `dev`.
- `"Analyze (javascript-typescript)"` (CodeQL) currently never runs automatically at all (see
  above) — don't require it anywhere until it's re-enabled.

One-time setup with the GitHub CLI:

```bash
# Requires: gh auth login  (and admin on the repo)

# main and stage: require quality, tests, and the production build.
for BR in main stage; do
  gh api -X PUT "repos/PreetChauhan111/swathya-rakshak/branches/$BR/protection" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "Lint, format & types" },
      { "context": "Unit tests" },
      { "context": "Production build" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
JSON
done

# dev: same, minus "Production build" (that job doesn't run on dev).
gh api -X PUT "repos/PreetChauhan111/swathya-rakshak/branches/dev/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "Lint, format & types" },
      { "context": "Unit tests" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
JSON
```

Or via **Settings → Branches → Add branch ruleset**: create one ruleset targeting `main` and
`stage` requiring _Lint, format & types_, _Unit tests_, and _Production build_, and a separate
ruleset targeting `dev` requiring only _Lint, format & types_ and _Unit tests_. Enable _Require
a pull request before merging_ and _Require status checks to pass_ on both. The check names
must match the workflow job `name:` values exactly. Once CodeQL is re-enabled (see above), add
_Analyze (javascript-typescript)_ back to both rulesets.

GitHub-native scanning toggles (Dependabot alerts, secret scanning) live under **Settings →
Code security and analysis** — those work on private Free-plan repos and are worth enabling now
even though CodeQL itself is not.
