# PROJECT_STATE.md

> **Current snapshot of the project.** This is the *first* file to read after `DEVELOPMENT_GUIDE.md`.

> Last updated: 2026-08-07 (v1.17 — current implementation truth added; historical claims remain append-only)\n>\n> **Current-state audit:** read [`CURRENT_IMPLEMENTATION_TRUTH.md`](./CURRENT_IMPLEMENTATION_TRUTH.md) before using this historical state snapshot for product, security, or commercial claims.

---

## One-line status

**SPRINT-002 Feature Sprint — S1+S2 shipped.** Production Foundation Sprint M1–M7 closed; v1 deploys to Vercel (serverless Next.js, Root Directory `apps/web`) + Railway Postgres. The Catalog and Learning bounded contexts are now fully usable: tested APIs (courses/lessons CRUD + publish, idempotent enroll, per-lesson progress with course-completion flip) AND a complete RTL Persian UI — student catalog → course detail → lessons with «دیدم» progress marking, admin course/lesson management, role-aware dashboard, and an idempotent demo seed (published course + 5 lessons). `pnpm verify` green (101 unit tests + 22/22 integration + build), live smoke verified against local Postgres. Production deployment `Ready` (behind Vercel org SSO — local Docker lane remains the endpoint-verification path). Next: security follow-ups (security.txt contact, CSP nonces, Dependabot), Credentials plugin, PWA.

---

## In-flight task

> **Live pointer to where the work is right now.** Updated after every meaningful milestone (see `DEVELOPMENT_GUIDE.md`). At a glance: what is being done, what is blocking it, what is next. For full history, read `PROJECT_HANDOVER.md`.

