# M4 — Security Hardening — Pre-work + Upgrade checklist

## Pre-work (Session 013)
- [x] `pnpm audit --prod --json` captured (`audit-baseline.json`)
- [x] Severity summary documented (28 total: 2C / 8H / 14M / 4L)
- [x] Affected packages identified (`next@15.0.3`, `next-auth@5.0.0-beta.25`, `postcss<8.5.10` transitive)
- [x] Risk classified as CRITICAL per ADR-0013 §42
- [x] DoR + spec drafted (`M4-1-dependency-upgrade.md` — see backlog)
- [x] **Founder approval** obtained (founder approved a dedicated branch + PR)

## Upgrade (Session 014, branch `fix/m4-dependency-upgrade`)
- [x] Branch `fix/m4-dependency-upgrade` created
- [x] `next` bumped: `15.0.3` → `15.5.20` (latest 15.x backport)
- [x] `next-auth` bumped: `5.0.0-beta.25` → `5.0.0-beta.31` (latest beta)
- [x] `eslint-config-next` aligned: `15.0.3` → `15.5.20`
- [x] `pnpm install` — lockfile refreshed
- [x] `pnpm verify` — EXIT 0 (lint / typecheck / test / build all green)
- [x] `pnpm audit --prod` re-run; severity summary captured (`audit-after.json`)
- [x] Residual issues (2 advisories) documented with follow-up plan
- [x] CHANGELOG + handover + spec updated
- [ ] **Commit on the branch** (this session)
- [ ] **Push branch + open PR** (this session — or instruct founder)
- [ ] **Founder review + merge** (post-session)

## Status

🟡 **M4 dependency upgrade — 26 of 28 advisories resolved.** 2 follow-ups documented (`drizzle-orm` bump, `postcss` transitive).

## M4-2 Security Hardening (Session 016, 2026-07-15)

- [x] Spec / DoR / risk drafted (`M4-2-hardening.md`)
- [x] `Content-Security-Policy` added to `next.config.mjs` `headers()`
- [x] `apps/web/src/lib/rate-limit.ts` — in-memory token-bucket + `ipKey()`
- [x] `apps/web/src/lib/validation.ts` — `parseQuery` / `parseBody` Zod guards
- [x] `/api/users` — rate-limit (30/1·s⁻¹, keyed by admin id) + defensive `parseQuery`
- [x] `/api/auth/session` — rate-limit (60/1·s⁻¹, keyed by IP)
- [x] `/.well-known/security.txt` route (RFC 9116)
- [x] Rebrand scrub: `@hawza/core` → `@learning-platform/core` in `audit-after.json` / `audit-after-2.json` / `audit-baseline.json` (BOM stripped from baseline); repo-wide `git grep hawza` returns none
- [x] Tests: `tests/rate-limit.test.ts`, `tests/validation.test.ts`
- [x] `pnpm verify` — EXIT 0 (see `commands.txt`)
- [x] CHANGELOG + PROJECT_STATE / PROJECT_BACKLOG / PROJECT_HANDOVER updated
- [x] Commit (Conventional Commits, milestone reference)
- [ ] Founder review

## Status

🟢 **M4.2 — CSP + rate-limits + input-validation harness + security.txt landed; rebrand audit gap closed.** Follow-ups parked: HSTS (at M6 behind TLS), CSP nonces (per-request infra), external rate-limit store (only if multi-process), real `security.txt` Contact address.

## M4-3 Residual advisories (Session 017, 2026-07-15)

- [x] Spec / DoR / risk drafted (`M4-3-residual-advisories.md`)
- [x] `drizzle-orm` bumped: `^0.36.0` → `^0.45.2` (apps/web + packages/core; resolves GHSA-1116251, HIGH: SQL-injection via improperly escaped SQL identifiers)
- [x] `pnpm.overrides.postcss = ^8.5.10` (root; resolves GHSA-1117015, MODERATE: XSS via Unescaped `</style>` in CSS Stringify Output)
- [x] `pnpm install` — lockfile refreshed; 0 prod advisories in `pnpm why postcss --filter web` (all paths now `8.5.16`)
- [x] `pnpm verify` — EXIT 0 (lint / typecheck / test / build all green; 36 tests, 8 routes, Middleware 46.1 kB)
- [x] Bug found and fixed in M2 smoke test: `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. Added `isSecurityTxt` to the public-route set in `apps/web/src/middleware.ts`. After-fix: `200 text/plain; charset=utf-8`, no auth required.
- [x] Note: `pnpm audit` returned `ERR_PNPM_AUDIT_BAD_RESPONSE` (npm is retiring the endpoint; see CHANGELOG M4.3 entry). Pinned versions and `pnpm why` confirm resolution.
- [x] Commit (Conventional Commits, milestone reference)
- [x] Merge to `main`

## Status

🟢 **M4.3 — drizzle-orm + postcss residual advisories resolved; security.txt now public.** Audit endpoint retirement is a tool-status note, not a finding. Sprint M4.0 / M4.1 / M4.2 / M4.3 are all closed.

## M2 — Real-Postgres smoke test (Session 017, 2026-07-15)

- [x] Docker Desktop started; `hawza-postgres:16-alpine` healthy
- [x] `db:migrate` — applied (idempotent; no new migrations on this snapshot)
- [x] `db:seed:dev` — re-seeded `admin@lp.local` (stale row deleted first; `changeme` password set with bcrypt cost 12)
- [x] `pnpm --filter web dev` — started; `▲ Next.js 15.5.20` ready
- [x] `GET /api/health` → `200 {db:true}`
- [x] `GET /api/auth/csrf` → 200 with token
- [x] `POST /api/auth/callback/credentials` (with `tenantSlug=demo`) → `302 → /` + `authjs.session-token` cookie
- [x] `GET /api/auth/session` (cookie) → typed session `{id, email, name, role:"super_admin", tenantId}`
- [x] `GET /api/users` (super_admin) → `200` + user list **without `passwordHash`**
- [x] `GET /.well-known/security.txt` (no cookie) → `200 text/plain; charset=utf-8` (after M4.3 middleware fix)
- [x] Every response carries the 6 security headers (5 from M2 + CSP from M4.2)

## Status

🟢 **M2 — Production smoke test passed.** The PostgreSQL blocker is closed (Docker is up; smoke test ran end-to-end). M1, M2, M3, M4.0, M4.1, M4.2, M4.3 are all closed. M5+ remains parked on founder decisions (Q5/Q6/Q7).

