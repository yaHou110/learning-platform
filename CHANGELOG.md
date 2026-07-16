# Changelog

All notable changes to the **Learning Platform** repository will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention**: each repo-level version is the documentation version (Engineering Protocol),
> not the product version. Product versions are tracked in `docs/01-product/ROADMAP.md`.
>
> _Note: a file rename refactor was applied on 2026-07-12 (`NEXT_SESSION.md` → `PROJECT_BACKLOG.md`, `PROJECT_BOOTSTRAP.md` → `PROJECT_FOUNDATION.md`, `MASTER_HANDOFF.md` → `PROJECT_HANDOVER.md`). Historical entries below intentionally keep the old filenames — the changelog is append-only._

---

## [Unreleased]

### Added
- **Executable governance (CI-enforced):** `.github/workflows/governance.yml` runs `pnpm verify` + `pnpm governance:validate` on PRs and pushes to `main`.
- **`scripts/governance/validate.mjs`** — PR template validation (Risk, DoR, DoD, ADR, Rollback, Evidence), CHANGELOG requirement, ADR index integrity, ADR-0001 code scan.
- **`.github/pull_request_template.md`** — mandatory governance sections with CI markers.
- **GitHub Issue Templates:** `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`.
- **`docs/03-development/GOVERNANCE_CHECKLIST.md`** — session checklist (Phase A/B/C).
- **`DEVELOPMENT_GUIDE.md`** — single contributor entry point and router (under 100 lines).
- **`governance:validate`** — executable governance validator (`scripts/governance/validate.mjs`).
- **ADR-0013 — Engineering Protocol v2:** extends ADR-0012 with rules §39–§60; thematic chapter organization; Definition of Ready (§39); specification-first workflow (§40); human approval matrix (§41); risk classification (§42); ADR enforcement (§43); rule priority (§47); governance before generation (§59); verification before completion (§60).
- **`docs/03-development/RISK_CLASSIFICATION.md`** — LOW/MEDIUM/HIGH/CRITICAL matrix with review, approval, and rollback requirements.
- **`templates/DEFINITION_OF_READY.md`** — DoR checklist for §39.
- **`templates/HUMAN_APPROVAL_CHECKLIST.md`** — founder approval workflow for §41.
- **ADR-0012 — Mandatory Engineering Protocol:** binding process doc (`docs/03-development/ENGINEERING_PROTOCOL.md`) covering repository read order, milestone scope, quality gates, definition of done, planning-before-coding, security/rollback/evidence rules, and contributor constraints.
- **`docs/03-development/QUALITY_GATES.md`** — canonical lint/typecheck/test/build commands; CI alignment notes.
- **`pnpm verify`** root script — runs all four quality gates in sequence.
- **`scripts/quality-gates.ps1`** and **`scripts/quality-gates.sh`** — reproducible gate runners for Windows and Unix.
- **`docs/03-development/ENGINEERING_PROTOCOL.md`** — canonical always-available reference rule.
- **`templates/IMPLEMENTATION_PLAN.md`** and **`templates/DEFINITION_OF_DONE.md`** — planning and completion checklists.
- **SPRINT-001 — Production Foundation** plan with 7 milestones (M1..M7) and a hard gate: no new business features until M7 sign-off. Plan: `docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`.
- Per-milestone evidence directories under `docs/06-sprints/SPRINT-001-production-foundation/evidence/M{n}-*/`.
- **Security headers** via `next.config.mjs` `headers()`: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Centralized env validation** (`apps/web/src/lib/env.ts`): production throws on missing `AUTH_SECRET`/`DATABASE_URL`, development uses safe defaults with warnings.
- `poweredByHeader: false` in `next.config.mjs` to hide the Next.js version string.

