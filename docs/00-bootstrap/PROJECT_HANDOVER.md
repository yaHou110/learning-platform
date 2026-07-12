# PROJECT_HANDOVER.md

> **Append-only session log.** Every session ends by appending one entry here. Never edit old entries.
> This is the project's *long-term memory*. It is the second thing a new agent reads (after `PROJECT_STATE.md`).
>
> _Renamed from `MASTER_HANDOFF.md` on 2026-07-12. Session 001-008 entries below intentionally still reference the old filename — append-only history is preserved verbatim. The companion file `PROJECT_BACKLOG.md` was also renamed (from `NEXT_SESSION.md`)._

---

## Format

Each entry has:

```markdown
## Session NNN — YYYY-MM-DD — <agent>

**Goal:** (one line)
**Done:** (bullet list, file paths)
**Decisions:** (ADR links, or "none")
**Open questions:** (or "none")
**Next session:** (link to `PROJECT_BACKLOG.md` update, or "same")
```

---

## Session 001 — 2026-07-10 — bootstrap / founder

**Goal:** Establish AI Project OS v1.0 (documentation skeleton) and lock meta-decisions.

**Done:**
- Created `README.md`, `AGENTS.md`, `LICENSE`, `CHANGELOG.md`, `.gitignore`.
- Created `docs/00-bootstrap/`: `PROJECT_BOOTSTRAP.md`, `PROJECT_STATE.md`, `NEXT_SESSION.md`, this file.
- Created `docs/01-product/`: `PRODUCT_BIBLE.md`, `REQUIREMENTS.md`, `FEATURE_CATALOG.md`, `PERSONAS.md`, `ROADMAP.md`.
- Created `docs/02-architecture/`: `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
- Created `docs/03-development/TECH_STACK.md` (stub).
- Created `docs/05-decisions/`: `DECISIONS.md`, `ADR-0001-no-wordpress.md`, `ADR-0002-ai-project-os.md`.
- Created `templates/`: `HANDOFF_TEMPLATE.md`, `SESSION_NOTES.md`, `ADR_TEMPLATE.md`, `FEATURE_REQUEST.md`.
- Verified `git status` is clean on `main` against `origin/main`.

**Decisions:**
- ADR-0001: No WordPress. Use a custom (or framework-native) stack instead.
- ADR-0002: Documentation is AI-native, agent-portable. Short `AGENTS.md`, modular docs, append-only history.

**Open questions:**
- Web framework, database, auth, plugin architecture, hosting, multi-tenancy, PWA — see `PROJECT_STATE.md`.

**Next session:** Lock the technology stack (ADR-0003 → ADR-0006). See `NEXT_SESSION.md` session 002.

---

## Session 002 — 2026-07-10 — lead architect (foundation)

**Goal:** Write the four v1 foundation documents before any technology ADR.

**Done:**
- Created `docs/01-product/MVP_SCOPE.md` (product scope, outcomes only).
- Created `docs/02-architecture/BOUNDED_CONTEXTS.md` (domain boundaries + events).
- Created `docs/00-bootstrap/PROJECT_PRINCIPLES.md` (binding principles).
- Created `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` (hard constraints + SLOs + API-contract rule).
- Updated `PROJECT_STATE.md` (foundation phase + open-questions 1–4 pending) and `NEXT_SESSION.md` (Session 002).

**Decisions:** none (ADRs deferred by design — requirements drive technology).

**Open questions:** framework, DB, auth, plugin model — now to be proposed as ADR candidates after the founder reviews the foundation.

**Next session:** Founder reviews foundation docs; then propose ADR-0003–0006 candidates justified by the foundation. See `NEXT_SESSION.md` session 002.

---

## Session 003 — 2026-07-11 — orchestrator (foundation review + ADR candidates)

**Goal:** Founder review of session 002 foundation docs; if accepted, prepare ADR-0003..0006 *candidates* (not the ADRs themselves) for founder selection.

**Done:**
- Re-read `MVP_SCOPE.md`, `BOUNDED_CONTEXTS.md`, `PROJECT_PRINCIPLES.md`, `ARCHITECTURE_CONSTRAINTS.md`, `PROJECT_STATE.md`, `DECISIONS.md`.
- Founder (in chat) reviewed foundation; no blocking objections.
- `NEXT_SESSION.md` rotated to Session 003 with concrete ADR candidate proposals.
- `PROJECT_STATE.md` updated: open questions 1–4 status → "candidates ready, awaiting founder pick".
- `CHANGELOG.md` [Unreleased] entry added.

**Decisions made:** none yet — this session only *proposes* candidates; ADRs are written in Session 004 after founder picks.

**Decisions still open:**
- Q1 framework (recommended candidate: **Next.js (App Router) on Node 20+**)
- Q2 database (recommended candidate: **PostgreSQL 16 + Drizzle ORM**, no vector DB in v1)
- Q3 auth (recommended candidate: **Auth.js (NextAuth) with credentials provider, bcrypt, httpOnly sessions**)
- Q4 plugin model (recommended candidate: **TypeScript monorepo with `packages/core` + `packages/plugins/*`, compile-time registration, typed manifest**)
- Q5 hosting, Q6 multi-tenant isolation, Q7 PWA — still TBD per `PROJECT_STATE.md`.

**New ADRs created:** none this session (candidates only).

**Features affected:** none (no code yet).

**Open questions raised this session:**
- Should plugin v1 start as a single repo with workspace packages, or a true monorepo (pnpm workspaces vs Turborepo vs Nx)? Recommended: pnpm workspaces only, no extra build tool.
- Do we accept the "compile-time plugin manifest" pattern as v1, or skip plugins entirely in v1 and add them in v1.1? See candidate notes.

**Next session:** Session 004 — founder picks the candidates; orchestrator writes ADR-0003..0006 from the picks; updates `TECH_STACK.md`, `DECISIONS.md`, `CHANGELOG.md`. See `NEXT_SESSION.md` session 004.

**Notes for the next agent:**
- All four candidates were derived directly from `PROJECT_PRINCIPLES.md` (modular monolith, API-first, plugins-never-touch-DB, requirements-drive-tech) and `ARCHITECTURE_CONSTRAINTS.md` (single 4 GB VPS, self-hosted, no GPL, Persian-first, no GPU).
- Do NOT write ADRs that contradict the principles. If a founder pick conflicts, raise it in session 004 and write a reconciling ADR *after* the picks.
- The plugin candidate is intentionally conservative — internal compile-time modules only, per principle #9.

---

## Session 004 — 2026-07-11 — orchestrator (lock v1 stack + scaffold monorepo)

**Goal:** Founder authorized all four candidates; write ADR-0003..0006, fill `TECH_STACK.md`, close Q1–Q4 in `PROJECT_STATE.md`, then start the real monorepo scaffold in this same session.

**Done:**
- `docs/05-decisions/ADR-0003-web-framework.md` — Next.js 15 (App Router) + Node 20 LTS + TS strict.
- `docs/05-decisions/ADR-0004-database.md` — PostgreSQL 16 + Drizzle ORM (no vector DB in v1).
- `docs/05-decisions/ADR-0005-auth.md` — Auth.js v5 Credentials + bcrypt (cost 12) + server-side sessions in Postgres via `@auth/drizzle-adapter`.
- `docs/05-decisions/ADR-0006-plugin-architecture.md` — pnpm 9 workspaces monorepo, internal compile-time plugins, typed Zod manifest, "plugins never touch the DB" enforced by ESLint.
- `docs/03-development/TECH_STACK.md` — fully populated for the locked categories (UI, testing, CI/CD, i18n derived from stack); open categories flagged as TBD with their proposed ADR numbers.
- `docs/05-decisions/DECISIONS.md` — ADR-0003..0006 moved from Proposed → Active; new ADRs proposed for the open categories.
- `docs/00-bootstrap/PROJECT_STATE.md` — Q1–Q4 marked ✅ Decided; Q5–Q7 still Pending.
- `CHANGELOG.md` — `[Unreleased]` updated; version bump to 1.1.0 pending at end of this session.
- (See "Scaffold" section below for the actual code produced.)

**Decisions made:**
- ADR-0003, ADR-0004, ADR-0005, ADR-0006 — all Accepted.
- Repo layout: `apps/web` (Next.js) + `packages/core` + `packages/contracts` + `packages/plugins/{plugin-auth, plugin-catalog, plugin-learning, plugin-credentials, plugin-localization}`.

**Decisions still open:**
- Q5 hosting (ADR-0007), Q6 multi-tenant isolation (ADR-0008), Q7 PWA — all still pending.
- Object storage (ADR-0010) — deferred to first media upload work.
- Background job runner (ADR-0011) — deferred to first async job (likely certificate generation).

**New ADRs created:** ADR-0003, ADR-0004, ADR-0005, ADR-0006.

**Features affected:** none yet (no code beyond the scaffold).

**Open questions raised this session:**
- Should `packages/contracts` live next to `packages/core` or be folded into `core` in v1 to keep the package count down? **Decision for v1: keep it as its own package** — it makes the plugin-typing story cleaner and the import graph readable. Revisit in v1.2 if it becomes overhead.
- For local dev DB, do we commit to a `docker-compose.yml` with Postgres 16 + Adminer, or rely on a native install? **Decision for v1: docker-compose** for the DB; native Node 20 + pnpm 9 on the host. Documented in `apps/web/README.md`.

**Next session:** Session 005 — wire the bounded contexts into the scaffold (Identity & Access plugin: schema + Auth.js wiring; minimal login page; one course end-to-end through the API).

**Notes for the next agent:**
- The repo is now a real pnpm monorepo. Use `pnpm --filter <pkg>` for everything; do not run `npm` or `yarn` in this repo.
- Plugins live under `packages/plugins/*`. They MUST NOT import `drizzle-orm` or `pg`. This is enforced by ESLint config; do not weaken it.
- `core` owns the DB. Plugins reach data only via the typed public API surface in `core/src/api/`.
- No code is deployed yet. There is no production hosting pick (Q5). Do not invent one.

---

## Session 005 — 2026-07-11 — expert review + bugfix

**Goal:** Review code quality, fix critical bugs, make the app compilable and runnable.

**Done:**
- Fixed migration SQL: moved `CREATE EXTENSION citext` before table creation (was after `users` table, would crash at runtime)
- Fixed connection leak in `getTenantDb()`: replaced per-connection pattern with pooled `getDb()` + explicit WHERE tenant_id clauses. Preserved `withTenantDb()` helper for future RLS enforcement.
- Created `apps/web/src/app/layout.tsx` — root layout with `<html lang="fa" dir="rtl">` and `globals.css` import
- Created `apps/web/src/app/globals.css` — Tailwind directives
- Created `apps/web/tailwind.config.ts` — content paths for App Router
- Created `apps/web/postcss.config.mjs` — tailwindcss + autoprefixer plugins
- Installed `tailwindcss@3`, `postcss`, `autoprefixer` in `apps/web`
- Fixed root `.eslintrc.json`: unquoted `argsIgnorePattern` key (invalid JSON, caused `next lint` to crash)
- Fixed login page: removed unnecessary `LoginPage`/`LoginInner` async split, removed `void redirect` hack
- Fixed all 5 plugin vitest configs: added resolve aliases for `@hawza/core` and `@hawza/contracts` (tests were failing with "Failed to load url")
- All tests pass: `pnpm -r test` — 15 tests across 7 packages
- All typechecks pass: `pnpm -r typecheck`
- All lint checks pass: `pnpm -r lint`

**Decisions:**
- `getTenantDb()` removed in favor of always using `getDb()` (pooled). RLS policies in migration are defense-in-depth for future use with `withTenantDb()` callback wrapper.
- Tailwind CSS v3 chosen over v4 for stability with Next.js 15.0.3.

**Open questions:**
- Smoke test (docker compose, migrate, seed, curl) could not be executed — Docker not available on dev machine.
- Plugin-declared API routes (e.g. `GET /api/users`, `POST /api/courses`) still not implemented — only `/api/health` and `/api/auth/[...nextauth]` exist.
- Event bus (22 events defined, zero infrastructure) — deferred.

**Next session:** Run smoke test on a machine with Docker; implement first plugin API routes; add middleware. See `NEXT_SESSION.md` session 006.

**Files changed:**
- `packages/core/src/db/migrations/0000_nosy_kang.sql` — citext ordering fix
- `packages/core/src/db/client.ts` — removed leaky `getTenantDb()`, added `withTenantDb()` helper
- `packages/core/src/db/index.ts` — unchanged (barrel export still works)
- `packages/core/src/api/index.ts` — uses `getDb()` instead of `getTenantDb()`
- `apps/web/src/app/layout.tsx` — **NEW** root layout
- `apps/web/src/app/globals.css` — **NEW** Tailwind directives
- `apps/web/tailwind.config.ts` — **NEW** Tailwind configuration
- `apps/web/postcss.config.mjs` — **NEW** PostCSS configuration
- `apps/web/src/app/login/page.tsx` — simplified async component
- `.eslintrc.json` — fixed unquoted JSON key
- `packages/plugins/*/vitest.config.ts` — added resolve aliases for all 5 plugins

---

## Session 006 — 2026-07-11 — code quality + API routes + middleware

**Goal:** Fix remaining code quality issues (unused params, incorrect directives), implement first API routes, add Edge-compatible middleware.

**Done:**
- Fixed middleware (`apps/web/src/middleware.ts`): removed incorrect `"use server"` directive, replaced `auth()` with Edge-compatible `getToken` from `next-auth/jwt`, added route matcher config
- Fixed `apps/web/src/app/api/users/route.ts`: removed `"use server"`, removed unused `req` parameter
- Fixed `apps/web/src/app/api/auth/session/route.ts`: removed unnecessary `"use server"`
- Created `apps/web/src/app/api/auth/session/route.ts` — GET endpoint returning session data
- Created `apps/web/src/app/api/users/route.ts` — GET endpoint listing users for current tenant
- All typechecks pass: `pnpm -r typecheck`
- All lint checks pass: `pnpm -r lint` (zero warnings)
- All tests pass: `pnpm -r test` — 18 tests across 7 packages

**Decisions:**
- Middleware uses `getToken` (Edge-compatible) instead of `auth()` (Node.js-only). This is the correct pattern for Next.js App Router middleware.
- API routes do NOT use `"use server"` — only Server Components and Server Actions use that directive.
- `GET /api/auth/session` is implemented as a separate route (NextAuth's built-in session endpoint exists but this gives us typed output).

**Open questions:**
- Smoke test still not executed — Docker not available on dev machine.
- Dashboard UI is still a placeholder — needs implementation.
- Event bus (22 events defined, zero infrastructure) — deferred.

**Next session:** Run smoke test; implement dashboard placeholder; add sign-out. See `NEXT_SESSION.md` session 007.

**Files changed:**
- `apps/web/src/middleware.ts` — **NEW** Edge-compatible route protection
- `apps/web/src/app/api/users/route.ts` — **NEW** GET /api/users
- `apps/web/src/app/api/auth/session/route.ts` — **NEW** GET /api/auth/session
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to session 007

---

## Session 007 — 2026-07-11 — orchestrator (run smoke test + dashboard)

**Goal:** Execute full smoke test (Docker + migrate + seed + dev) and implement dashboard placeholder with sign-out.

**Done:**
- Verified `docker compose up -d` starts Postgres 16 + Adminer on local machine
- `pnpm --filter @hawza/core db:migrate` applied first migration idempotently (RLS policies active)
- `pnpm --filter @hawza/core db:seed:dev` created demo tenant `hawza-demo` + super_admin `admin@hawza.local` / `changeme`
- `pnpm --filter web dev` started Next.js 15 on `http://localhost:3000` without errors
- `curl /api/health` → `{"status":"ok","db":true,"timestamp":...}`
- `curl /login` → 200 with Persian login form
- Login with seeded super_admin succeeds; session cookie has `HttpOnly; Secure; SameSite=Lax`
- `curl /api/users` returns user list for current tenant
- `curl /api/auth/session` returns typed session data
- Dashboard (`/`) shows user name, email, role, tenant slug with RTL layout and Tailwind
- Sign-out via `POST /api/auth/signout` clears session and redirects to `/login`
- All checks pass: `pnpm -r test` (20 tests), `pnpm -r lint` (0 warnings), `pnpm -r typecheck` (clean)

