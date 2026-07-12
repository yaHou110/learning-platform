# Changelog

All notable changes to the **Hawza Family Learning Platform** repository will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention**: each repo-level version is the documentation OS version (AI Project OS),
> not the product version. Product versions are tracked in `docs/01-product/ROADMAP.md`.

---

## [Unreleased]

### Added
- `apps/web/src/middleware.ts` — Edge-compatible route protection using `getToken` from `next-auth/jwt`
- `apps/web/src/app/api/users/route.ts` — GET endpoint listing users for the current tenant
- `apps/web/src/app/api/auth/session/route.ts` — GET endpoint returning typed session data

### Fixed
- Middleware: removed incorrect `"use server"` directive (middleware runs on Edge, not Node.js)
- Middleware: replaced `auth()` with Edge-compatible `getToken` from `next-auth/jwt`
- `api/users/route.ts`: removed unused `req` parameter (caused TypeScript and ESLint errors)
- `api/auth/session/route.ts`: removed unnecessary `"use server"` directive

### Changed
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to session 007
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 006 entry

---

## [1.1.0] — 2026-07-11

### Added
- **ADR-0003** — Web framework: **Next.js 15 (App Router) on Node.js 20 LTS**, TypeScript strict.
- **ADR-0004** — Database: **PostgreSQL 16 + Drizzle ORM**, no vector DB in v1, multi-tenant via `tenant_id` + RLS.
- **ADR-0005** — Auth: **Auth.js v5 Credentials provider, bcrypt (cost 12), server-side sessions in Postgres** via `@auth/drizzle-adapter`, httpOnly+secure session cookies.
- **ADR-0006** — Plugin architecture: **pnpm 9 workspaces monorepo**, internal compile-time modules with **typed Zod manifest**; plugins may not import `drizzle-orm` or `pg` (enforced by ESLint `no-restricted-imports`).
- `docs/03-development/TECH_STACK.md` — fully populated for the locked categories; open categories flagged as TBD with their proposed ADR numbers.
- `docs/05-decisions/DECISIONS.md` — ADR-0003..0006 moved from Proposed → Active; new ADRs proposed for the open categories (ADR-0007..0011).
- `pnpm` monorepo scaffold: `apps/web` (Next.js 15), `packages/core` (DB + auth + plugin registry), `packages/contracts` (shared types), `packages/plugins/{plugin-auth, plugin-catalog, plugin-learning, plugin-credentials, plugin-localization}`.
- `docker-compose.yml` — local Postgres 16 + Adminer for development.
- `package.json` (root) — pnpm workspace config, scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`).
- Base ESLint config with the plugin-DB-import restriction.
- Base TypeScript config (strict) shared by all packages.
- Vitest setup in every package.
- README files per package explaining its boundary and its "may not import" rules.

### Changed
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 004 entry.
- `docs/00-bootstrap/PROJECT_STATE.md` — Q1–Q4 marked ✅ Decided; Q5–Q7 still Pending.

---

## [1.2.0] — 2026-07-11

### Fixed
- **Migration SQL ordering** — `CREATE EXTENSION citext` moved before `CREATE TABLE users` (was crashing at runtime with `type "citext" does not exist`).
- **Connection leak** in `getTenantDb()` — replaced per-connection Drizzle wrapper with pooled `getDb()`. Previously every API call leaked a client from the pool (max 10, then exhausted).
- **Missing root layout** — created `apps/web/src/app/layout.tsx` with `<html lang="fa" dir="rtl">`. Required by Next.js 15 App Router.
- **Missing Tailwind CSS setup** — created `globals.css`, `tailwind.config.ts`, `postcss.config.mjs`. Login page uses Tailwind classes that were never configured.
- **Root `.eslintrc.json` JSON syntax error** — unquoted `argsIgnorePattern` key in rule config (caused `next lint` to crash with parser error).
- **Plugin Vitest configs** — all 5 plugins lacked resolve aliases for `@hawza/core` and `@hawza/contracts`, causing "Failed to load url" in tests.

### Changed
- `login/page.tsx` — simplified from split `LoginPage`/`LoginInner` pattern to single async component. Removed `void redirect` hack.
- `packages/core/src/db/client.ts` — removed `getTenantDb()`, added `withTenantDb()` callback wrapper (available but unused in v1). All queries go through pooled `getDb()`.
- `packages/core/src/api/index.ts` — uses `getDb()` instead of `getTenantDb()`.
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 005 entry.
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to Session 006.

### Security
- Session cookies are httpOnly + secure + sameSite=lax (Auth.js default with our config).
- Passwords are bcrypt-hashed at cost 12.
- PostgreSQL Row-Level Security is the second isolation layer on top of application-level `tenant_id` filtering.

---

## [1.0.0] — 2026-07-10

### Added
- **AI Project OS v1.0** — documentation system is live.
- Repository skeleton: `README.md`, `AGENTS.md`, `LICENSE`, `CHANGELOG.md`.
- `docs/00-bootstrap/` — `PROJECT_BOOTSTRAP.md`, `MASTER_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_SESSION.md`.
- `docs/01-product/` — `PRODUCT_BIBLE.md`, `REQUIREMENTS.md`, `FEATURE_CATALOG.md`, `PERSONAS.md`, `ROADMAP.md`.
- `docs/02-architecture/` — `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
- `docs/03-development/` — `TECH_STACK.md` (skeleton).
- `docs/05-decisions/` — `DECISIONS.md`, `ADR-0001-no-wordpress.md`, `ADR-0002-ai-project-os.md`.
- `templates/` — `HANDOFF_TEMPLATE.md`, `SESSION_NOTES.md`, `ADR_TEMPLATE.md`, `FEATURE_REQUEST.md`.

### Changed
- Decision: this project will NOT use WordPress. Rationale in `ADR-0001`.
- Decision: documentation will be AI-native, agent-portable. Rationale in `ADR-0002`.

### Not yet done (intentionally)
- No source code yet. v1.0 is documentation only.
- No deployment artifacts. See `docs/07-deployment/` (not yet created).
- No CI/CD. See `docs/03-development/GIT_STRATEGY.md` (not yet created).

---

## How to add a new entry

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
```

Append-only. Never edit historical entries.