### Fixed (during M1 — Baseline Verification)
- **`next/no-page-custom-font` warning in `apps/web/src/app/layout.tsx`** — Google Font (`Vazirmatn`) was loaded via raw `<link>` tags in App Router `<head>`. Converted to `next/font/google` so the font is inlined at build time and the warning is gone.
- **Root `pnpm build` script had a broken filter** — `pnpm -r --filter='./packages/*' build` matched no projects in pnpm 9. Simplified the root `build` to `pnpm --filter web build`; per-package builds remain available for ad-hoc use. `transpilePackages` in `next.config.mjs` already makes the workspace package source consumable by Next.js.
- **`@learning-platform/core` `exports` pointed to `dist/...js` while other packages pointed to source** — the only package that needed a build step before the Next.js build. Aligned core to source-export like the rest of the workspace (`./src/...ts`).
- **Webpack did not map `.js` → `.ts` for NodeNext-style imports** — `@learning-platform/core/src/api/index.ts` uses `from '../db/client.js'` (NodeNext convention). Added `resolve.extensionAlias` to `apps/web/next.config.mjs` so webpack resolves `.js` → `.ts`/`.tsx` first.
- **Native `bcrypt` is unbundlable in the Next.js server build** — `@learning-platform/core` used native `bcrypt` (C++ bindings) for password hashing, which webpack tried to bundle and choked on `node-pre-gyp`'s HTML files. Switched to pure-JS `bcryptjs` (already a dep of `apps/web`). Trade-off: ~250ms vs ~80ms per hash at cost 12, acceptable for login. Rationale documented in the JSDoc header of `credentials.ts`.

### Fixed (during M2 — code review)
- **Stale `serverExternalPackages: ["bcrypt"]`** — removed from `next.config.mjs`; we use `bcryptjs` (pure JS) since M1.
- **Health route `db` field returned string** — changed to return boolean (`true`/`false`) for consistency with API contract. Added `try/catch` for graceful error handling.
- **Login page missing `dir="rtl"`** — added for consistency with dashboard page.
- **AUTH_SECRET silent fallback in production** — previously, if `AUTH_SECRET` was not set, the app would silently use a predictable dev secret. Now throws at startup in production.
- **`.env.example` lacked comments** — added descriptions, security notes, and `openssl rand -base64 32` generation command.

### Changed
- `package.json` — `governance:validate`, `governance:validate:local` scripts.
- `DEVELOPMENT_GUIDE.md` — rule #9 (GOVERNANCE_CHECKLIST); CI reference.
- `docs/03-development/QUALITY_GATES.md` — documents `governance.yml` pipeline.
- `docs/03-development/ENGINEERING_PROTOCOL.md` — reorganized into 13 thematic chapters; v2.0 with 60 rules (§1–§38 preserved, §39–§60 added).
- `docs/03-development/ENGINEERING_PROTOCOL.md` — v2 enforcement (DoR, spec-first, governance before generation, rule priority).
- `templates/DEFINITION_OF_DONE.md`, `templates/IMPLEMENTATION_PLAN.md` — aligned with §39, §55, §60.
- `DEVELOPMENT_GUIDE.md` — onboarding table includes `ENGINEERING_PROTOCOL.md`; hard rule #8 and `pnpm verify` in build section.
- `docs/05-decisions/DECISIONS.md` — ADR-0012 indexed.
- `apps/web/src/app/layout.tsx` — uses `next/font/google` for Vazirmatn; `<html>` and `<body>` apply the font class.
- `apps/web/next.config.mjs` — added `resolve.extensionAlias` for `.js`/`.mjs` → `.ts`/`.tsx`/`.mts`.
- `package.json` (root) — `build` script simplified to `pnpm --filter web build`.
- `packages/core/package.json` — exports now point to source (`./src/...ts`); dep `bcrypt` → `bcryptjs`, devDep `@types/bcrypt` → `@types/bcryptjs`.
- `packages/core/src/auth/credentials.ts` — uses `bcryptjs`; JSDoc explains the rationale.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.2, Sprint 001 in progress, M1 next.
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to Session 008, M1 task.
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 008 entry.
- `docs/03-development/TECH_STACK.md` — to be updated at M3/M4 (CI, security, observability) — deferred per M1 scope.

