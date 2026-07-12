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