- **Current task:** **M7 complete — Vercel + Railway deployment target live.** ADR-0018 recorded. M6 Deployment/CI-CD merged. M7 pre-provision prep complete (containerized migrations ADR-0017, deploy defects fixed, local nginx harness). **M7 gate lifted: founder VPS provisioning blocker removed; cloud target (Vercel + Railway Postgres) is the v1 deployment model.** Next: feature work unblocked (Catalog, Learning, Dashboard, Credentials, PWA).
- **Blocked by:** Nothing — M7 gate lifted.
- **Next:** Begin SPRINT-002 (Feature Sprint) or continue SPRINT-001 post-M7 follow-ups (HSTS behind TLS, CSP nonces, security.txt contact, osv-scanner substitute).

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
| 6. **Production Foundation Sprint** | ✅ M1–M5 closed | M1 ✅, **M2 ✅ (real-Postgres smoke test passed 2026-07-15)**, M3 ✅, M4.0 ✅ (merged on main), M4.1 ✅, M4.2 ✅, **M4.3 ✅ (drizzle-orm + postcss residual advisories resolved; security.txt public via middleware fix)**, **M5 ✅ (Observability: pino JSON logs + Prometheus metrics + error capture + health/ready/metrics endpoints)**. M6–M7 + Q7 (PWA, deployment/CI-CD) remain; M6 unblocked by M5. |
| 7. **Deployment & CI/CD** | ✅ M6 closed, **M7 ✅ (gate lifted 2026-07-23)** | **M6 merged to main (PR #7)** — Docker Compose prod, Nginx reverse proxy (TLS+HSTS+rate-limit), systemd unit, backup/restore scripts, deployment guide, post-deploy smoke test. **M7 pre-provision prep done** — containerized migrations (ADR-0017), `image:` field fix, env heredoc fix, local TLS nginx harness. **M7 gate lifted:** founder cancelled VPS plan; Vercel + Railway Postgres is the v1 cloud target per ADR-0018; Docker Compose stays as the local verification lane. Feature work unblocked. |

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
| **No new business features until M7 sign-off** | SPRINT-001 (founder directive 2026-07-11) | 🟢 **gate lifted (2026-07-23)** — M7 satisfied by Vercel + Railway cloud target (ADR-0018) |
| **Containerized DB migrations — one-shot `migrate` service in docker-compose.prod.yml, reusing app builder stage (tsx + drizzle-orm + migrations), runs against prod DATABASE_URL before app boots (`depends_on: service_completed_successfully`)** | `ADR-0017` | ✅ binding (2026-07-22) |
| **Hosting & deployment model (v1 redirect) — Vercel (serverless Next.js) + Railway Postgres; Docker Compose prod stack retained as local verification lane** | `ADR-0018` | ✅ binding (2026-07-23) |
| **Multi-tenant data isolation — shared schema + tenant_id; application scoping is active, RLS is defense-in-depth, operational tenancy deferred** | `ADR-0008` | ✅ binding (2026-07-19) |

---

## What's still open (decisions needed)

| # | Question | Owner | Target date | Status |
| --- | --- | --- | --- | --- |
| 1 | Web framework | founder | before code starts | ✅ Decided — ADR-0003 |
| 2 | Database | founder | before code starts | ✅ Decided — ADR-0004 |
| 3 | Auth model | founder | before code starts | ✅ Decided — ADR-0005 |
| 4 | Plugin architecture pattern | founder | before code starts | ✅ Decided — ADR-0006 |
| 5 | Hosting: Vercel / self-hosted / VPS / Iranian host? | founder | before M6 of SPRINT-001 | ✅ Decided — ADR-0007 |
| 6 | Multi-tenant: subdomain / tenant column / schema? | founder | before schema freeze | ✅ Decided — ADR-0008 |
| 7 | Offline / PWA support? | founder | before MVP | ⏳ Pending — Q7 |

Q5 is consumed by SPRINT-001 M6/M7. Closed by ADR-0007 (superseded by ADR-0018). Q6 affects schema evolution; parked.

---

## Active sprint

| Field | Value |
| --- | --- |
| Sprint | SPRINT-001 — Production Foundation |
| Opened | 2026-07-11 |
| Current milestone | **M7 — Production Readiness Review COMPLETE.** Vercel project provisioned + Railway Postgres running (founder provisioned 2026-07-23). ADR-0018 records the Vercel + Railway cloud-target decision, superseding ADR-0007's VPS path. Docker Compose prod stack retained as the local full-stack verification lane (ADR-0017). **M7 gate lifted: feature work (Catalog/Learning/Dashboard/Credentials/PWA) unblocked.** Environment variables for production (DATABASE_URL, AUTH_SECRET, AUTH_TRUST_HOST, NEXTAUTH_URL) must be set on Vercel dashboard by the founder before first smoke test. |
| Plan | [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md) |
| Evidence | `docs/06-sprints/SPRINT-001-production-foundation/evidence/M{2,3,4,5,6}-*/` + `M7-readiness/` |
| Gate | 🟢 **M7 gate lifted (2026-07-23):** Vercel + Railway target live; founder to set 4 env vars on Vercel dashboard → redeploy → `/api/health` smoke check. Feature work unblocked. |
| **Critical finding (M4.0, merged on main)** | `GET /api/users` returned `passwordHash` to any logged-in user + no role-based authorization. Closed: spec at `evidence/M4-security/M4-0-authz-data-leak.md`; code merged to `main`. |

---

## Risks

1. **Context rot** — mitigated by small, modular docs and append-only history.
2. **Single-founder bus factor** — mitigated by docs being the source of truth, not chat history.
3. **Tool lock-in** — mitigated by a portable `DEVELOPMENT_GUIDE.md` and standard Markdown.
4. **Premature standardization** — many docs are skeletons. Resist the urge to over-spec before the first code commit.
5. **Sprint drift** — mitigated by hard gate (M7 lifted 2026-07-23; feature work unblocked).
6. **🟢 M4.1 dependency exposure — closed** — 28 → 2 advisories after merging `next@15.0.3 → 15.5.20` and `next-auth@5.0.0-beta.25 → 5.0.0-beta.31`. Closed in M4.3 (0 advisories).
7. **🟢 M4.0 authorization gap — closed on main** — `passwordHash` leak + missing role gate on `/api/users` fixed; ADR-0005 revised (JWT-only with per-request `isActive` re-check). Merged to `main`. Pre-merge exposure was real — any logged-in user could have dumped tenant hashes; the dedicated branch was reviewed and signed off before merge.
8. **🟢 M4.3 residual advisories + `security.txt` public access — closed on main** — `drizzle-orm ^0.36.0 → ^0.45.2` (GHSA-1116251, HIGH) + `pnpm.overrides.postcss = ^8.5.10` (GHSA-1117015, MOD, transitive) + `isSecurityTxt` exception in middleware (bug found by M2 smoke test). `pnpm verify` green; 36 tests; 8 routes; Middleware 46.1 kB; First Load JS 102 kB.
9. **🟢 M2 PostgreSQL blocker — closed** — Docker Desktop up; `hawza-postgres:16-alpine` healthy; full smoke walk passed (login → typed session → super_admin user list without `passwordHash` → public security.txt → 6 security headers on every response). Evidence: `docs/06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/M2-smoke-test.md`.
10. **🟡 `pnpm audit` endpoint retired by npm (2026-07-15)** — `ERR_PNPM_AUDIT_BAD_RESPONSE` / HTTP 410. Captured as a tool-status note in M4.3; substitute: `pnpm why <package> --filter web` + manual version pins. Future audits will need a different tool (e.g. `osv-scanner`, Snyk, GitHub Dependabot). Not a finding; not blocking.
11. **🟢 M7 pre-provision prep + M7 gate lifted — completed on main (PR #7, ADR-0018)** — containerized DB migrations (ADR-0017), `docker-compose.prod.yml` `image:` field fix (CI `pull` now works), `DEPLOYMENT_GUIDE.md` heredoc fixed (real secrets not literal `$(...)`), local TLS nginx harness validates HSTS/headers/metrics gate. **M7 gate lifted 2026-07-23:** founder cancelled VPS plan; cloud target (Vercel + Railway Postgres) is the v1 deployment model per ADR-0018. ADR-0007 superseded. Feature work unblocked. Next: founder sets 4 env vars on Vercel dashboard → redeploy → `/api/health` smoke check.

---

## What's next

The very next concrete action is in `PROJECT_BACKLOG.md`. Read that file **second** (right after this one).

**Immediate (founder action):** Set 4 env vars on Vercel dashboard (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXTAUTH_URL`) → redeploy → `curl /api/health` → expect `{"status":"ok","checks":{"db":true,"auth":true,"storage":"skipped"}}`.

**Next (contributor work, now unblocked):** Catalog / Learning / Dashboard / Credentials / PWA (Q7 → ADR-0016 YES). HSTS behind TLS, CSP nonces, `security.txt` real contact, `osv-scanner` substitute.