### Verified
- `pnpm install` (with lockfile) — exit 0
- `pnpm -r lint` — exit 0, **zero warnings**
- `pnpm -r typecheck` — exit 0
- `pnpm -r test` — exit 0, 18 tests pass across 6 packages (core 3, plugin-auth 3, plugin-catalog 2, plugin-credentials 3, plugin-learning 2, plugin-localization 3, apps/web 2)
- `pnpm build` — exit 0, 7 routes compiled (1 page, 5 API routes, 1 login page), middleware 42.7 kB, first-load JS shared 99.9 kB

### Security
- Added 5 security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `poweredByHeader: false` hides the Next.js version string.
- Centralized env validation: `AUTH_SECRET` and `DATABASE_URL` are required in production; throws at startup if missing.

### Gate (binding)
🚫 No new business features are merged until M7 (Production Readiness Review) is signed off. This includes Catalog API/UI, Dashboard real UI, Learning plugin, Credentials plugin, Event Bus, PWA.

### Security audit (M4 pre-work, 2026-07-12)
- **🔴 28 known vulnerabilities** in production dependencies (see `evidence/M4-security/audit-baseline.json`): 2 critical, 8 high, 14 moderate, 4 low. All in `next@15.0.3` and `next-auth@5.0.0-beta.25`; transitive `postcss@8.4.31` (via `next`).
- **Mitigation spec drafted:** `evidence/M4-security/M4-1-dependency-upgrade.md` — bump `next` to `15.5.16+`, `next-auth` to `5.0.0-beta.30+`. **Risk: CRITICAL → HIGH after fix. Founder approval required per ADR-0013 §41.**
- **M3 evidence gap closed:** `evidence/M3-ci/{notes.md,checklist.md,commands.txt}` (governance CI workflow, validator script, PR + issue templates, contributor file sync).

### Security (M4.1 dependency upgrade, 2026-07-12)
- **Bumped `next`: `15.0.3` → `15.5.20`** (latest 15.x backport; resolves 24 advisories: 1C/7H/13M/3L).
- **Bumped `next-auth`: `5.0.0-beta.25` → `5.0.0-beta.31`** (latest beta; resolves Email misdelivery advisory).
- **Aligned `eslint-config-next` with `next` version.**
- **Audit delta: 28 → 2 advisories (93 % reduction).** 0 critical, 1 high (`drizzle-orm<0.45.2`), 1 moderate (`postcss<8.5.10` transitive via `next@15.5.20`).
- `pnpm verify` clean on the upgrade branch (`fix/m4-dependency-upgrade`): lint ✓, typecheck ✓, test ✓ (18/18), build ✓ (7 routes, Middleware 46 kB, First Load JS 102 kB).
- **Residual follow-ups** (deliberately excluded from this PR per founder directive "no mixed changes"):
  - Bump `drizzle-orm` to `>=0.45.2` — needs schema regression check.
  - Track Next.js internal `postcss` for a 15.5.21+ bump (or add `pnpm.overrides`).

### Security (M4.0 P0 — authorization gap + password-hash leak, 2026-07-13)
- **🔴 Closed `GET /api/users` password-hash leak.** The Drizzle query was a bare `select().from(users)` that returned every column, including `passwordHash`, to any caller with a session. A `student` or `teacher` could have dumped every bcrypt hash in their tenant and started offline cracking. **Now: explicit column projection in `identity.listUsers` and `identity.getUserById`; `passwordHash` is not selected and not in the `UserPublic` return type.** Defense in depth at three layers (SQL, types, JSON).
- **🔴 Added role-based authorization on `/api/users`.** New helper `requireRole(['center_admin', 'super_admin'])` in `apps/web/src/lib/authz.ts`. `student`/`teacher` → 403; no session → 401. The `requireRole` helper is the single chokepoint for all future authenticated routes; new routes get authorization by going through it.
- **ADR-0005 (auth) — Revision 1:** ADR said "DB sessions via `@auth/drizzle-adapter`"; implementation uses `session: { strategy: "jwt" }` because the Auth.js Credentials provider only supports JWT (verified against Auth.js v5 docs). The ADR is amended in-place: sessions are JWT-signed; "instant revocation" is delivered by a per-request `isActive` re-check in the Auth.js `session` callback (one indexed primary-key lookup per authenticated request, sub-ms).
- **New tests:**
  - `packages/core/tests/api-user-public-type.test.ts` — type-level guarantee that `UserPublic` cannot have a `passwordHash` field (compile-time failure if anyone adds one).
  - `apps/web/tests/authz-require-role.test.ts` — 6 cases (no session, session without user, role not in allowlist, center_admin, super_admin, teacher explicitly denied).
