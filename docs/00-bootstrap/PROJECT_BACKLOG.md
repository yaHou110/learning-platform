# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 016 |
| Date opened | 2026-07-15 |
| Driver | contributor |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **Repository consolidation: finalize M4.0 merge and reconcile project status docs with reality.** |
| Status | 🟢 **M4.0 merged on `main`. Project status docs updated. M2 smoke test + M4.2 + residual advisories remain.** |

---

## Context

Sessions 013–014 documented and merged the dependency-upgrade finding (28 → 2 advisories, M4.1). On 2026-07-13, the founder handed the project a manual security review cross-referenced with an an external model-assisted review. The single P0 finding to address: `GET /api/users` returned `passwordHash` to any logged-in user and had no role-based authorization. Secondary finding: ADR-0005 said "DB sessions" but the code uses JWT (the Auth.js Credentials provider only supports JWT).

**PostgreSQL / Docker status (verified 2026-07-13, 03:06 PT):** Docker Desktop is running; WSL2 distro `docker-desktop` is Running v2. The `docker compose up -d` step is unblocked; the M2 smoke test can run as soon as a `DATABASE_URL` is in `apps/web/.env`.

## What this session delivered

- `evidence/M4-security/M4-0-authz-data-leak.md` — full DoR/DoD/risk matrix/approval per ADR-0013.
- `evidence/M4-security/audit-after-2.json` — re-run `pnpm audit --prod --json`; same 2 residual advisories, no regressions.
- Code:
  - `packages/core/src/api/index.ts` — `listUsers` rewritten with explicit column projection; `getUserById` and `checkUserActive` added; `UserPublic` type added.
  - `apps/web/src/lib/authz.ts` (NEW) — `requireRole` helper.
  - `apps/web/src/app/api/users/route.ts` — gates the route on `requireRole(['center_admin', 'super_admin'])`.
  - `apps/web/src/auth.ts` — per-request `isActive` re-check in the `session` callback (closes the JWT deactivation gap).
  - `apps/web/vitest.config.ts` — `@/...` aliases added (workspace packages still resolve via pnpm symlinks).
- Tests:
  - `packages/core/tests/api-user-public-type.test.ts` (NEW) — type-level guarantee that `UserPublic` cannot have a `passwordHash` field.
  - `apps/web/tests/authz-require-role.test.ts` (NEW) — 6 cases pinning the helper's contract.
- ADR:
  - `docs/05-decisions/ADR-0005-auth.md` — Revision 1 appended (JWT-only with per-request `isActive` re-check).
- `CHANGELOG.md`, `PROJECT_STATE.md` (v1.7), `PROJECT_BACKLOG.md` (this file), `PROJECT_HANDOVER.md` (Session 015 entry) — updated.

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence: `../06-sprints/SPRINT-001-production-foundation/evidence/M{2,3,4}-*/`

## What to do next

**In priority order:**

1. **M2 smoke test (any time the founder asks):** Docker is ready. Set `AUTH_SECRET` + `DATABASE_URL` in `apps/web/.env`, then `docker compose up -d`, `pnpm --filter @learning-platform/core db:migrate`, `pnpm --filter @learning-platform/core db:seed:dev`, `pnpm --filter web dev`, and walk through login → `/api/users` (now 403 as student) → `/api/users` (now 200 as center_admin) → sign-out.
2. **M4.2 (next sprint work):** CSP header (no DB needed), rate-limit middleware (in-memory token bucket, no DB), input-validation Zod schemas on `/api/users` + `/api/auth/*`, `security.txt` at `/.well-known/security.txt`. No DB required; can run in parallel with M2.
3. **Follow-up for residual advisories:** `drizzle-orm<0.45.2` (HIGH) + transitive `postcss<8.5.10` (MOD). Separate change when the founder is ready.
4. **M5–M7 + Q5/Q6/Q7 (founder decisions):** hosting, multi-tenant model, PWA, deployment/CI-CD. Feature work (Catalog, Learning, Credentials, Localization) stays suspended until M7 sign-off.

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

## Out of scope until further notice

- M2 smoke test — Docker is ready; founder can ask any time.
- M5+ work — M4 must complete first.
- New features (Catalog, Learning, etc.) — sprint hard gate still binding.
- Bumping `drizzle-orm` or `postcss` — separate change per founder directive.

## Operating notes

- The M4.0 set touches **3 packages** (`core`, `apps/web`, `docs`): one helper, one type, one route change, one callback addition, one ADR amendment.
- `pnpm verify` must pass before commit. Last run: 5/5 core + 8/8 web + 13/13 plugin = 26 tests pass, 7-route build OK, Middleware 46 kB.
- On Windows, PowerShell execution policy can block `pnpm` directly — use `cmd /c "pnpm ..."`.
- The `apps/web/.env` file does not exist yet — needed only for the M2 smoke test.
- M4.0 is a clean revert if needed: `git revert <commit>` + `pnpm install --frozen-lockfile` + redeploy. No migration, no data backfill.