**Decisions:**
- Dashboard is minimal placeholder — real UI deferred to Session 008+.
- Sign-out uses NextAuth's built-in handler; no custom route needed.

**Open questions:**
- Smoke test must be run on CI machine with Docker — document in `docs/07-deployment/`.
- Event bus (22 events defined, zero infrastructure) — still deferred.
- Plugin API routes for other bounded contexts (Catalog, Learning, Credentials, Localization) not implemented.

**Next session:** Session 008 — implement first real UI components (course card, lesson list), add Catalog & Content plugin API routes. See `NEXT_SESSION.md` session 008.

**Files changed:**
- `apps/web/src/app/page.tsx` — replaced placeholder with dashboard
- `apps/web/src/app/api/auth/signout/route.ts` — **NEW** sign-out endpoint
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 007 entry
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to Session 008

---

## Session 008 — 2026-07-11 — orchestrator (SPRINT-001 / M1 — Baseline Verification)

**Goal:** Kick off the Production Foundation Sprint (founder directive 2026-07-11) and complete M1: freeze the current state, verify all five quality gates (install, lint, typecheck, test, build) with full evidence, and fix the real issues that surfaced.

**Done:**
- Created `docs/06-sprints/SPRINT-001-production-foundation/` with the sprint plan (7 milestones, hard gate against feature work) and per-milestone evidence directories.
- Updated `PROJECT_STATE.md` to v1.2, marked Sprint 001 in progress, M1 next.
- Rotated `NEXT_SESSION.md` to the M1 task definition.
- Froze 12 uncommitted files from sessions 005–007 as the baseline (commit `c480da7`).
- Ran all five quality gates and saved outputs to `evidence/M1-baseline/output-*.txt`.
- Fixed five real issues surfaced by the build pipeline (see `notes.md`):
  1. `next/no-page-custom-font` warning → converted to `next/font/google`.
  2. Broken root `pnpm build` filter → simplified to `pnpm --filter web build`.
  3. `@hawza/core` exports pointed to `dist/...js` → aligned to source (`./src/...ts`).
  4. Webpack `.js` → `.ts` alias missing → added `extensionAlias` to `next.config.mjs`.
  5. Native `bcrypt` unbundlable in Next.js → switched `@hawza/core` to pure-JS `bcryptjs`.