- **Spec + DoR + DoD + risk matrix:** `evidence/M4-security/M4-0-authz-data-leak.md`.
- **Re-run audit:** `evidence/M4-security/audit-after-2.json` — no new advisories; same 2 residual (`drizzle-orm` + transitive `postcss`) from M4.1.
- **`pnpm verify` on the M4.0 branch:** lint ✓, typecheck ✓, test ✓ (5/5 core + 8/8 web + 13/13 plugins = 26 tests), build ✓ (7 routes, Middleware 46 kB, First Load JS 102 kB).

### Changed (M4.0)
- `packages/core/src/api/index.ts` — `listUsers` rewritten with explicit column projection; new `getUserById` and `checkUserActive` methods; new `UserPublic` type.
- `apps/web/src/lib/authz.ts` — **NEW** `requireRole` helper.
- `apps/web/src/app/api/users/route.ts` — gates the route on `requireRole(['center_admin', 'super_admin'])`.
- `apps/web/src/auth.ts` — `session` callback now does a per-request `identity.checkUserActive` lookup and returns an empty user on miss/inactive.
- `apps/web/vitest.config.ts` — added aliases for `@/auth`, `@/lib/env`, `@/lib/authz`, `@/lib/plugins` (workspace packages still resolve via pnpm symlinks + their own `exports` field).
- `docs/05-decisions/ADR-0005-auth.md` — appended Revision 1 explaining the JWT constraint and the per-request `isActive` pattern.

