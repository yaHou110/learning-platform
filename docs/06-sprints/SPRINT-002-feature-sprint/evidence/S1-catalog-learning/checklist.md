# S1 — Catalog & Learning API (SPRINT-002)

> Evidence for the first SPRINT-002 feature slice: the Catalog + Learning
> bounded-context API surface on top of the post-M7 schema foundation
> (PR #11: `courses`, `lessons`, `media_assets`, `enrollments`,
> `lesson_progress`).

## Checklist

| Item | Status |
| --- | --- |
| Definition of Ready | ✅ — spec-first: `docs/02-architecture/DATA_MODEL.md` + `BOUNDED_CONTEXTS.md` define tables/columns; manifests (`plugin-catalog`, `plugin-learning`) define the API surface; route-coverage governance test pins implemented→declared |
| Risk classification | MEDIUM (new authenticated API surface; no secrets; no migration; app-layer tenant isolation unchanged) |
| Tests (unit, DB-free) | ✅ — `packages/core/tests/catalog-learning-rules.test.ts` (8), `apps/web/tests/catalog-routes.test.ts` (20), `apps/web/tests/learning-routes.test.ts` (11) |
| Integration (real Postgres) | ✅ — `packages/core/scripts/verify-sprint2-integration.ts` → `output-integration.txt` (20/20 PASS) |
| Quality gates | ✅ — `pnpm verify` (lint + typecheck + test + build) green |
| Documentation | ✅ — this evidence + CHANGELOG + PROJECT_BACKLOG/PROJECT_STATE updated |
| Rollback | trivial — revert merge; routes are additive, no migration, no data migration |

## Scope delivered

- **`packages/core/src/api/catalog.ts`** — `catalog` module: `listCourses`,
  `getCourse`, `createCourse`, `updateCourse`, `publishCourse`, `listLessons`,
  `getLesson`, `createLesson` (+ pure `isCourseVisible`, `normalizeTitle`).
  Tenant-scoped WHERE everywhere, soft-delete aware, student-vs-admin
  visibility.
- **`packages/core/src/api/learning.ts`** — `learning` module: `listEnrollments`,
  `enroll` (idempotent, published-only for students), `recordProgress`
  (upsert, course-completion flip) (+ pure `isCourseCompleted`).
- **Routes** (all behind `requireRole`, rate-limited, observability envelope):
  `GET/POST /api/courses`, `GET/PATCH /api/courses/:id`,
  `POST /api/courses/:id/publish`, `GET /api/courses/:id/lessons`,
  `POST /api/lessons`, `GET /api/lessons/:id`, `GET/POST /api/enrollments`,
  `POST /api/lessons/:id/progress`.
- **`apps/web/src/lib/api-route.ts`** — shared route envelope (request id,
  metrics, logs, captureError) extracted so bounded-context routes get the
  M5 observability contract without per-file duplication.
- **`apps/web/src/lib/validation.ts`** — `parseQuery`/`parseBody` now surface
  Zod `issues` on the error result (routes reuse them in the response body).
- **Manifest** — `plugin-catalog` declares `GET /api/courses/:id/lessons`
  (implemented surface is fully claimed; route-coverage test green).

## Key behaviors pinned

1. Students/teachers only see `published` courses; admins also see
   `draft`/`archived` (management view). Soft-deleted rows never surface.
2. Enrollment is idempotent (unique index backed) and draft-gated by role.
3. Progress upserts per (enrollment, lesson); completing the last remaining
   lesson flips the enrollment to `completed` with `completed_at`.
4. Cross-tenant isolation verified against real Postgres (second tenant sees
   nothing).

## Out of scope (deliberate)

- `media_assets` API (object storage not wired in v1 — ADR-0010 proposed).
- Learning paths (`GET /api/paths`) — planned route, no schema yet.
- Events are declared in manifests but not emitted (no runtime bus in v1).
- UI (course cards / lesson list pages) — next slice.
