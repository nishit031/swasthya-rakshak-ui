# Local Runbook — Swasthya Rakshak Frontend

Quick commands to start the app locally and verify the current state.

> **Note:** The app is split into **two separate repositories**:
>
> - **Frontend** — Next.js (pages + client) — `swathya-rakshak/` (this repo), `npm run dev` → http://localhost:3000
> - **Backend** — Laravel 13 API, serving the `/api/v1/*` contract — the sibling repo
>   `swathya-rakshak-backend/` (see its own `RUNBOOK.md` for setup)
>
> The frontend talks to the backend over HTTP via `NEXT_PUBLIC_BACKEND_API_URL` — there is no same-origin
> API anymore. Both must be running for the app to work. Shared infra (Postgres, Presidio, OCR)
> is started once via `docker-compose up -d` from the repo root.

---

## 1. One-time setup (first run only)

```bash
npm install
cp .env.example .env      # then set NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL — see section 4
```

For the backend, see `../swathya-rakshak-backend/RUNBOOK.md`.

---

## 2. Start shared infra (Postgres + Presidio + OCR)

```bash
docker-compose up -d        # or: docker compose up -d
```

This starts three containers:

| Container                   | Purpose                                                                 | Port |
| --------------------------- | ----------------------------------------------------------------------- | ---- |
| `swasthya_rakshak_db`       | PostgreSQL 16 (used by the backend)                                     | 5432 |
| `swasthya_rakshak_presidio` | Name/address NER for AI redaction (backend fails closed if unreachable) | 5002 |
| `swasthya_rakshak_ocr`      | Routed PaddleOCR microservice (backend falls back to on-box tesseract)  | 8081 |

None of these are talked to directly by this repo — they're all consumed by the backend. Start
them here anyway since this is where the Compose file lives.

**Fallback — if the Compose plugin is NOT installed:**

```bash
docker run -d --name swasthya_rakshak_db --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=swasthya_rakshak \
  -p 5432:5432 \
  -v swasthya_rakshak_db_data:/var/lib/postgresql/data \
  postgres:16
```

(Presidio/OCR only matter for the backend's AI summary/extract flow — skip them if you're not
touching that.)

**Check it's up:**

```bash
docker ps --filter "name=swasthya_rakshak"
docker exec swasthya_rakshak_db pg_isready -U postgres
```

**Stop / start / remove later:**

```bash
docker-compose stop         # stop all (keeps data)
docker-compose start        # start again
docker-compose down         # remove containers (data volume survives)
```

---

## 3. Start the backend, then this app

```bash
# In ../swathya-rakshak-backend (separate terminal) — see its RUNBOOK.md for full detail:
composer install && php artisan migrate && php artisan serve --host=0.0.0.0 --port=5000

# In this repo:
npm run dev                 # http://localhost:3000, also reachable at http://<your-LAN-ip>:3000
```

- App / pages: http://localhost:3000
- Login page: http://localhost:3000/login
- Register: http://localhost:3000/register

Stop either with `Ctrl+C`.

---

## 6. Required environment variables

**Frontend `.env`** (repo root):

| Variable                            | What to set                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_API_URL`                   | Backend origin — `http://127.0.0.1:5000` for local dev. Leave empty only for a same-origin setup (not the current split). If this hostname is `127.0.0.1`/`localhost`, the frontend swaps it in the browser for whatever host the page itself was loaded from (see `src/backend/lib/api-url.ts`) — so the same value works whether you open `localhost:3000` or `http://<your-LAN-ip>:3000` from another device. |
| `DATABASE_URL`                      | Leave as-is for local Docker: `postgresql://postgres:postgres@localhost:5432/swasthya_rakshak` (used by the legacy Prisma scripts only)                                                                                                                                                                                                                                                                          |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Must match the backend's values — `openssl rand -hex 32`                                                                                                                                                                                                                                                                                                                                                         |
| `STORAGE_PROVIDER`                  | `local` for dev                                                                                                                                                                                                                                                                                                                                                                                                  |
| `SMS_PROVIDER`                      | `console` for dev (OTP is printed to the backend console, not texted)                                                                                                                                                                                                                                                                                                                                            |
| `AI_API_KEY` / `AI_MODEL`           | Not used on the frontend anymore — the AI gateway lives in the backend                                                                                                                                                                                                                                                                                                                                           |

