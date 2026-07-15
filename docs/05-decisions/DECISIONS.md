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
| [ADR-0012](./ADR-0012-engineering-protocol.md) | Mandatory engineering protocol — quality gates, DoD, agent constraints | Accepted | 2026-07-12 |
| [ADR-0013](./ADR-0013-engineering-protocol-v2.md) | Engineering Protocol v2 (§39–§60), chapters, DoR, spec-first, risk matrix | Accepted | 2026-07-12 |

---

## Proposed (open questions → ADRs to write)

| # | Title | Status | Target |
| --- | --- | --- | --- |
| ADR-0007 | Hosting & deployment model | Proposed | before M7 |
| ADR-0008 | Multi-tenant data isolation enforcement (subdomain vs tenant column vs schema) | Proposed | before schema freeze |
| ADR-0009 | i18n & Shamsi date library | Proposed | before M3 (will likely fold into ADR-0003 follow-up since derived from stack) |
| ADR-0010 | Media storage provider (S3-compatible) | Proposed | before M3 |
| ADR-0011 | Background job runner (tentative: pg-boss) | Proposed | when first async job is needed |

---

## Superseded

*(none yet)*

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
