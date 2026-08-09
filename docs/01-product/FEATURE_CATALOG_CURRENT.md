# Current Feature Catalog

> Current-state catalog for the product as implemented on 2026-08-07. Historical planning remains in `FEATURE_CATALOG.md`; this file prevents planned features from being presented as shipped.

## Shipped / verified in the repository

| Capability | Evidence | Evidence level | Notes |
|---|---|---|---|
| Auth.js credentials login | `apps/web/src/auth.ts`, `apps/web/src/app/login/` | Code + local/manual flow | National ID + numeric center ID + password. |
| Password recovery | `apps/web/src/app/forgot-password/`, auth API routes | Code + local/manual flow | One-time code flow; production SMS provider is configuration-dependent. |
| Role-aware access | `apps/web/src/lib/authz.ts`, route handlers | Code + route tests | `super_admin`, `center_admin`, `teacher`, `student`. |
| Tenant-scoped identity | `packages/core/src/db/schema/identity.ts` | Code + scoped API tests | Shared database/schema with tenant columns. |
| Course and lesson catalog | `packages/core/src/api/catalog.ts`, `/api/courses`, `/courses` | Code + route/integration tests | Draft/published/archived status and admin management. |
| Enrollment and lesson progress | `packages/core/src/api/learning.ts`, enrollment/progress routes | Code + route/integration tests | Idempotent enrollment and completion flip. |
| Persian RTL UI and dark mode | `apps/web/src/app/`, shared components | Code + UI/manual flow | Current web surface is Persian-first. |
| Health/readiness/metrics | `/api/health`, `/api/ready`, `/api/metrics` | Code + local/CI tests | Current production response still requires a deployment-specific check; metrics are in-process in v1. |
| Vercel/Railway deployment path | `ADR-0018`, `.github/workflows/deploy-vercel.yml` | Configuration + CI path | Verify the current production URL, access policy, commit SHA, and database independently. |

## Partial

- Certificate endpoints: schema and routes exist; evidence is code/schema and route surface only until the complete PDF issue/download/revoke/verify flow is confirmed.
- Family/cultural dashboard presentation: current UI has family-oriented labels and static demonstration content; domain persistence is absent.
- Plugin architecture: built-in manifests and registry exist; third-party runtime installation is absent.
- Multi-tenancy: data scoping exists; operational onboarding, subdomain routing, and fully activated RLS boundary are not complete.
- Media/content: content types and media schema exist; production object storage and streaming are not wired.

## Planned / missing

- Family and family-member model
- Parent/child relationship and delegated access
- Campaigns and participation
- Competitions and submissions
- Events and trips
- Durable announcements and notifications
- Family activities and achievements
- Points/gamification, only if confirmed as a product requirement
- Learning paths
- Taxonomy, prerequisites, search, reporting, and advanced analytics
- Public registration and full role-management workflows
