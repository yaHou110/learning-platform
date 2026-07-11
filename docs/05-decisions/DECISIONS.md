# DECISIONS.md

> **Index of all binding decisions (ADRs).** Append-only.
> Read this file when you need to know *why* something is the way it is.

---

## Active ADRs

| # | Title | Status | Date |
| --- | --- | --- | --- |
| [ADR-0001](./ADR-0001-no-wordpress.md) | No WordPress — use a custom or framework-native stack | Accepted | 2026-07-10 |
| [ADR-0002](./ADR-0002-ai-project-os.md) | Documentation is AI-native, agent-portable | Accepted | 2026-07-10 |

---

## Proposed (open questions → ADRs to write)

| # | Title | Status | Target |
| --- | --- | --- | --- |
| ADR-0003 | Web framework choice | Proposed | M1 |
| ADR-0004 | Database + (optional) vector DB | Proposed | M1 |
| ADR-0005 | Auth model | Proposed | M1 |
| ADR-0006 | Plugin architecture pattern | Proposed | M1 |
| ADR-0007 | Hosting & deployment model | Proposed | before M7 |
| ADR-0008 | Multi-tenant data isolation enforcement | Proposed | before M3 |
| ADR-0009 | i18n & date library choice | Proposed | before M3 |
| ADR-0010 | Media storage provider (S3-compatible) | Proposed | before M3 |

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
6. در `MASTER_HANDOFF.md` در entry جلسه اخیر اشاره کنید.
7. Commit.
