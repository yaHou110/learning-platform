# PROJECT_STATE.md

> **Current snapshot of the project.** This is the *first* file to read after `DEVELOPMENT_GUIDE.md`.

> Last updated: 2026-07-15 (v1.10 — M4.3 complete: drizzle-orm + postcss residual advisories resolved; `/.well-known/security.txt` made public via middleware fix found in M2 smoke test; **M2 real-Postgres smoke test passed end-to-end**)

---

## One-line status

**Production Foundation Sprint — M4 sprint fully closed (M1 ✅, M2 ✅, M3 ✅, M4.0 ✅, M4.1 ✅, M4.2 ✅, M4.3 ✅).** M4.3 closed the 2 residual advisories (drizzle-orm SQL-injection + transitive postcss XSS) and the `/.well-known/security.txt` middleware bug found in the M2 smoke test. The M2 real-Postgres smoke test passed end-to-end (login → typed session → super_admin user list **without `passwordHash`** → public security.txt → 6 security headers on every response). **Residual advisory count: 0 in prod** (npm audit endpoint retired; verified by `pnpm why`). Feature development remains suspended until M7 sign-off; M5+ (hosting, multi-tenant model, PWA, deployment/CI-CD) is parked on founder decisions.

---

## Phase

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Research & architecture | ✅ done | portable docs decision made. |
| 1. Repository skeleton | ✅ done | This file, `DEVELOPMENT_GUIDE.md`, README, etc. |
| 2. Product documentation | ✅ done (skeleton) | Bible, requirements, features, personas, roadmap. |
| 3. Architecture documentation | ✅ done (skeleton) | System arch, data model, plugin & permission matrices. |
| 3b. Foundation docs | ✅ done | `MVP_SCOPE`, `BOUNDED_CONTEXTS`, `PROJECT_PRINCIPLES`, `ARCHITECTURE_CONSTRAINTS`. |
| 4. Development conventions | ✅ done (v1.3) | `ENGINEERING_PROTOCOL.md` v2 (60 rules), `RISK_CLASSIFICATION.md`, ADR-0012/0013. |
| 5. Source code (Identity & Access) | ✅ done | Migration + Auth.js + middleware + 2 API routes (sessions 005–007). |
| 5.5. Source code (other features) | ⏸️ paused | Catalog / Learning / Credentials / Localization / Dashboard — parked pending M7. |
| 6. **Production Foundation Sprint** | ✅ M1–M4 closed | M1 ✅, **M2 ✅ (real-Postgres smoke test passed 2026-07-15; this session series)**, M3 ✅, M4.0 ✅ (merged on main), M4.1 ✅, M4.2 ✅, **M4.3 ✅ (drizzle-orm + postcss residual advisories resolved; security.txt public via middleware fix)**. M5–M7 + Q5/Q6/Q7 (hosting, multi-tenant model, PWA, deployment/CI-CD) are parked on founder decisions. |
| 7. Deployment & CI/CD | ❌ not started | Blocked on sprint M3/M6. |

---

## What's locked (do not change without an ADR)

| Decision | File | Status |
| --- | --- | --- |
| No WordPress, ever | `ADR-0001` | ✅ binding |
| portable docs | `ADR-0002` | ✅ binding |
| Repo root language for code/IDs: English | `DEVELOPMENT_GUIDE.md` | ✅ binding |
| Repo narrative language for product: Farsi (Persian) | `DEVELOPMENT_GUIDE.md` | ✅ binding |
| Single-product repo (LPC + deployment in one repo) | `PRODUCT_BIBLE.md` | ✅ binding |
| Append-only history (CHANGELOG, handoffs, ADRs) | `DEVELOPMENT_GUIDE.md` | ✅ binding |
| Next.js 15 (App Router) + Node 20 LTS + TS strict | `ADR-0003` | ✅ binding |
| PostgreSQL 16 + Drizzle ORM (no vector DB v1) | `ADR-0004` | ✅ binding |
| Auth.js v5 Credentials + bcrypt + server sessions | `ADR-0005` | ✅ binding |
| pnpm monorepo + compile-time typed plugin manifest | `ADR-0006` | ✅ binding |
| **Mandatory engineering protocol** (quality gates, DoD, contributor constraints) | `ADR-0012` | ✅ binding |
| **Engineering Protocol v2** (DoR, spec-first, human approval, risk matrix, §39–§60) | `ADR-0013` | ✅ binding |
| **No new business features until M7 sign-off** | SPRINT-001 (founder directive 2026-07-11) | 🚧 active gate |