**Backend `backend/.env`:**

**This repo's `.env`:**

| Variable                      | What to set                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_NEXT_PUBLIC_BACKEND_API_URL` | Backend origin — `http://127.0.0.1:5000` for local dev. If this hostname is `127.0.0.1`/`localhost`, the frontend swaps it in the browser for whatever host the page itself was loaded from (see `src/backend/lib/api-url.ts`) — so the same value works whether you open `localhost:3000` or `http://<your-LAN-ip>:3000` from another device. |
| `COMPOSE_PROJECT_NAME`        | Pins the shared Docker Compose volume/container names regardless of folder path                                                                                                                                                                                                                                                                |
| `NODE_ENV`                    | Standard Next.js environment flag                                                                                                                                                                                                                                                                                                              |

Everything else this app used to need directly (`DATABASE_URL`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `STORAGE_PROVIDER`, `SMS_PROVIDER`, `AI_API_KEY`, `AI_MODEL`,
`PRESIDIO_URL`, `OCR_SERVICE_URL`) belongs to the backend now — see
`../swathya-rakshak-backend/RUNBOOK.md` for that list. This app only ever sends/receives an
opaque bearer token; it never signs or verifies one.

---

## 5. Verify the auth flow (phone + OTP)

With **both** the backend (`php artisan serve`) and this app (`npm run dev`) running, in another
terminal — requests go straight to the backend:

```bash
BASE=http://127.0.0.1:5000/api/v1
PHONE=9876500000

# 1. Register (phone + password) -> OTP is returned as devCode (dev only) and logged to the backend console
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User\",\"phone\":\"$PHONE\",\"password\":\"secret123\"}"

# 2. Verify the OTP (use the devCode from step 1) -> returns accessToken + refreshToken
curl -s -X POST $BASE/auth/register/verify -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"<DEV_CODE_HERE>\"}"

# 3. Login with password
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"password\":\"secret123\"}"

# 4. Login with OTP (request, then verify)
curl -s -X POST $BASE/auth/login/request-otp -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\"}"
curl -s -X POST $BASE/auth/login/verify-otp  -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\",\"otp\":\"<DEV_CODE_HERE>\"}"

# 5. Get current user (use accessToken from any login/verify above)
curl -s $BASE/auth/me -H "Authorization: Bearer <ACCESS_TOKEN_HERE>"
```

The OTP also appears in the backend's `php artisan serve` terminal as a line like:
`[SMS:console] to +919876500000 -> Your Swasthya Rakshak verification code is 123456. ...`

Then open http://localhost:3000/login in the browser and confirm the same flow works end-to-end
through the frontend (it should hit the backend via `NEXT_PUBLIC_BACKEND_API_URL`, not a local API route).

---

## 6. Health checks for the codebase

```bash
npm run typecheck           # TypeScript: should report no errors
npm run lint                # ESLint: should be clean
npm run format:check        # Prettier formatting check
npm run test                # Vitest
```

For the backend, see `../swathya-rakshak-backend/RUNBOOK.md` (`composer test` / `php artisan test`).

---

## TL;DR (everything, in order)

```bash
# Infra (this repo)
docker-compose up -d

# Backend
cd backend
cp .env.example .env                     # then set DB_*, JWT_SECRET, JWT_REFRESH_SECRET (section 6)
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=5000 &
cd ..

# Frontend
cp .env.example .env                     # then set NEXT_PUBLIC_BACKEND_API_URL + matching JWT secrets (section 6)
npm install
npm run dev                 # -> http://localhost:3000
```
