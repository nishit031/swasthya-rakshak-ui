Sync the project docs to reflect current implementation status.

## What to do

You are updating the project documentation for Swasthya Rakshak to accurately reflect what has been built and what remains pending. Follow these steps exactly:

### Step 1 — Gather current state

Run these commands and read the output carefully:

```bash
git log --oneline -20
git status
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
```

Also read these files:

- `docs/architecture.md`
- `docs/api-contracts.md`
- `docs/feature-flows.md`
- `docs/database-schema.md`
- `docs/setup.md`
- `docs/testing.md`
- `docs/decision-log.md`
- `docs/progress.md` (if it exists)
- `prisma/schema.prisma`

### Step 2 — Determine status for each MVP module

Check the following for each module. A module is **Done** ✅ if it has: API route, service, schema/types, and (if applicable) UI page all implemented with real logic (not stubs). It is **In Progress** 🔄 if partially built. It is **Pending** ⏳ if not started.

MVP modules to evaluate:

- Authentication (register, login with OTP, verify OTP, refresh, logout, me)
- User Profile (get/update profile)
- Family Members (CRUD)
- Medical Records (CRUD + file upload)
- Prescriptions (CRUD)
- Lab Reports (CRUD + file upload)
- Reminders (CRUD)
- Timeline (list events)
- AI Summaries (extract + summarize)
- File Storage (upload service)

For each module, inspect the actual source files — read them briefly to confirm the logic is real, not an empty stub.

### Step 3 — Update `docs/progress.md`

Create or fully rewrite `docs/progress.md` with this structure:

```markdown
# Project Progress

Last updated: <today's date>

## MVP Module Status

| Module         | Backend API | Service  | Types/Schema | Frontend UI | Status   |
| -------------- | ----------- | -------- | ------------ | ----------- | -------- |
| Authentication | ✅/🔄/⏳    | ✅/🔄/⏳ | ✅/🔄/⏳     | ✅/🔄/⏳    | ✅/🔄/⏳ |
| ...            |

Legend: ✅ Done · 🔄 In Progress · ⏳ Pending

## Recent Changes

<!-- What was done recently, derived from git log -->

## What's Next

<!-- The top 3 pending items to tackle next, in priority order -->

## Known Issues / TODOs

<!-- Any stubs, placeholder implementations, or known gaps found in the code -->
```

Fill every cell with the real status you determined in Step 2. Be specific about what's missing in the "Known Issues" section.

### Step 4 — Update other docs if implementation diverged from design

Read each doc and compare against what's actually implemented:

- **`docs/api-contracts.md`** — add or update any endpoint entries that exist in code but are missing/wrong in the doc. Mark new or changed endpoints clearly.
- **`docs/feature-flows.md`** — update any flows that were implemented differently than described.
- **`docs/architecture.md`** — add any new patterns or deviations introduced during implementation.
- **`docs/decision-log.md`** — append a dated entry for any decisions made since the last update (e.g., "Chose OTP login instead of password-only: 2026-06-30").

Only edit a doc if the implementation genuinely diverges from what it says. Do not rewrite docs just for the sake of it.

### Step 5 — Report back

After updating the files, output a concise summary:

- Which modules are done, in-progress, pending
- Which doc files were updated and why
- Any notable gaps or issues found

Keep the summary under 30 lines.
