# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 010 |
| Date opened | 2026-07-12 |
| Agent | opencode/mimo-v2.5-free |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M2 — Production Build Validation (resume).** PostgreSQL must be installed first (admin required). Then: `next start` against the production build, smoke test all endpoints (login, `/api/health`, `/api/users`, `/api/auth/session`, sign-out, static assets), capture evidence, update docs. |
| Status | 🔵 blocked on PostgreSQL |

---

## Context

Session 009 performed a comprehensive code review and applied 8 quality fixes (security headers, env validation, health route fix, etc.). The production build is ready (`apps/web/.next/` exists, build passes). However, the `next start` smoke test is **blocked** because PostgreSQL 16 is not installed on this machine and installation requires admin privileges.

### Blocker resolution (pick one)
1. **Run cmd as Administrator** → `choco install postgresql16 -y --params "/Password:hawza /UserName:hawza /dbName:hawza /port:5432"`
2. **Install Docker Desktop** (admin needed) → then `docker compose up -d` uses the existing `docker-compose.yml`
3. **Use a remote PostgreSQL** → set `DATABASE_URL` in `.env` to point at an accessible instance

Once PostgreSQL is running:
- Run `pnpm --filter @hawza/core db:migrate` to apply migrations
- Run `pnpm --filter @hawza/core db:seed:dev` to create the demo tenant
- Then proceed with the M2 smoke test steps below

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence dir: `../06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/`

## M2 — Production Build Validation — task (remaining steps)

### 2.2 Start production server
- Create `.env` with `AUTH_SECRET` and `DATABASE_URL`
- Run `pnpm --filter @hawza/core db:migrate` then `pnpm --filter @hawza/core db:seed:dev`
- Run `pnpm --filter web start` on port 3000
- Wait until `/api/health` returns 200

### 2.3–2.7 Smoke tests
- Unauthenticated `/` → 307 redirect to `/login`
- Unauthenticated `/api/users` → 307 redirect
- Login with seeded user → session cookie
- Authenticated `/api/auth/session` → typed user JSON
- Authenticated `/api/users` → user list JSON
- Authenticated `/` → 200 with Persian RTL HTML
- Sign-out → cookie cleared
- Invalid cookie → 307 redirect
- Static asset `/_next/static/...` → 200 with JS content-type

### 2.8–2.10 Evidence + docs + commit
- Write evidence files, update CHANGELOG/HANDOVER/BACKLOG/STATE, commit

## Done-when checklist (M2)

- [ ] `.next/BUILD_ID` exists; preflight passes ✅ (done in session 009)
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

- PostgreSQL installation requires admin. If you cannot get admin, document the blocker and pause.
- The `.env` file must be created in `apps/web/` (not repo root) with at minimum: `AUTH_SECRET=<random-32-byte-base64>`, `DATABASE_URL=postgres://hawza:hawza@localhost:5432/hawza`.
- Run `next start` in the background, then poll `/api/health` until 200 before running smoke tests.
- PowerShell execution policy blocks `pnpm` directly. Use `cmd /c "pnpm ..."`.
- If a smoke test fails, STOP. Document the failure. Do not silently retry.
