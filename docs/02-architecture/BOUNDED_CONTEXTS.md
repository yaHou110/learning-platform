# BOUNDED_CONTEXTS.md

> **This document's responsibility:** Define the domain boundaries of the system — what each bounded context is responsible for and which domain events it emits or consumes. It is the domain map; it contains **no implementation technologies and no messaging-system names**. Entity details live in [`DATA_MODEL.md`](./DATA_MODEL.md), the per-plugin inventory in [`PLUGIN_MATRIX.md`](./PLUGIN_MATRIX.md), and authorization in [`PERMISSION_MATRIX.md`](./PERMISSION_MATRIX.md). Technology choices that realize these contexts are deferred to ADRs.

---

## Context map (overview)

```
Identity & Access ──▶ Platform/System ──▶ Catalog & Content
        │                  │                    │
        │                  │                    ▼
        └────────── Learning & Progress ◀── Credentials
                          │
                          ▼
                     Localization (cross-cutting)
```

Contexts couple through **domain events** only. No context reads or writes another context's data directly; cross-context needs go through the core API or an event.

---

## Contexts

### Identity & Access
- **Responsibility:** Authentication, tenant resolution, roles, and permissions. Owns identity, sessions, and the RBAC policy.
- **Emits:** `tenant.created`, `user.invited`, `user.role_changed`, `user.deactivated`, `auth.login`, `auth.login_failed`.
- **Consumes:** (none external; reacts to its own events for audit).

### Platform / System
- **Responsibility:** Cross-cutting platform capabilities — tenant provisioning, the plugin loader, the audit log, and routing of domain events between contexts. This context is always on.
- **Emits:** `tenant.provisioned`, `plugin.enabled`, `plugin.disabled`, `audit.recorded`.
- **Consumes:** `tenant.created`, `course.published`, `enrollment.completed` (for audit/observability).

### Catalog & Content
- **Responsibility:** Courses, lessons, and media assets. Owns the course/lesson lifecycle and media storage metadata.
- **Emits:** `course.published`, `course.archived`, `lesson.created`, `lesson.updated`, `media.uploaded`.
- **Consumes:** `tenant.created` (seed default content), `tenant.provisioned`.

### Learning & Progress
- **Responsibility:** Enrollment, lesson-level progress, learning paths, and progress reporting.
- **Emits:** `enrollment.created`, `enrollment.completed`, `lesson.progress.updated`, `course.completed`, `path.updated`.
- **Consumes:** `course.published`, `lesson.created`, `user.role_changed`.

### Credentials
- **Responsibility:** Issuing and verifying completion certificates.
- **Emits:** `certificate.issued`, `certificate.verified`.
- **Consumes:** `course.completed`.

### Localization (cross-cutting)
- **Responsibility:** Persian-first formatting, Shamsi (Jalali) dates, RTL helpers, and translation lookup. Stateless; owns no tenant data.
- **Emits:** (none).
- **Consumes:** (none).

---

## Future contexts (not in v1)

Defined here so the boundaries are reserved; not built yet.

- **Assessment** — quizzes/exams beyond the basic v1 multiple-choice.
- **Communication** — notifications (email/push).
- **Commerce** — payments.
- **AI** — summarization, transcription, recommendation.

---

## Notes

- The v1 "plugin system" is realized as **internal compile-time modularity** within these contexts (see `PROJECT_PRINCIPLES.md`); there is no runtime plugin loading in v1.
- Domain events listed above are the contract between contexts. Their transport and schema are an implementation decision for a later ADR, not specified here.