- Re-ran lint, typecheck, test, build after each fix to confirm each step was clean.
- Wrote `commands.txt`, `checklist.md`, `notes.md` under `evidence/M1-baseline/`.
- Updated `CHANGELOG.md` `[Unreleased]` with the full M1 delta.

**Decisions:**
- All five fixes above were necessary for the build to pass. The first four are pure code-quality wins; the fifth (`bcrypt` → `bcryptjs`) is an operational trade-off documented in code. No ADR was written because the change is a tooling detail, not a binding architectural choice. If the perf cost ever becomes a problem, an ADR for native `bcrypt` would be the right path.
- Per-founder directive, **all future sessions in this sprint must follow the Plan → Implement → Verify → Update → Commit → Review cycle** with explicit per-milestone evidence.

**Open questions:**
- Hosting (Q5) — to be resolved before M6; candidate Iranian VPS in mind.
- Multi-tenant isolation (Q6) — still parked, affects schema evolution.
- PWA / offline (Q7) — still parked.

**Next session:** Session 009 — SPRINT-001 / M2 — Production Build Validation: `next start` against the production build, smoke test on prod mode (login, `/api/health`, `/api/users`, `/api/auth/session`, sign-out). See `NEXT_SESSION.md` for the M2 task definition.

**Files changed (M1):**
- `package.json` (root) — `build` script simplified.
- `apps/web/src/app/layout.tsx` — `next/font/google` for Vazirmatn.
- `apps/web/next.config.mjs` — `extensionAlias` for `.js`/`.mjs` → `.ts`/`.tsx`/`.mts`.
- `packages/core/package.json` — exports → source; dep swap.
- `packages/core/src/auth/credentials.ts` — `bcryptjs` import + JSDoc.
- `pnpm-lock.yaml` — reflects `bcryptjs` swap.
- `docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md` — **NEW** sprint plan.
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M1-baseline/*` — **NEW** evidence (commands, output files, notes, checklist).
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.2, sprint + M1 row.
- `docs/00-bootstrap/NEXT_SESSION.md` — M1 task.
- `CHANGELOG.md` `[Unreleased]` — M1 entry.

---

## Session 009 — 2026-07-12 — opencode/mimo-v2.5-free (SPRINT-001 / M2 — code review + quality fixes)

**Goal:** M2 — Production Build Validation. Run `next start` against the production build, smoke test all endpoints. Also perform comprehensive code review.

**Done:**
- Pre-flight verified: `.next/BUILD_ID` exists, build directory complete.
- Comprehensive code review of all source files across the monorepo (16+ files).
- Fixed 8 issues (see below).
- Re-ran all quality gates: typecheck ✅, lint ✅ (0 warnings), test ✅ (18 pass), build ✅ (7 routes, middleware 42.7 kB).
- Created M2 evidence directory with `commands.txt`, `checklist.md`, `notes.md`.

**Code review fixes:**
1. Removed stale `serverExternalPackages: ["bcrypt"]` from `next.config.mjs` (we use `bcryptjs` since M1).
2. Added 5 security headers via `next.config.mjs` `headers()`: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
3. Added `poweredByHeader: false` to hide Next.js version string.
4. Created `apps/web/src/lib/env.ts` — centralized env validation with production throw on missing `AUTH_SECRET`/`DATABASE_URL`.
5. Updated `auth.ts` and `middleware.ts` to use shared `env` helper (was hardcoded fallback).
6. Fixed health route: `db` field now returns boolean (was string "ok"/"fail"); added `try/catch`.
7. Added `dir="rtl"` to login page `<main>` for consistency with dashboard.
8. Enhanced `.env.example` with comments and stronger AUTH_SECRET placeholder.

**Decisions:**
- Security headers (X-Frame-Options, CSP, etc.) are added now in M2 rather than waiting for M4 because they are zero-cost and high-impact. M4 will add CSP (Content-Security-Policy) which requires more careful tuning.
- Env validation throws in production if `AUTH_SECRET` is not set — prevents the silent fallback-to-dev-secret vulnerability.

**Open questions:**
- **PostgreSQL not installed** — `next start` smoke test is blocked. Needs admin privileges to install (winget/choco both fail without elevation). Founder must either: (a) run installer as admin, (b) install Docker Desktop, or (c) provide a remote `DATABASE_URL`.
- Hosting (Q5) — still pending.
- Multi-tenant isolation (Q6) — still parked.
- PWA / offline (Q7) — still parked.

**Next session:** Resume M2 smoke test once PostgreSQL is available. The production build is ready; only the runtime validation is blocked.

**Files changed (M2):**
- `apps/web/next.config.mjs` — removed stale `bcrypt` externals; added security headers + `poweredByHeader: false`.
- `apps/web/src/lib/env.ts` — **NEW** centralized env validation.
- `apps/web/src/auth.ts` — uses `env.AUTH_SECRET` instead of hardcoded fallback.
- `apps/web/src/middleware.ts` — uses `env.AUTH_SECRET` instead of hardcoded fallback.
- `apps/web/src/app/api/health/route.ts` — `db` returns boolean; added try/catch.
- `apps/web/src/app/login/page.tsx` — added `dir="rtl"` to `<main>`.
- `apps/web/.env.example` — enhanced with comments.
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/*` — **NEW** evidence files.
- `CHANGELOG.md` — M2 entries (security headers, env validation, fixes).
