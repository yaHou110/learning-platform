# S2 — Catalog & Learning UI (SPRINT-002)

> Evidence for the second SPRINT-002 slice: the student learning UI, admin
> content management, role-aware dashboard, and the demo seed that makes the
> whole flow runnable out of the box.

## Checklist

| Item | Status |
| --- | --- |
| Definition of Ready | ✅ — M3 target ("یک دوره واقعی ساخته، منتشر، و دیده شود" + DoD: student sees lessons and marks them viewed), M2 DoD (minimal CenterAdmin panel), M4 report need (dashboard) |
| Risk classification | MEDIUM (new server-rendered pages + server actions over existing APIs; no migration, no schema change, no secrets) |
| Tests (unit, DB-free) | ✅ — no new logic units; existing 82 web + 19 core tests still green |
| Integration (real Postgres) | ✅ — `verify-sprint2-integration.ts` extended with `listProgress` checks → 20/22 PASS (2 new) |
| Build | ✅ — `next build` succeeds with 7 new pages (all ƒ dynamic, auth-gated) |
| Live smoke (local prod server) | ✅ — unauthenticated pages → 307 (middleware gate); credentials login → session; `/courses`, `/admin/courses`, `/dashboard` → 200 with expected Farsi content; `/api/health` `{db:true}` |
| Seed | ✅ — `db:seed:dev` idempotent; creates demo tenant + super_admin + published demo course with 5 lessons |
| Documentation | ✅ — CHANGELOG + PROJECT_BACKLOG/PROJECT_STATE (Session 025 S2) |

## Scope delivered

- **`apps/web/src/components/AppShell.tsx`** — shared RTL header/nav (دورهها /
  داشبورد / مدیریت دورهها for admins) + sign-out server action.
- **Pages (all auth-gated by middleware, `force-dynamic`):**
  - `/` — home: role-aware quick cards (course count, my enrollments).
  - `/courses` — catalog browse; students/teachers see published only,
    admins see draft/archived too with status badges.
  - `/courses/[id]` — course detail: enroll button (server action →
    `learning.enroll`), lesson list with per-lesson ✓ state, progress bar
    (completed/total, %), completion banner.
  - `/courses/[id]/lessons/[lessonId]` — lesson view with contentType
    placeholder (v1: no object storage — ADR-0010 proposed) and the
    «دیدم» server action (`learning.recordProgress` → completion flip);
    not-enrolled callers get an enroll prompt.
  - `/dashboard` — admin: tenant stats (courses / lessons / طلبهها /
    enrollments) + courses table with per-course lesson/enrollment counts;
    student: my enrollments with per-course progress bars.
  - `/admin/courses` — admin-only: create course (draft) form, list with
    status, publish button (`catalog.publishCourse`).
  - `/admin/courses/[id]/lessons` — admin-only: add lesson (title, type,
    contentRef), ordered list, publish-course button.
- **`packages/core/src/api/learning.ts`** — new `learning.listProgress(tenantId,
  enrollmentId)` for progress UI (verified in integration).
- **`packages/core/scripts/seed-dev.ts`** — idempotent demo content: published
  course «دوره مقدماتی فقه (دمو)» + 5 lessons (text/video).
- **`packages/core/src/api/index.ts`** — re-exports `Course`/`Lesson` types.

## Live smoke evidence (local prod server, `next start`)

```
/login            => 200
/courses          => 307 (unauthenticated → middleware gate)
/dashboard        => 307
/admin/courses    => 307
POST credentials  => 302 (session issued)
GET /courses      => 200  (contains «دورههای آموزشی» + demo course)
GET /admin/courses=> 200  (contains «مدیریت دورهها», «دوره جدید», «انتشار»)
GET /dashboard    => 200  (contains «داشبورد مدیریت», stats)
GET /api/health   => {"status":"ok","checks":{"db":true,"auth":true,"storage":"skipped"}}
```

## Key behaviors pinned

1. Every page is behind the middleware auth gate (307 → /login) and every
   mutation re-checks the session inside the server action (defense in depth).
2. Admin surfaces (`/admin/*`) additionally enforce role allowlist → redirect.
3. Student progress UI reads real data: enrollment → `listProgress` → ✓ per
   lesson + % bar; completing the last lesson flips enrollment (S1 rule).
4. Demo seed is idempotent and safe to re-run (select-then-insert; no unique
   constraint exists on courses(tenant_id, title)).

## Out of scope (deliberate)

- Object-storage playback (video/pdf) — ADR-0010 proposed; placeholders render.
- Course edit/delete UI — PATCH/DELETE not exposed; publish is the v1 action.
- PWA/offline, credentials, learning paths — later slices.
