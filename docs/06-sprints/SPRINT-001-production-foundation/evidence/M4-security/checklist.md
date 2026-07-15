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
- [x] CHANGELOG + handoff + spec updated
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

