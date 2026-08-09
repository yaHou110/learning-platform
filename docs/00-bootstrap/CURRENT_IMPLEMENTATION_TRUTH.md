# Current Implementation Truth

> Canonical current-state snapshot for product reviews and commercial discussions.
> This document describes the repository at commit `60be6c1` and must not be used to claim capabilities that are only planned.

## Product identity

**رویش — سامانه فرهنگی، تربیتی حوزه و خانواده** is currently a Persian RTL web platform whose implemented core is a modular learning platform. The family/cultural experience is present in the interface and product direction, but the domain model for families, children, campaigns, competitions, trips, events, and participation is not yet implemented.

## Evidence levels

- **Implemented:** working source path exists and is covered by tests or an end-to-end/manual flow.
- **Partial:** part of the behavior exists, but an important workflow, persistence model, or production dependency is missing.
- **Planned:** documented intent without a working implementation.
- **Unverified:** configuration or documentation exists, but the behavior has not been proven in the current production environment.

## Capability matrix

| Capability | Status | Evidence | Limitations |
|---|---|---|---|
| Login | Implemented | `apps/web/src/auth.ts`, `apps/web/src/app/login/`, `packages/core/src/auth/credentials.ts` | National ID + numeric center ID; no public registration flow. |
| Password recovery | Implemented | `apps/web/src/app/forgot-password/`, `apps/web/src/app/api/auth/{forgot-password,reset-password}/` | Mock SMS by default; real provider requires production configuration. |
| Roles and route authorization | Partial | `apps/web/src/lib/authz.ts`, API routes, `identity.users.role` | Four roles exist; role-management UI and parent/child roles do not. |
| Tenant data scoping | Partial | `tenant_id` columns, scoped core APIs, `ADR-0008` | Operational onboarding and subdomain routing are not complete; RLS is defense-in-depth, not the primary active runtime boundary. |
| Course catalog | Implemented | `packages/core/src/api/catalog.ts`, `/api/courses`, `/courses` | No taxonomy, prerequisites, or media upload workflow. |
| Lessons and progress | Implemented | `catalog.ts`, `learning.ts`, lesson routes/pages, integration tests | Media rendering is placeholder-level because production object storage is not wired. |
| Certificates | Partial | `packages/core/src/db/schema/credentials.ts`, certificate routes | Evidence level: code/schema and route surface only; full PDF issuance/download lifecycle is not established as a complete product workflow. |
| Family/cultural dashboard | Partial | `apps/web/src/app/dashboard/page.tsx` | Current family tiles and announcements are product surfaces; counts and content must come from real family-domain data in a future slice. |
| Family members and children | Planned | Product direction and personas | No family relationship schema or parent/child access model. |
| Campaigns, competitions, trips, events | Planned | Product direction/UI labels | No corresponding domain tables, APIs, or admin workflows. |
| Notifications | Planned | backlog and plugin matrix | No durable notification system. |
| Search and reporting | Planned | requirements/backlog | No general search or reporting/export product workflow. |
| Plugin architecture | Partial | `packages/plugins/*`, manifests, registry, coverage test | Built-in compile-time manifests exist; runtime third-party installation and full lifecycle hooks are not implemented. |
| Persian RTL and dark mode | Implemented | shared layout/components and UI routes | No second language; broader accessibility and cross-browser audit remains. |
| Health/readiness/metrics | Implemented at code level | `/api/health`, `/api/ready`, `/api/metrics`, observability package | Local/CI behavior is covered; current production verification must be performed against the active deployment. Metrics are in-process; no remote error/metrics backend in v1. |
| Vercel + Railway deployment | Configured / production smoke status must be verified per deployment | `ADR-0018`, `.github/workflows/deploy-vercel.yml` | The current project has no dedicated Production Domain in Vercel; public access may also be affected by Vercel project access/SSO settings. Independently reproducible customer handoff remains operational work. |
| Docker full-stack lane | Locally documented and previously verified | `docker-compose.prod.yml`, migration service, deployment evidence | Re-run locally when changing deployment or migrations. This is the local verification lane, not the current cloud production substrate. |

## Authentication truth

- Password hashing: **bcrypt**, not argon2id.
- Session strategy: **Auth.js JWT**, not database sessions.
- Login identifier: **national ID**, with numeric center ID.
- Recovery: **national ID + mobile + one-time code**.
- The original email/database-session statements in older ADR text are historical and superseded by the revision in `ADR-0005`.

## Deployment truth

- Current cloud target: **Vercel serverless Next.js + Railway PostgreSQL**.
- Docker Compose, Nginx, systemd, MinIO, and backup scripts remain the local/full-stack verification or legacy self-hosted lane.
- Production object storage is not wired in v1; `/api/health` reporting `storage: "skipped"` is expected.
- A green CI deployment is not a substitute for verifying the current production URL, commit SHA, database schema, and real user journey.

## Commercially safe description

> A Persian RTL modular learning-platform MVP with working authentication, password recovery, tenant-scoped course/lesson/enrollment/progress flows, certificate endpoints, observability, and cloud deployment configuration. It has a family/cultural product identity and dashboard direction, while the persistent family-domain features are a planned next product slice.