---

## What's still open (decisions needed)

| # | Question | Owner | Target date | Status |
| --- | --- | --- | --- | --- |
| 1 | Web framework | founder | before code starts | ✅ Decided — ADR-0003 |
| 2 | Database | founder | before code starts | ✅ Decided — ADR-0004 |
| 3 | Auth model | founder | before code starts | ✅ Decided — ADR-0005 |
| 4 | Plugin architecture pattern | founder | before code starts | ✅ Decided — ADR-0006 |
| 5 | Hosting: Vercel / self-hosted / VPS / Iranian host? | founder | before M6 of SPRINT-001 | ⏳ Pending — Q5 |
| 6 | Multi-tenant: subdomain / tenant column / schema? | founder | before schema freeze | ⏳ Pending — Q6 |
| 7 | Offline / PWA support? | founder | before MVP | ⏳ Pending — Q7 |

Q5 is consumed by SPRINT-001 M6. Q6 affects schema evolution; defer until M6 lands. Q7 is parked.

---

## Active sprint

| Field | Value |
| --- | --- |
| Sprint | SPRINT-001 — Production Foundation |
| Opened | 2026-07-11 |
| Current milestone | **Sprint M4 — closed.** M1–M4 (M4.0, M4.1, M4.2, M4.3) + M2 smoke test all ✅. M5+ parked on founder decisions. |
| Plan | [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md) |
| Evidence | `docs/06-sprints/SPRINT-001-production-foundation/evidence/M{2,3,4}-*/` |
| Gate | No feature work merged until M7 sign-off |
| **Critical finding (M4.0, merged on main)** | `GET /api/users` returned `passwordHash` to any logged-in user + no role-based authorization. Closed: spec at `evidence/M4-security/M4-0-authz-data-leak.md`; code merged to `main`. |

---

## Risks

1. **Context rot** — mitigated by small, modular docs and append-only history.
2. **Single-founder bus factor** — mitigated by docs being the source of truth, not chat history.
3. **Tool lock-in** — mitigated by Agent-portable `DEVELOPMENT_GUIDE.md` and standard Markdown.
4. **Premature standardization** — many docs are skeletons. Resist the urge to over-spec before the first code commit.
5. **Sprint drift** — mitigated by hard gate (no features until M7) and per-milestone evidence requirement.
6. **🟢 M4.1 dependency exposure — closed** — 28 → 2 advisories after merging `next@15.0.3 → 15.5.20` and `next-auth@5.0.0-beta.25 → 5.0.0-beta.31`. Closed in M4.3 (0 advisories).
7. **🟢 M4.0 authorization gap — closed on main** — `passwordHash` leak + missing role gate on `/api/users` fixed; ADR-0005 revised (JWT-only with per-request `isActive` re-check). Merged to `main`. Pre-merge exposure was real — any logged-in user could have dumped tenant hashes; the dedicated branch was reviewed and signed off before merge.
8. **🟢 M4.3 residual advisories + `security.txt` public access — closed on main** — `drizzle-orm ^0.36.0 → ^0.45.2` (GHSA-1116251, HIGH) + `pnpm.overrides.postcss = ^8.5.10` (GHSA-1117015, MOD, transitive) + `isSecurityTxt` exception in middleware (bug found by M2 smoke test). `pnpm verify` green; 36 tests; 8 routes; Middleware 46.1 kB; First Load JS 102 kB.
9. **🟢 M2 PostgreSQL blocker — closed** — Docker Desktop up; `hawza-postgres:16-alpine` healthy; full smoke walk passed (login → typed session → super_admin user list without `passwordHash` → public security.txt → 6 security headers on every response). Evidence: `docs/06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/M2-smoke-test.md`.
10. **🟡 `pnpm audit` endpoint retired by npm (2026-07-15)** — `ERR_PNPM_AUDIT_BAD_RESPONSE` / HTTP 410. Captured as a tool-status note in M4.3; substitute: `pnpm why <package> --filter web` + manual version pins. Future audits will need a different tool (e.g. `osv-scanner`, Snyk, GitHub Dependabot). Not a finding; not blocking.

---

## What's next

The very next concrete action is in `PROJECT_BACKLOG.md`. Read that file **second** (right after this one).
