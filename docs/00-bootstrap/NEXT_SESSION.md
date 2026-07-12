# NEXT_SESSION.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 007 |
| Date opened | 2026-07-11 |
| Agent | orchestrator (Mavis) |
| Goal | **Run smoke test and implement dashboard placeholder.** |

---

## Context

Sessions 005–006 fixed all critical bugs (migration ordering, connection leak, missing layout/Tailwind, middleware Edge-compatibility, unused parameters, `"use server"` directives). The app now:

- Compiles without errors (`pnpm -r typecheck` passes)
- Lints cleanly (`pnpm -r lint` passes)
- All 18 tests pass (`pnpm -r test` passes)
- Has working middleware (Edge-compatible, uses `getToken`)
- Has `GET /api/users` and `GET /api/auth/session` API routes
- Has Tailwind CSS configured
- Has root layout with RTL support

The smoke test (docker compose, migrate, seed, curl) has NOT been executed yet because Docker is not available on the development machine.

## Task

### 1. Run the smoke test (requires Docker + Postgres)

- `docker compose up -d` — Postgres 16 + Adminer
- `pnpm --filter @hawza/core db:migrate` — apply the first migration
- `pnpm --filter @hawza/core db:seed:dev` — seed demo tenant + admin user
- `pnpm --filter web dev` — start Next.js dev server
- `curl http://localhost:3000/api/health` — expect `{"status":"ok","db":true,...}`
- `curl -i http://localhost:3000/login` — expect 200 with Persian login form
- Log in via `hawza-demo` / `admin@hawza.local` / `changeme`
- `curl http://localhost:3000/api/users` — expect list of users (after login)
- `curl http://localhost:3000/api/auth/session` — expect session data

### 2. Dashboard placeholder

Replace the homepage placeholder (`apps/web/src/app/page.tsx`) with a simple dashboard showing:
- User name, email, role, tenant slug
- Sign out button
- Basic layout with Tailwind

### 3. Sign out route

Implement `POST /api/auth/signout` or use NextAuth's built-in sign-out.

## Out of scope (do NOT do in this session)

- Other bounded contexts (Catalog, Learning, Credentials, Localization) — deferred to dedicated sessions
- Event bus implementation
- Hosting / deployment
- Object storage, email, background jobs
- UI beyond Tailwind defaults (no component library)

## Done-when checklist

- [ ] `docker compose up -d` starts Postgres + Adminer without errors
- [ ] `pnpm --filter @hawza/core db:migrate` succeeds and is idempotent
- [ ] `pnpm --filter @hawza/core db:seed:dev` creates demo tenant + admin
- [ ] `pnpm --filter web dev` starts without errors
- [ ] `/api/health` returns 200 with `db: true`
- [ ] `/login` renders the Persian form
- [ ] Login with seeded super_admin succeeds; session cookie has correct flags
- [ ] `/api/users` returns list of users after login
- [ ] `/api/auth/session` returns session data after login
- [ ] Homepage shows dashboard with user info
- [ ] Sign out works and clears session
- [ ] Vitest suite passes: `pnpm -r test`
- [ ] Lint passes: `pnpm -r lint`
- [ ] Typecheck passes: `pnpm -r typecheck`
- [ ] `MASTER_HANDOFF.md` has the Session 007 entry
- [ ] `CHANGELOG.md` `[Unreleased]` is updated

## Notes for the next agent

- Docker is required for the smoke test. If unavailable, use a local Postgres install or skip to code tasks.
- Middleware uses `getToken` from `next-auth/jwt` (Edge-compatible), NOT `auth()` from NextAuth.
- API routes do NOT use `"use server"` — only Server Components and Server Actions use that directive.
- The `getTenantDb` connection leak was fixed by removing the per-connection pattern entirely. All queries now use the pooled `getDb()` with explicit WHERE tenant_id clauses.
- Tailwind CSS v3 is used (not v4). Config is in `tailwind.config.ts` + `postcss.config.mjs`.
- The root layout at `apps/web/src/app/layout.tsx` sets `html lang="fa" dir="rtl"` and imports `globals.css`.
- Plugin vitest configs now include resolve aliases for `@hawza/core` and `@hawza/contracts` to match tsconfig paths.
