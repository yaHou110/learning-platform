# M4 — Security Hardening — Notes (consolidated)

> **Captured:** Sessions 013–017 (2026-07-12 → 2026-07-15)
> **Tool:** `pnpm audit --prod --json` (full JSON in `audit-baseline.json`, `audit-after.json`, `audit-after-2.json`)
> **Status of pnpm audit in this session series:** **npm has retired the bulk audit endpoint** (`ERR_PNPM_AUDIT_BAD_RESPONSE` / HTTP 410). M4.3 verification was done by version-pin + `pnpm why postcss --filter web` + repo-wide `pnpm why` instead. Captured as a tool-status note, not a finding.

## Before / after summary

| Severity | Pre-M4.1 (baseline) | Post-M4.1 | Post-M4.3 |
| --- | ---: | ---: | ---: |
| Critical | 2 | 0 | 0 |
| High | 8 | 1 | 0 |
| Moderate | 14 | 1 | 0 |
| Low | 4 | 0 | 0 |
| **Total** | **28** | **2** | **0** |

M4.1 dropped the count from 28 to 2 by upgrading `next` (15.0.3 → 15.5.20) and `next-auth` (5.0.0-beta.25 → 5.0.0-beta.31). M4.3 closed the remaining 2 (drizzle-orm SQL-injection + transitive postcss XSS) by pinning `drizzle-orm ^0.45.2` and adding a workspace `pnpm.overrides.postcss = ^8.5.10`.

## M4.0 — P0 authorization gap (closed on main)

While writing evidence for the M3 CI governance gate, a manual security review (cross-referenced with an external model-assisted review) found that `GET /api/users` returned `passwordHash` to any logged-in user, with no role-based authorization. ADR-0005 (auth) had a secondary contradiction: it said "DB sessions" but the code used JWT (Auth.js Credentials provider only supports JWT).

**Closed at three layers (defense in depth):**

1. **SQL projection** — `identity.listUsers` and `identity.getUserById` use `db.select({...})` with explicit column references. `passwordHash` is not selected.
2. **TypeScript** — new `UserPublic` type does not have a `passwordHash` field; a new type-level test (`api-user-public-type.test.ts`) makes any accidental future addition a compile-time failure.
3. **JSON serialization** — the route handler can only serialize what the type has.

**Authorization chokepoint:** new `requireRole(['center_admin', 'super_admin'])` helper in `apps/web/src/lib/authz.ts`. `student`/`teacher` → 403; no session → 401. The same pattern is now the v1 convention for every new authenticated route.

**ADR amendment:** `docs/05-decisions/ADR-0005-auth.md` Revision 1 explains the JWT constraint and the per-request `isActive` re-check that closes the JWT deactivation gap.

**Spec:** `evidence/M4-security/M4-0-authz-data-leak.md` (DoR / spec / risk / rollback per ADR-0013).

## M4.1 — Dependency upgrade (closed on main, 2026-07-12)

| Package | From | To | Patched range |
|---|---|---|---|
| `next` | `15.0.3` | **`15.5.20`** (latest 15.x backport) | `>=15.5.16` |
| `next-auth` | `5.0.0-beta.25` | **`5.0.0-beta.31`** | `>=5.0.0-beta.30` |
| `eslint-config-next` | `15.0.3` | **`15.5.20`** | (matches `next`) |

`pnpm-lock.yaml` regenerated; 506 lines changed. `pnpm verify` green. **26 of 28 advisories resolved.**

## M4.2 — Security hardening (closed on main, 2026-07-15)

Four secret-free items:

1. **Content-Security-Policy** in `next.config.mjs` `headers()`. Strict v1 static policy; `'unsafe-inline'` on styles required by Next + Tailwind; HSTS deliberately off until TLS.
2. **In-memory token-bucket rate-limit** in Node route handlers (Edge middleware has no durable per-instance state). `/api/users` 30/1·s⁻¹ per admin; `/api/auth/session` 60/1·s⁻¹ per IP.
3. **Zod input-validation harness** (`parseQuery` / `parseBody`) with the same `{ ok, data } | { ok, response }` discriminated-union shape as `requireRole`. Defensively used on `/api/users` against future pagination.
4. **`/.well-known/security.txt`** (RFC 9116). `Content-Type: text/plain; charset=utf-8`, `Cache-Control: no-store`. `Contact` is a placeholder pending the founder.