### Security (M4.2 — hardening: CSP + rate-limits + input validation + security.txt, 2026-07-15)
- **Content-Security-Policy** added to `apps/web/next.config.mjs` `headers()`. Strict v1 static policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`. `'unsafe-inline'` on styles is required by Next + Tailwind inline style attrs in v1; per-request nonces parked. HSTS deliberately **not** set yet (valid only over TLS; enable at M6 behind the reverse proxy).
- **Rate limiting (in-memory token-bucket):** new `apps/web/src/lib/rate-limit.ts` (`rateLimit()` + `ipKey()`). Placed in **Node route handlers**, not middleware — Next.js middleware runs on the Edge runtime (no durable per-instance state / timers), so a bucket there is unreliable; Node handlers keep it dependency-free (OSS-first, single VPS ≤ 4 GB). `/api/users` limited per admin (30 burst / 1·s⁻¹); `/api/auth/session` per IP (60 burst / 1·s⁻¹).
- **Input-validation harness:** new `apps/web/src/lib/validation.ts` (`parseQuery` / `parseBody`) returning the same `{ ok, data } | { ok, response }` discriminated-union shape as `requireRole`. `/api/users` validates its query string defensively (`UsersQuerySchema`, strict-empty for now) so future pagination params reach the DB only after validation.
- **`/.well-known/security.txt`** (RFC 9116) served via a new route handler `apps/web/src/app/.well-known/security.txt/route.ts` with `Content-Type: text/plain; charset=utf-8`. `Contact` is a placeholder pending a real address from the founder.
- **Rebrand audit scrub:** `@hawza/core` → `@learning-platform/core` in `evidence/M4-security/audit-after.json`, `audit-after-2.json`, `audit-baseline.json` (dependency paths); stripped a stale UTF-8 BOM from `audit-baseline.json`. `git grep hawza` now returns nothing across tracked files.
- **New tests:** `apps/web/tests/rate-limit.test.ts` (4 cases: capacity/429 shape, refill, per-key isolation, invalid config) and `apps/web/tests/validation.test.ts` (6 cases: query happy/reject/strict, body happy/reject/malformed-JSON).
- **Evidence:** `evidence/M4-security/M4-2-hardening.md` (DoR / spec / risk MEDIUM / rollback per ADR-0013) + updated `evidence/M4-security/checklist.md` and `commands.txt`.
- `pnpm verify` on this work: lint ✓, typecheck ✓, test ✓ (5/5 core + 18/18 web + 13/13 plugins = 36 tests), build ✓.
- **Follow-ups parked:** HSTS (at M6 behind TLS), CSP nonces (per-request infra), external rate-limit store (only if multi-process), real `security.txt` Contact address.

### Changed (M4.2)
- `apps/web/next.config.mjs` — added `Content-Security-Policy` to the `headers()` array.
- `apps/web/src/app/api/users/route.ts` — accepts `NextRequest`; adds per-admin `rateLimit` + defensive `parseQuery`.
- `apps/web/src/app/api/auth/session/route.ts` — accepts `NextRequest`; adds per-IP `rateLimit`.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.9, M4.2 complete.
- `docs/00-bootstrap/PROJECT_BACKLOG.md` — Session 017 entry.
- `docs/00-bootstrap/PROJECT_HANDOVER.md` — Session 016 entry (M4.2 handoff).

### Added (M4.2)
- `apps/web/src/lib/rate-limit.ts` — in-memory token-bucket limiter + `ipKey()`.
- `apps/web/src/lib/validation.ts` — `parseQuery` / `parseBody` Zod guards.
- `apps/web/src/app/.well-known/security.txt/route.ts` — RFC 9116 security contact.
- `apps/web/tests/rate-limit.test.ts`, `apps/web/tests/validation.test.ts`.
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-2-hardening.md` — DoR/spec/risk/rollback.

### Security (M4.3 — residual advisories: drizzle-orm SQL-injection + postcss XSS, 2026-07-15)
- **Bumped `drizzle-orm` to `^0.45.2`** in `apps/web` and `packages/core` (resolves GHSA-1116251, HIGH: "SQL injection via improperly escaped SQL identifiers"). Lockfile regenerated. The API surface used by this repo (`select/from/where/and/eq`, `insert/values/returning`, `update/set/where`, `pgTable/check/sql/inferSelect`) is stable across 0.36 → 0.45+; **all 36 tests pass** unchanged.
- **Forced `postcss >= 8.5.10` via root `pnpm.overrides`** (resolves GHSA-1117015, MODERATE: "XSS via Unescaped `</style>` in CSS Stringify Output"). The transitive `next@15.5.20 > postcss@8.4.31` is now resolved to `8.5.16` everywhere; `pnpm why postcss --filter web` confirms 8.5.16 in all paths (next, next-auth→next, autoprefixer peer, vitest→vite, tailwind). Build is clean.
- **Bug fix found by M2 smoke test:** `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. Added `isSecurityTxt` exception alongside the existing `isApiAuthPage` and `isHealthPage` checks in `apps/web/src/middleware.ts`. After-fix: `GET /.well-known/security.txt` → `200` with `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`, no auth required. RFC 9116 §2 compliant.
- **Residual advisory count after M4.3:** **0 prod-tree advisories** (was 2 after M4.1; both patched). npm's `pnpm audit` endpoint returned `410 ERR_PNPM_AUDIT_BAD_RESPONSE` during this session (the endpoint is being retired by npm); the version pins above are pinned to the patched ranges and `pnpm why` confirms the resolved versions. Re-capture of the JSON audit is blocked by the endpoint retirement; documented as a tool-status note, not a finding.
- **Risk:** MEDIUM per ADR-0013 §42 (drizzle-orm touches every query path; middleware is route-critical). Founder approval: not required (MEDIUM); auto-proceeded per founder directive 2026-07-15.
- **Evidence:** `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-3-residual-advisories.md` (DoR / spec / risk / rollback).
- `pnpm verify` on this work: lint ✓, typecheck ✓, test ✓ (5/5 core + 18/18 web + 13/13 plugins = 36 tests), build ✓ (8 routes, Middleware 46.1 kB, First Load JS 102 kB).

### Changed (M4.3)
- `apps/web/package.json` — `"drizzle-orm": "^0.36.0"` → `"^0.45.2"`.
- `packages/core/package.json` — same pin bump.
- `package.json` (root) — added `pnpm.overrides."postcss": "^8.5.10"`.
- `apps/web/src/middleware.ts` — added `isSecurityTxt` exception so `/.well-known/security.txt` is publicly accessible.
- `pnpm-lock.yaml` — regenerated.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.10, M4.3 + M2 smoke test complete.
- `docs/00-bootstrap/PROJECT_BACKLOG.md` — Session 017 closed; Session 018 task.
- `docs/00-bootstrap/PROJECT_HANDOVER.md` — Session 017 entry appended.

### Added (M4.3)
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-3-residual-advisories.md` — DoR/spec/risk/rollback.

