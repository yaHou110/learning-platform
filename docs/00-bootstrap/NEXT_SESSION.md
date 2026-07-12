# NEXT_SESSION.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 009 |
| Date opened | 2026-07-11 |
| Agent | orchestrator (Mavis) |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M2 — Production Build Validation.** `next build` artifact is already in `apps/web/.next/` from M1. Run `next start` against it on a non-dev port, smoke-test the production server (login, `/api/health`, `/api/users`, `/api/auth/session`, sign-out, RTL page render), and capture every response. |
| Status | 🔵 in progress |

---

## Context

Session 008 closed **M1 (Baseline Verification)** with all five quality gates green. M1 also fixed five real issues in the build pipeline (see `MASTER_HANDOFF.md` Session 008 and `evidence/M1-baseline/notes.md`).

`pnpm build` produced `apps/web/.next/` (server build, static, and middleware bundle). M2 starts that production server and validates that the **production-mode runtime behavior** matches what we saw in dev mode in session 007.

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence dir: `../06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/`

## M2 — Production Build Validation — task

### 2.1 Pre-flight
- Verify `apps/web/.next/` exists from M1 build
- Check `apps/web/.next/BUILD_ID` exists
- Read `apps/web/.next/required-server-files.json` (or the App-Router equivalent) to confirm the build is complete
- Confirm a Postgres instance is reachable (use the docker-compose one if available; otherwise start it)

### 2.2 Start production server
- Set required env vars: `AUTH_SECRET`, `DATABASE_URL`
- Run `pnpm --filter web start` (which is `next start`) on port 3000 (or a dedicated port 3100 to avoid conflicts with `next dev`)
- Wait until the server is ready (poll `/api/health` until 200)
- Save PID for clean shutdown

### 2.3 Smoke test — protected routes
- `curl -i http://localhost:<port>/api/health` → expect 200 with `{"status":"ok","db":true,...}`
- `curl -i http://localhost:<port>/` (no cookie) → expect 307 redirect to `/login?callbackUrl=%2F`
- `curl -i http://localhost:<port>/api/users` (no cookie) → expect 307 redirect (middleware)

### 2.4 Smoke test — login + protected API
- POST credentials to `/api/auth/callback/credentials` (Auth.js's built-in endpoint) with a seeded super_admin (`admin@hawza.local` / `changeme`) on tenant `hawza-demo`
- Capture the session cookie from the response (`Set-Cookie: authjs.session-token=...`)
- With the cookie:
  - `GET /api/auth/session` → expect 200 with `user.id`, `user.email`, `user.role`, `user.tenantId`
  - `GET /api/users` → expect 200 with the user list
  - `GET /` → expect 200 with the dashboard HTML (Persian, RTL)

### 2.5 Sign-out + negative tests
- `POST /api/auth/signout` with the cookie → expect 200/302 and the session cookie cleared
- After sign-out: `GET /api/users` → expect 307 redirect to `/login`
- Send an invalid cookie: `GET /api/users` → expect 307 redirect to `/login`

### 2.6 Static asset check
- `GET /_next/static/...` for a known chunk (from M1 build output) → expect 200 with `Content-Type: application/javascript`
- This proves the Edge runtime can serve the prebuilt bundle.

### 2.7 Shutdown
- Stop the `next start` process cleanly (SIGTERM, not SIGKILL)
- Verify exit code 0

### 2.8 Evidence file
Write `evidence/M2-prod-build/`:
- `commands.txt` — exact commands run
- `output-start.txt` — `next start` startup log
- `output-smoke-*.txt` — curl outputs for each smoke test
- `checklist.md` — milestone done-when with ticks
- `notes.md` — observations, deviations, decisions

### 2.9 Documentation updates
- `CHANGELOG.md` `[Unreleased]` — M2 entry
- `MASTER_HANDOFF.md` — append Session 009 entry
- `NEXT_SESSION.md` — rotate to M3
- `PROJECT_STATE.md` — mark M2 complete, M3 in progress
- Update SPRINT-001 milestone table to ✅ for M2

### 2.10 Commit
- One commit, Conventional Commits

## Done-when checklist (M2)

- [ ] `.next/BUILD_ID` exists; preflight passes
- [ ] `next start` boots without error
- [ ] `/api/health` returns 200 + `db:true`
- [ ] Unauthenticated requests to protected routes redirect to `/login`
- [ ] Login flow returns a valid session cookie
- [ ] Authenticated `GET /api/auth/session` returns typed user
- [ ] Authenticated `GET /api/users` returns the user list
- [ ] Authenticated `GET /` returns 200 with Persian RTL HTML
- [ ] Sign-out clears the cookie
- [ ] Static asset request returns 200 with correct `Content-Type`
- [ ] `next start` exits 0 on SIGTERM
- [ ] All evidence files in `evidence/M2-prod-build/`
- [ ] Documentation updated, commit made

## Out of scope (do NOT do in this session)

- Anything beyond M2. M3 (CI) is next.
- New features (Catalog, Learning, etc.)
- Changing the database schema
- New env vars beyond what M2 needs (`AUTH_SECRET`, `DATABASE_URL`)

## Notes for the next agent

- Run `next start` in the background (`Start-Process` or `&` job), then poll `/api/health` until 200 before running the smoke tests. Do not block the shell on the server.
- PowerShell execution policy blocks `pnpm` directly. Use `cmd /c "pnpm --filter web start"` or run the underlying `next start` via `npx` / `node_modules/.bin/next`.
- Capture both stdout AND stderr from `next start`. Production builds surface warnings only at startup.
- If a smoke test fails, STOP. Document the failure in `notes.md` with the full response (headers + body). Do not silently retry or pivot.
- If Docker / Postgres is not running, document the blocker in `notes.md` and pause for founder input. Do not mock.
