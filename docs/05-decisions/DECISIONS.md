# DECISIONS.md

> **Index of all binding decisions (ADRs).** Append-only.
> Read this file when you need to know *why* something is the way it is.

---

## Active ADRs

| # | Title | Status | Date |
| --- | --- | --- | --- |
| [ADR-0001](./ADR-0001-no-wordpress.md) | No WordPress — use a custom or framework-native stack | Accepted | 2026-07-10 |
| [ADR-0002](./ADR-0002-operating-manual.md) | Documentation is portable | Accepted | 2026-07-10 |
| [ADR-0003](./ADR-0003-web-framework.md) | Web framework — Next.js 15 (App Router) on Node.js 20 LTS | Accepted | 2026-07-11 |
| [ADR-0004](./ADR-0004-database.md) | Database — PostgreSQL 16 + Drizzle ORM (no vector DB in v1) | Accepted | 2026-07-11 |
| [ADR-0005](./ADR-0005-auth.md) | Auth — Auth.js v5 Credentials + bcrypt + JWT sessions + per-request `isActive` re-check (Revision 1, 2026-07-13: DB-session mechanism amended to JWT-only) | Accepted | 2026-07-11 |
| [ADR-0006](./ADR-0006-plugin-architecture.md) | Plugin architecture — pnpm monorepo + compile-time typed manifest | Accepted | 2026-07-11 |
| [ADR-0012](./ADR-0012-engineering-protocol.md) | Mandatory engineering protocol — quality gates, DoD, contributor constraints | Accepted | 2026-07-12 |
| [ADR-0013](./ADR-0013-engineering-protocol-v2.md) | Engineering Protocol v2 (§39–§60), chapters, DoR, spec-first, risk matrix | Accepted | 2026-07-12 |
| [ADR-0014](./ADR-0014-reusable-platform-vision.md) | Reusable platform vision — first customer, not the only customer; capability vs. operation split reconciles C2 with deferred multi-tenancy (ADR-0008) | Accepted | 2026-07-18 |
| [ADR-0015](./ADR-0015-osv-scanner.md) | OSV Scanner for dependency vulnerability scanning — replaces deprecated npm audit endpoint | Accepted | 2026-07-19 |
| [ADR-0007](./ADR-0007-hosting-deployment-model.md) | Hosting & deployment model — self-hosted single-VPS dedicated deployment for v1, deployment shape kept abstract (SaaS/licensed/managed reachable without rewrite) | Accepted | 2026-07-19 |
| [ADR-0008](./ADR-0008-multi-tenant-isolation.md) | Multi-tenant data isolation — shared schema + `tenant_id` + 3-layer enforcement (app default + Postgres RLS + integration tests) for v1; operational tenancy deferred; silo/bridge reachable later | Accepted | 2026-07-19 |
| [ADR-0016](./ADR-0016-pwa-offline.md) | PWA / offline — founder decided **YES** (2026-07-21); parked until M7 sign-off. Unlocks Learning bounded context + service-worker infra | Accepted | 2026-07-21 |
| [ADR-0018](./ADR-0018-hosting-deployment-model-vercel-supersedes-0007.md) | Hosting & deployment model (v1 redirect) — Vercel (serverless Next.js) + Railway Postgres; supersedes ADR-0007 | Accepted | 2026-07-23 |
| [ADR-0017](./ADR-0017-containerized-db-migrations.md) | DB migrations run as a one-shot containerized compose service at deploy time (reusing the app image; prod `DATABASE_URL`); no host `pnpm`/`node`/`psql` required — works on Docker-only hosts | Accepted | 2026-07-22 |

---

## Proposed (open questions → ADRs to write)

| # | Title | Status | Target |
| --- | --- | --- | --- |
| ADR-0009 | i18n & Shamsi date library | Proposed | when first locale work begins (parked until M7 sign-off) |
| ADR-0010 | Media storage provider (S3-compatible) | Proposed | when first media feature is needed (parked until M7 sign-off) |
| ADR-0011 | Background job runner (tentative: pg-boss) | Proposed | when first async job is needed |

> **Target refresh (2026-07-16):** Earlier targets read "before M3" for ADR-0007/0010. M3/M4 are
> now complete; feature work is gated until M7 sign-off. Targets above realign with
> `PROJECT_STATE.md` (open questions Q5/Q6) and the sprint gate. This index entry is non-historical
> (per ADR-0002, append-only applies to past ADRs / handovers / CHANGELOG, not to the DECISIONS index).

---

## Superseded

| [ADR-0007](./ADR-0007-hosting-deployment-model.md) | Hosting & deployment model — self-hosted single-VPS dedicated deployment for v1, deployment shape kept abstract | Superseded by ADR-0018 | 2026-07-19 / 2026-07-23 |

A superseded ADR is moved here with a link to the new ADR that replaces it. **Old ADRs are never edited.**

---

## Rejected (decided against)

*(none yet)*

A rejected proposal is kept here with its rationale. Useful for future "wait, why didn't we…" questions.

---

## Template

برای نوشتن ADR جدید، کپی کنید از `../../templates/ADR_TEMPLATE.md`.

---

## How to add a new ADR

1. **شماره بعدی** را از لیست `Proposed` بگیرید (e.g. `ADR-0003`).
2. فایل `ADR-NNNN-<short-slug>.md` در همین پوشه بسازید.
3. از `templates/ADR_TEMPLATE.md` استفاده کنید.
4. در همین فایل (`DECISIONS.md`) در جدول `Active` اضافه کنید.
5. در `CHANGELOG.md` زیر `## [Unreleased]` اضافه کنید.
6. در `PROJECT_HANDOVER.md` در entry جلسه اخیر اشاره کنید.
7. Commit.
