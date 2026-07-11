# NEXT_SESSION.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 006 |
| Date opened | 2026-07-11 |
| Agent | orchestrator (Mavis) |
| Goal | **Fix critical bugs (migration ordering, connection leak, missing layout/Tailwind) and make the app compilable.** |

---

## Context

Session 005 left the codebase with source code already written for the Identity & Access bounded context (schema, auth, login page, health API, plugin registry, 5 plugin manifests). However, the app was not in a runnable state due to:

1. Migration SQL creates `citext` extension AFTER the table that uses it (will fail at runtime)
2. `getTenantDb()` leaks a pooled connection on every call (never releases the client)
3. Missing root `layout.tsx` (Next.js 15 App Router requirement)
4. Missing Tailwind CSS setup (`globals.css`, `tailwind.config.ts`, `postcss.config.mjs`)
5. Plugin Vitest configs lack resolve aliases (tests fail with "Failed to load url @hawza/core/plugins")

All of these were fixed in Session 005 (run by a code-review agent). The app compiles, typechecks pass, lint passes, and all tests pass.

The smoke test (docker compose, migrate, seed, curl) could not be executed because Docker is not available on the development machine. This is the first task for Session 006.

## Task

### 1. Run the smoke test (requires Docker + Postgres)

- `docker compose up -d` — Postgres 16 + Adminer
- `pnpm --filter @hawza/core db:migrate` — apply the first migration
- `pnpm --filter @hawza/core db:seed:dev` — seed demo tenant + admin user
- `pnpm --filter web dev` — start Next.js dev server
- `curl http://localhost:3000/api/health` — expect `{"status":"ok","db":true,...}`
- `curl -i http://localhost:3000/login` — expect 200 with Persian login form
- Log in via `hawza-demo` / `admin@hawza.local` / `changeme`

### 2. Implement the first plugin API routes

Pick one plugin (e.g. `plugin-auth`) and implement the API routes declared in its manifest:
- `GET /api/users` — list users for the current tenant
- These routes should use `@hawza/core/api` (identity CRUD) behind Auth.js middleware

### 3. Add middleware for route protection

- `apps/web/src/middleware.ts` — check session, redirect unauthenticated users to `/login`

### 4. (Stretch) Dashboard placeholder

- Replace the homepage placeholder with a simple dashboard showing the user's name, role, and tenant slug.

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
- [ ] Vitest suite passes: `pnpm -r test`
- [ ] Lint passes: `pnpm -r lint`
- [ ] Typecheck passes: `pnpm -r typecheck`
- [ ] `MASTER_HANDOFF.md` has the Session 006 entry
- [ ] `CHANGELOG.md` `[Unreleased]` is updated

## Notes for the next agent

- Docker is required for the smoke test. If unavailable, use a local Postgres install or skip to code tasks.
- The `getTenantDb` connection leak was fixed by removing the per-connection pattern entirely. All queries now use the pooled `getDb()` with explicit WHERE tenant_id clauses. The `withTenantDb()` helper remains available for future per-connection RLS enforcement.
- Tailwind CSS v3 is used (not v4). Config is in `tailwind.config.ts` + `postcss.config.mjs`.
- The root layout at `apps/web/src/app/layout.tsx` sets `html lang="fa" dir="rtl"` and imports `globals.css`.
- Plugin vitest configs now include resolve aliases for `@hawza/core` and `@hawza/contracts` to match tsconfig paths.
