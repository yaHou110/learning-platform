# MASTER_HANDOFF.md

> **Append-only session log.** Every session ends by appending one entry here. Never edit old entries.
> This is the project's *long-term memory*. It is the second thing a new agent reads (after `PROJECT_STATE.md`).

---

## Format

Each entry has:

```markdown
## Session NNN — YYYY-MM-DD — <agent>

**Goal:** (one line)
**Done:** (bullet list, file paths)
**Decisions:** (ADR links, or "none")
**Open questions:** (or "none")
**Next session:** (link to NEXT_SESSION.md update, or "same")
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
