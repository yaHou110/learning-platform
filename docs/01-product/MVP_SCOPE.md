# MVP_SCOPE.md

> **This document's responsibility:** Define *what* the v1 product is, who it is for, and what product-level success looks like. It is the product-outcome contract for v1 and must contain **no implementation detail**.
> It is the single source of truth for v1 scope. Related views live elsewhere and are **referenced, not repeated**: the long-term *why* is in [`PRODUCT_BIBLE.md`](./PRODUCT_BIBLE.md), per-user detail is in [`PERSONAS.md`](./PERSONAS.md), the full feature inventory is in [`FEATURE_CATALOG.md`](./FEATURE_CATALOG.md), and time horizons/milestones are in [`ROADMAP.md`](./ROADMAP.md). Technical constraints live in [`../02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md).

---

## Problem

Hawza (Islamic seminary) families have no unified, native tool for structured learning. Resources are scattered (booklets, audio, live classes, books) with no shared view; there is no clear per-level learning path; no tool tracks a student's progress across years; and reliance on external, non-native tools (YouTube, WordPress, Moodle) either misfits the audience or removes data ownership. See `PRODUCT_BIBLE.md §1–3` for the full narrative.

## Target users

| Persona | Short description |
| --- | --- |
| **Student (Talabeh)** | Learns along a path and tracks own progress. |
| **Teacher (Ostad)** | Authors courses and content. |
| **Center Admin (Modir-e Markaz)** | Operates one tenant (center). |
| **Super Admin** | Owns the product; cross-tenant access. |
| **Parent** | *Optional* — read-only view of a linked student's progress. |

Detailed goals, pains, and journeys: [`PERSONAS.md`](./PERSONAS.md).

## Product goals

- **Native** — built for Hawza language, culture, and pedagogy.
- **Durable** — maintainable and usable 10 years out.
- **Owned by us** — no dependency on a third-party platform.
- **Extensible** — each center can run its own customized instance.

## In scope (v1)

- **Tenant (center) onboarding** — a new Hawza center becomes a usable tenant.
- **Authentication** — simple email + password sign-in (SMS/OTP deferred).
- **User & role management** — students, teachers, center admins, super admin; basic RBAC.
- **Course & lesson management** — create, edit, publish, archive courses and their lessons.
- **Media** — upload and playback of lesson media (video/audio/pdf/text).
- **Enrollment & progress** — students enroll and track lesson-level progress.
- **Learning path** — a basic per-level path across courses.
- **Simple assessment** — basic multiple-choice quiz only.
- **Center admin panel** — a center admin can operate their tenant.
- **Localization** — Persian-first, RTL, Shamsi dates.
- **Audit log** — tamper-evident record of sensitive mutations.
- **Plugin system (v1 shape)** — internal, compile-time modularity only. See `PROJECT_PRINCIPLES.md`.

> Feature-level detail and status: [`FEATURE_CATALOG.md`](./FEATURE_CATALOG.md).

## Out of scope (v1)

- Online payments / commerce.
- Native mobile applications (web-responsive only).
- Complex or proctored online examinations.
- Languages other than Persian.
- Generative-AI content production.
- **Runtime plugin loading, a plugin marketplace, or third-party plugins** (v1 plugins are internal only).
- Public/external API surface beyond the versioned contract defined in `ARCHITECTURE_CONSTRAINTS.md`.
- Advanced analytics, per-tenant custom themes, multi-language.

## Success criteria (product outcomes only)

The v1 product is successful when:

1. **At least 3 centers** are running as active tenants.
2. **Each active center has 50+ registered students.**
3. **Course completion rate is ≥ 30%** across active tenants.
4. A **Center Admin can independently** onboard their center, add a Teacher and a Student, and publish a course without engineering help.
5. A **Student can** consume lessons, mark progress, and see their own advancement over time.
6. A **Teacher can** author and publish a real course with ≥ 5 lessons.

> Operational/technical SLOs (uptime, latency, onboarding time) are intentionally **not** here — they are hard constraints in [`ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md).
