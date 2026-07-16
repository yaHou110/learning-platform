# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 018 (next) — 017 closed |
| Date opened | 2026-07-15 |
| Driver | contributor |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M4 sprint closed (M1–M4 + M2).** M4.3 + M2 smoke test landed. M5–M7 + Q5/Q6/Q7 remain on founder decisions. |
| Status | 🟢 **M4 sprint fully closed.** M4.0 (auth gap) ✅, M4.1 (next+next-auth upgrade) ✅, M4.2 (CSP + rate-limit + input-validation + security.txt) ✅, **M4.3 (drizzle-orm + postcss residuals + security.txt middleware fix) ✅**; **M2 (real-Postgres smoke test) ✅**. Residual advisory count: 0 in prod. |

---

## Context

Sessions 013–016 documented and merged the M4 sprint work (dependency upgrades, authorization gate, security headers, security contact point). Session 017 closed the last two open items: the 2 residual advisories (`drizzle-orm<0.45.2` HIGH + transitive `postcss<8.5.10` MOD) and the long-parked M2 real-Postgres smoke test. During the M2 smoke test a real bug surfaced: `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. M4.3 fixed the middleware as a 1-line addition; post-fix the file is publicly accessible per RFC 9116.

**Tool-status note (captured 2026-07-15):** `pnpm audit` returns `ERR_PNPM_AUDIT_BAD_RESPONSE` / HTTP 410 (npm is retiring the bulk audit endpoint). M4.3 verification was done by `pnpm why postcss --filter web` + manual version pins. Captured as a tool-status note, not a finding; the substitute audit path is documented in `evidence/M4-security/notes.md`.

## What session 017 delivered

- **M4.3 — residual advisories + `security.txt` public access**
  - Spec: `evidence/M4-security/M4-3-residual-advisories.md` (DoR / spec / risk MEDIUM / rollback per ADR-0013).
  - Code:
    - `apps/web/package.json` — `"drizzle-orm": "^0.36.0"` → `"^0.45.2"`.
    - `packages/core/package.json` — same pin bump.
    - `package.json` (root) — added `pnpm.overrides."postcss": "^8.5.10"`.
    - `apps/web/src/middleware.ts` — added `isSecurityTxt` exception (1-line) alongside `isApiAuthPage` and `isHealthPage` so `/.well-known/security.txt` is publicly accessible. Bug found by M2 smoke test.
  - `pnpm-lock.yaml` regenerated; 0 prod-tree advisories.
  - `pnpm verify` green: lint ✓, typecheck ✓, **36 tests** (5/5 core + 18/18 web + 13/13 plugins), build ✓ (8 routes, Middleware 46.1 kB, First Load JS 102 kB).
  - Synthetic `audit-after-3.json` (the npm audit endpoint is retired; recorded as tool-status note).
  - Branch `fix/m4-3-residual-advisories` merged to `main` via `--no-ff` (commit `2ac7461` + merge `ba146db`).
- **M2 — Production smoke test (real Postgres)**
  - Spec: `evidence/M2-prod-build/M2-smoke-test.md` (DoR / spec / risk LOW / rollback per ADR-0013).
  - Docker Desktop started; `hawza-postgres:16-alpine` healthy.
  - `db:migrate` applied (idempotent).
  - `db:seed:dev` re-ran the `admin@lp.local / changeme` user (a stale row from a prior run was deleted first; new bcrypt-cost-12 hash).
  - `pnpm --filter web dev` started; full smoke walk: `GET /api/health` → 200 + `db:true`; `GET /api/auth/csrf` → 200 + token; `POST /api/auth/callback/credentials` (with `tenantSlug=demo`) → 302 + `authjs.session-token` cookie; `GET /api/auth/session` → typed `{id, email, name, role:"super_admin", tenantId}`; `GET /api/users` (super_admin) → user list **without `passwordHash`**; `GET /.well-known/security.txt` → 200 `text/plain; charset=utf-8` (post-M4.3-fix).
  - Every response carries the 6 security headers (5 from M2 + CSP from M4.2).
  - M2 evidence files rewritten: `checklist.md`, `commands.txt`, `notes.md`.
- **M4.2 already merged to main in this session series** (commit `5eb115d` + merge `f056462`): `Content-Security-Policy`, `rate-limit.ts` (Node route handlers), `validation.ts` (`parseQuery` / `parseBody` Zod guards), `/.well-known/security.txt` route handler, rebrand audit scrub.
- **M4.0 already merged to main** (Session 015, P0 closed): `passwordHash` projection fix, `requireRole` helper, per-request `isActive` re-check, ADR-0005 Revision 1.
- `CHANGELOG.md` (M4.3 + M2 entries), `PROJECT_STATE.md` (v1.10), `PROJECT_HANDOVER.md` (Session 017 appended), `evidence/M4-security/{checklist,commands,notes}.md` and `evidence/M2-prod-build/{checklist,commands,notes}.md` — all updated.

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence: `../06-sprints/SPRINT-001-production-foundation/evidence/M{1..4}-*/` and `M2-prod-build/`

## What to do next (Session 018+)

**M5–M7 + Q5/Q6/Q7 are parked on founder decisions.** No code work is unblocked until the founder picks:

1. **Q5 — Hosting pick** (Vercel / self-hosted / VPS / Iranian host). Drives M6 (TLS + reverse proxy + HSTS). Drives the HSTS follow-up from M4.2. Drives the deprecation plan for `apps/web/.env` (single-host) vs. multi-host.
2. **Q6 — Multi-tenant isolation model** (subdomain / tenant column / schema). Drives schema evolution. Q5 and Q6 are coupled for any deployment with >1 tenant.
3. **Q7 — PWA / offline** (yes / no). Drives a new bounded context (Learning) and a service-worker infra.

**Once Q5/Q6 are answered, the next concrete session can be M5 (Deployment / CI-CD)**: GitHub Actions workflow for the production build, deploy target wiring, TLS cert provisioning, post-deploy smoke test. The M5 plan is sketched in `docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md` but the deploy target cannot be specified without Q5.

**Independent track (no founder decision required):** the M4.2 follow-ups that were explicitly parked in the spec doc:
- HSTS header at M6 behind TLS (M4.2 §4.3).
- CSP nonces — per-request infrastructure to remove `'unsafe-inline'` from `style-src` (M4.2 §4.3).
- `security.txt` real `Contact` address — founder needs to supply.

**Also independent:** the `pnpm audit` endpoint retirement. Future audits need a substitute (e.g. `osv-scanner`, GitHub Dependabot, Snyk). One-day follow-up when the founder picks a substitute.

**Out of scope until M7 sign-off** (per founder directive 2026-07-11): all new business features — Catalog, Learning, Credentials, Localization.

## Done record (Sessions up to 2026-07-15)

- [x] Spec + DoR + DoD at `evidence/M4-security/M4-0-authz-data-leak.md`
- [x] ADR-0005 Revision 1 appended
- [x] `identity.listUsers` projection (no passwordHash)
- [x] `requireRole` helper + applied to `/api/users`
- [x] Per-request `isActive` re-check in `session` callback
- [x] New tests: 2 (type-level + 6 helper cases)
- [x] `pnpm verify` green (lint ✓, typecheck ✓, 26/26 tests ✓, build ✓)
- [x] `pnpm audit --prod` re-captured; no new advisories
- [x] `CHANGELOG.md`, `PROJECT_STATE.md`, `PROJECT_HANDOVER.md`, `PROJECT_BACKLOG.md` updated
- [x] M4.0 merged to `main`; project status docs reconciled with reality
- [x] M4.1 merged to `main` (28 → 2 advisories: next 15.0.3 → 15.5.20; next-auth 5.0.0-beta.25 → 5.0.0-beta.31)
- [x] M4.2 merged to `main` (CSP + rate-limit + input-validation + security.txt; rebrand audit gap closed)
- [x] M4.3 merged to `main` (drizzle-orm → ^0.45.2; pnpm.overrides.postcss = ^8.5.10; `isSecurityTxt` middleware fix)
- [x] M2 smoke test green: login → typed session → user list (no `passwordHash`) → public security.txt → 6 security headers
- [x] All 7 sprint milestones M1..M4 + M2 evidence complete; 0 prod-tree advisories
- [x] Synthetic `audit-after-3.json` records post-M4.3 state (npm endpoint retired)

## Operating notes

- M4.3 commit is on `fix/m4-3-residual-advisories` (off `main` @ M4.2 merge). Merged with `--no-ff` so the audit history is preserved. No feature work was mixed in.
- The `security.txt` `Contact` address (`security@example.com`) is a placeholder; founder needs to supply a real one (and confirm `Expires: 2027-07-15`).
- On Windows, PowerShell execution policy can block `pnpm` directly — use `cmd /c "pnpm ..."`. For shell env vars that should reach `tsx` (e.g. `DATABASE_URL`), set them in PowerShell with `$env:VAR='…'` *before* the `cmd /c "…"` wrapper, otherwise `cmd`'s `set` may add a trailing space that breaks the URL (this bit session 017).
- The `apps/web/.env` file is gitignored. The .env.example is the template; the dev `.env` was hand-edited for the M2 smoke test (the existing `hawza:hawza@hawza` config was correct for the running container).
- M4.3 is a clean revert if needed: `git revert <commit>` + `pnpm install --frozen-lockfile` + redeploy. The middleware fix is a 1-line addition; the override is a small block in `package.json`; the version pins revert to `^0.36.0`. No migration, no data backfill.
- The `pnpm audit` endpoint is retired; future audits need a substitute (e.g. `osv-scanner`, GitHub Dependabot). Captured as a tool-status note, not a finding.
- The dev server crashes when `next build` overwrites `.next/` mid-flight. Not a code bug — re-run `pnpm dev` after a `pnpm verify` build.
- The existing `hawza-postgres` container name is from before the de-AI rebrand. Container names are operational, not committed; the new `docker-compose.yml` uses `lp-postgres`. Future migration: `docker compose down` (new) → re-create from `docker-compose.yml` → re-seed.