**Rebrand scrub:** `@hawza/core` → `@learning-platform/core` in all three audit JSONs; stripped a stale UTF-8 BOM from `audit-baseline.json`. Repo-wide `git grep hawza` returns nothing across tracked files.

**Spec:** `evidence/M4-security/M4-2-hardening.md` (DoR / spec / risk MEDIUM / rollback per ADR-0013).

## M4.3 — Residual advisories (closed on main, 2026-07-15)

Two advisories left after M4.1:

1. **`drizzle-orm<0.45.2` (HIGH)** — `apps/web` and `packages/core` bumped from `^0.36.0` to `^0.45.2`. The API surface used by this repo (`select/from/where/and/eq`, `insert/values/returning`, `update/set/where`, `pgTable/check/sql/inferSelect`) is stable across 0.36 → 0.45+; **all 36 tests pass unchanged**.
2. **`postcss<8.5.10` (MOD, transitive via `next@15.5.20`)** — `pnpm.overrides.postcss = ^8.5.10` at the workspace root. `pnpm why postcss --filter web` confirms 8.5.16 in all paths.

**Bug found by M2 smoke test (also fixed in M4.3):** `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. Added `isSecurityTxt` to the public-route set in `apps/web/src/middleware.ts`. After-fix: 200 OK, no auth, correct Content-Type, RFC 9116 §2 compliant.

**Tool-status note:** `pnpm audit --prod` now returns `ERR_PNPM_AUDIT_BAD_RESPONSE` (HTTP 410 — npm is retiring the audit endpoint). The version pins above resolve the two advisories; `pnpm why` is the substitute audit tool. Captured here, not as a finding.

**Spec:** `evidence/M4-security/M4-3-residual-advisories.md` (DoR / spec / risk MEDIUM / rollback per ADR-0013).

## Risk classification (ADR-0013 §42)

| Phase | Risk | Rationale |
|---|---|---|
| M4.0 | CRITICAL | Active exploit (any logged-in user could dump `passwordHash` for offline cracking). |
| M4.1 | HIGH | Framework upgrade touching every route; CRITICAL reason for the upgrade. |
| M4.2 | MEDIUM | Header / limiter / validation; no schema, no feature. |
| M4.3 | MEDIUM | drizzle-orm data layer; middleware route-critical. |

## Files

- `audit-baseline.json` — 28 advisories (pre-M4.1).
- `audit-after.json` — 2 advisories (post-M4.1, pre-M4.3).
- `audit-after-2.json` — same 2 (post-M4.0, no regression).
- `M4-0-authz-data-leak.md` — DoR / spec / risk / rollback for the P0.
- `M4-1-dependency-upgrade.md` — DoR / spec / risk for the framework upgrade.
- `M4-2-hardening.md` — DoR / spec / risk / rollback for CSP / rate-limit / validation / security.txt.
- `M4-3-residual-advisories.md` — DoR / spec / risk / rollback for drizzle-orm + postcss + middleware fix.
- `checklist.md` — M4.0 / M4.1 / M4.2 / M4.3 / M2 items.
- `commands.txt` — exact commands run.
- `../M2-prod-build/M2-smoke-test.md` — full M2 smoke walk against real Postgres.

## Status

🟢 **M4 security sprint — fully closed.** M4.0 P0 + M4.1 upgrade + M4.2 hardening + M4.3 residuals all merged to `main`. M2 (Production Build Validation) is also closed. **Residual advisory count: 0 in prod (npm endpoint retired; verified by `pnpm why`).** M5+ (hosting, multi-tenant model, PWA, deployment/CI-CD) is parked on founder decisions (Q5/Q6/Q7).