### M2 — Production smoke test (real Postgres, 2026-07-15)
- The M2 smoke test was parked since session 009 because PostgreSQL was not installed on the dev machine. This session: Docker Desktop was started; the existing `hawza-postgres:16-alpine` container was healthy; ran `pnpm --filter @learning-platform/core db:migrate` (idempotent — applied) + `db:seed:dev` (created `demo` tenant + `admin@lp.local` / `changeme` super_admin). Started `pnpm --filter web dev`; ran the full auth + authorization + security-headers + security.txt flow.
- **Verified end-to-end:** `GET /api/health` → `200 {db:true}`; `GET /api/auth/csrf` → 200 with token; `POST /api/auth/callback/credentials` with `tenantSlug=demo&email=admin@lp.local&password=changeme` → `302 → /` with `authjs.session-token` cookie; `GET /api/auth/session` → typed session; `GET /api/users` (as super_admin) → `200 [{id,email,role,isActive,…}]` **without `passwordHash`**; `GET /.well-known/security.txt` → `200 text/plain` (after middleware fix).
- **All security headers present in every response:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and the **new** `Content-Security-Policy` from M4.2.
- **Known minor issue (not a blocker):** the dev server crashed when `next build` overwrote `.next/` mid-flight. Not a code bug — re-running `pnpm --filter web dev` after a `pnpm verify` build is the expected sequence.
- **Evidence:** `docs/06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/M2-smoke-test.md` (DoR/run/results).

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
- **Plugin Vitest configs** — all 5 plugins lacked resolve aliases for `@learning-platform/core` and `@learning-platform/contracts`, causing "Failed to load url" in tests.

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
- **Engineering Protocol v1.0** — documentation system is live.
- Repository skeleton: `README.md`, `DEVELOPMENT_GUIDE.md`, `LICENSE`, `CHANGELOG.md`.
- `docs/00-bootstrap/` — `PROJECT_BOOTSTRAP.md`, `MASTER_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_SESSION.md`.
- `docs/01-product/` — `PRODUCT_BIBLE.md`, `REQUIREMENTS.md`, `FEATURE_CATALOG.md`, `PERSONAS.md`, `ROADMAP.md`.
- `docs/02-architecture/` — `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
- `docs/03-development/` — `TECH_STACK.md` (skeleton).
- `docs/05-decisions/` — `DECISIONS.md`, `ADR-0001-no-wordpress.md`, `ADR-0002-operating-manual.md`.
- `templates/` — `HANDOFF_TEMPLATE.md`, `SESSION_NOTES.md`, `ADR_TEMPLATE.md`, `FEATURE_REQUEST.md`.

### Changed
- Decision: this project will NOT use WordPress. Rationale in `ADR-0001`.
- Decision: documentation will be portable. Rationale in `ADR-0002`.

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
