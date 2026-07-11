# PROJECT_STATE.md

> **Current snapshot of the project.** This is the *first* file to read after `AGENTS.md`.

> Last updated: 2026-07-10 (v1.0 — documentation milestone)

---

## One-line status

**Documentation OS is live (v1.0). No source code written yet.**

---

## Phase

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Research & architecture | ✅ done | AI-native docs decision made. |
| 1. Repository skeleton | ✅ done | This file, AGENTS.md, README, etc. |
| 2. Product documentation | ✅ done (skeleton) | Bible, requirements, features, personas, roadmap. |
| 3. Architecture documentation | ✅ done (skeleton) | System arch, data model, plugin & permission matrices. |
| 4. Development conventions | ⏳ partial | `TECH_STACK.md` exists but is a stub. |
| 5. Source code (LPC + Hawza) | ❌ not started | Awaiting phase 4. |
| 6. Deployment & CI/CD | ❌ not started | Blocked on stack choice. |

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

---

## What's still open (decisions needed)

| # | Question | Owner | Target date |
| --- | --- | --- | --- |
| 1 | Web framework: Next.js / Remix / Nuxt / SvelteKit? | founder | before code starts |
| 2 | Database: Postgres only, or Postgres + a vector DB (for AI features)? | founder | before code starts |
| 3 | Auth model: own / Auth.js / Clerk / custom? | founder | before code starts |
| 4 | Plugin architecture: monorepo + packages, or in-repo modules with a manifest? | founder | before code starts |
| 5 | Hosting: Vercel / self-hosted / VPS / Iranian host? | founder | before deployment |
| 6 | Multi-tenant: per-Hawza subdomain, or single instance + tenant column? | founder | before schema freeze |
| 7 | Offline / PWA support? | founder | before MVP |

These are tracked more fully in `docs/05-decisions/DECISIONS.md`.

---

## Risks

1. **Context rot** — mitigated by small, modular docs and append-only history.
2. **Single-founder bus factor** — mitigated by docs being the source of truth, not chat history.
3. **Tool lock-in** — mitigated by Agent-portable AGENTS.md and standard Markdown.
4. **Premature standardization** — many docs are skeletons. Resist the urge to over-spec before the first code commit.

---

## What's next

The very next concrete action is in `NEXT_SESSION.md`. Read that file **second** (right after this one).
