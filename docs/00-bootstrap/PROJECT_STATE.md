# PROJECT_STATE.md

> **Current snapshot of the project.** This is the *first* file to read after `AGENTS.md`.

> Last updated: 2026-07-11 (v1.2 — Production Foundation Sprint in progress, M1 ✅, M2 next)

---

## One-line status

**Production Foundation Sprint in progress (M1 ✅, M2 next).** Feature development suspended until M7 sign-off.

---

## Phase

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Research & architecture | ✅ done | AI-native docs decision made. |
| 1. Repository skeleton | ✅ done | This file, AGENTS.md, README, etc. |
| 2. Product documentation | ✅ done (skeleton) | Bible, requirements, features, personas, roadmap. |
| 3. Architecture documentation | ✅ done (skeleton) | System arch, data model, plugin & permission matrices. |
| 3b. Foundation docs | ✅ done | `MVP_SCOPE`, `BOUNDED_CONTEXTS`, `PROJECT_PRINCIPLES`, `ARCHITECTURE_CONSTRAINTS`. |
| 4. Development conventions | ✅ done (v1.1) | `TECH_STACK.md` populated post ADR-0003..0006. |
| 5. Source code (Identity & Access) | ✅ done | Migration + Auth.js + middleware + 2 API routes (sessions 005–007). |
| 5.5. Source code (other features) | ⏸️ paused | Catalog / Learning / Credentials / Localization / Dashboard — parked pending M7. |
| 6. **Production Foundation Sprint** | 🔵 in progress | See [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md). Currently on **M1 (Baseline Verification)**. |
| 7. Deployment & CI/CD | ❌ not started | Blocked on sprint M3/M6. |

---

## What's locked (do not change without an ADR)

| Decision | File | Status |
| --- | --- | --- |
| No WordPress, ever | `ADR-0001` | ✅ binding |
| AI-native, agent-portable docs | `ADR-0002` | ✅ binding |
| Repo root language for code/IDs: English | `AGENTS.md` | ✅ binding |
| Repo narrative language for product: Farsi (Persian) | `AGENTS.md` | ✅ binding |
| Single-product repo (LPC + Hawza instance in one repo) | `PRODUCT_BIBLE.md` | ✅ binding |
| Append-only history (CHANGELOG, handoffs, ADRs) | `AGENTS.md` | ✅ binding |
| Next.js 15 (App Router) + Node 20 LTS + TS strict | `ADR-0003` | ✅ binding |
| PostgreSQL 16 + Drizzle ORM (no vector DB v1) | `ADR-0004` | ✅ binding |
| Auth.js v5 Credentials + bcrypt + server sessions | `ADR-0005` | ✅ binding |
| pnpm monorepo + compile-time typed plugin manifest | `ADR-0006` | ✅ binding |
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
| Current milestone | **M2 — Production Build Validation** (M1 ✅) |
| Plan | [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md) |
| Evidence | `docs/06-sprints/SPRINT-001-production-foundation/evidence/M1-baseline/` |
| Gate | No feature work merged until M7 sign-off |

---

## Risks

1. **Context rot** — mitigated by small, modular docs and append-only history.
2. **Single-founder bus factor** — mitigated by docs being the source of truth, not chat history.
3. **Tool lock-in** — mitigated by Agent-portable AGENTS.md and standard Markdown.
4. **Premature standardization** — many docs are skeletons. Resist the urge to over-spec before the first code commit.
5. **Sprint drift** — mitigated by hard gate (no features until M7) and per-milestone evidence requirement.

---

## What's next

The very next concrete action is in `NEXT_SESSION.md`. Read that file **second** (right after this one).
