# M4-1 — Dependency Upgrade (DoR + Spec + Risk)

> **Status:** ⏳ Awaiting founder approval (CRITICAL risk per ADR-0013 §42)
> **Author:** Session 013 (2026-07-12)
> **Blocker:** Cannot proceed without explicit founder go-ahead.

---

## 1. Definition of Ready (ADR-0013 §39)

| Item | Status |
|---|---|
| Goal is clear and singular | ✅ Eliminate 28 known vulnerabilities (2C/8H/14M/4L) in `next` and `next-auth` |
| Bounded scope | ✅ Two packages: `next` and `next-auth`. No schema changes, no architectural changes. |
| Spec exists | ✅ This file. |
| Risk classified | ✅ CRITICAL — see §3. |
| Founder approval path identified | ✅ Per ADR-0013 §41, HIGH/CRITICAL risk requires explicit go-ahead. |
| Test strategy | ✅ Re-run `pnpm verify` + `pnpm audit` after each bump. |
| Rollback plan | ✅ Revert the dependency bump commit. No schema migration. |
| Evidence requirement | ✅ `evidence/M4-security/audit-after.json` (zero high/critical). |

## 2. Specification

### 2.1 Version targets

| Package | From | To | Reason |
|---|---|---|---|
| `next` | `15.0.3` | `15.5.16` (or latest 15.x ≥ 15.5.16) | Resolves 24 advisories (most high/moderate/critical) |
| `next-auth` | `5.0.0-beta.25` | `5.0.0-beta.30` (or latest beta ≥ .30) | Resolves the Email misdelivery advisory |
| `postcss` (transitive) | `8.4.31` | resolved automatically by `next@15.5.16` | Resolves the CSS stringifier XSS |

### 2.2 Steps

1. Create branch `fix/m4-dependency-upgrade`.
2. Bump `next` to `15.5.16` in `apps/web/package.json` and any other package that pins it.
3. Bump `next-auth` to `5.0.0-beta.30` in `apps/web/package.json` and `packages/core/package.json`.
4. `pnpm install` (will refresh lockfile).
5. Run `pnpm verify` — fix any breaking changes.
6. Run `pnpm audit --prod` — expect 0 high, 0 critical.
7. Capture outputs to `evidence/M4-security/audit-after.json`.
8. Update `CHANGELOG.md` `[Unreleased]`.
9. Append Session entry to `PROJECT_HANDOVER.md`.
10. Open PR using the governance template (Risk: HIGH → CRITICAL bumped to HIGH after fix).
11. Wait for CI green + founder review.
12. Merge → M2 smoke test can resume (still needs PostgreSQL).

### 2.3 Breaking-change watch list (next 15.0 → 15.5)

- App Router cache invalidation changes (15.1+).
- Middleware `getToken` API tightened (15.3+).
- Image optimizer `remotePatterns` stricter (15.5+).
- Server Actions source map handling (15.0.6).
- CSP nonce pattern (15.5.16).

### 2.4 Out of scope

- Major version bumps (Next 16, NextAuth 6).
- Plugin code changes.
- Schema changes.
- New features.

## 3. Risk classification (ADR-0013 §42)

| Dimension | Rating | Rationale |
|---|---|---|
| Blast radius | HIGH | Framework bump affects every route. |
| Reversibility | HIGH | Single dep bump, no data migration. |
| Security impact (current) | CRITICAL | 2 critical + 8 high advisories. |
| Security impact (post-fix) | LOW | All known advisories resolved. |
| Performance impact | UNKNOWN | Need to re-measure build size / first-load JS. |
| Schedule pressure | MEDIUM | Blocks the M2 smoke test (PostgreSQL is a separate blocker, but this is a "do it now" item). |
| **Overall** | **CRITICAL** (because of pre-fix security exposure) | Founder approval mandatory. |

## 4. Rollback

- `git revert <commit>` + `pnpm install --frozen-lockfile` + redeploy.
- No database migration to revert.
- No feature flags involved.
- Worst case: temporarily downgraded dependencies; security advisories re-appear but service stays up.

## 5. Evidence

- `evidence/M4-security/audit-baseline.json` (this session) — 28 vulns.
- `evidence/M4-security/audit-after.json` (after merge) — expected 0 high/critical.
- `evidence/M4-security/build-after.txt` — expected next build output.
- `evidence/M4-security/notes.md` — observations.

## 6. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Founder | (you) | ⏳ pending | – |

**Until approved, no work on the upgrade is to be merged.**
