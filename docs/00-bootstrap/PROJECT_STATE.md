# PROJECT_STATE.md

> **Current snapshot of the project.** This is the *first* file to read after `DEVELOPMENT_GUIDE.md`.

> Last updated: 2026-07-15 (v1.9 — M4.2 complete: CSP + per-route rate limits + input-validation harness + `/.well-known/security.txt`; rebrand audit gap closed)

---

## One-line status

**Production Foundation Sprint in progress (M1 ✅, M2 partial, M3 ✅, M4.0 ✅ merged on main, M4.1 ✅, M4.2 ✅ — security hardening landed, secret-free).** The 28-vuln dependency finding was fixed in M4.1. The M4.0 P0 (password-hash leak + missing role gate) was merged on main. M4.2 added a strict Content-Security-Policy, in-memory (Node) rate limits on `/api/users` + `/api/auth/session`, a reusable Zod `parseQuery`/`parseBody` harness, and `/.well-known/security.txt`; the de-AI/rebrand sweep is now complete (no `@hawza/core` in any tracked file). Feature development remains suspended until M7 sign-off; residual advisories (`drizzle-orm`, transitive `postcss`) and the M2 smoke test are the remaining M4-open items.

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
| 6. **Production Foundation Sprint** | 🔵 in progress | M1 ✅, M2 partial (PostgreSQL blocker — Docker now ready, smoke test pending), M3 ✅ (evidence closed 2026-07-12), M4.1 ✅ (next/next-auth upgrade), **M4.0 ✅ merged on main** (authorization + password-hash fix; ADR-0005 Rev 1), **M4.2 ✅** (CSP + per-route rate limits + Zod input validation harness + security.txt; rebrand audit gap closed). |
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
| Current milestone | **M4 — Security Hardening (pre-work)** (M1 ✅, M2 partial, M3 ✅) |
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
6. **🟢 M4.1 dependency exposure — closed** — 28 → 2 advisories after merging `next@15.0.3 → 15.5.20` and `next-auth@5.0.0-beta.25 → 5.0.0-beta.31`. Residual `drizzle-orm` + transitive `postcss` are documented follow-ups; no public attack surface introduced by the fix.
7. **🟢 M4.0 authorization gap — closed on main** — `passwordHash` leak + missing role gate on `/api/users` fixed; ADR-0005 revised (JWT-only with per-request `isActive` re-check). Merged to `main`. Pre-merge exposure was real — any logged-in user could have dumped tenant hashes; the dedicated branch was reviewed and signed off before merge.

---

## What's next

The very next concrete action is in `PROJECT_BACKLOG.md`. Read that file **second** (right after this one).
