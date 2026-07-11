# PLUGIN_MATRIX.md

> **What each plugin in v1 does, what it depends on, and what it exposes.**
> Architectural decisions about the plugin system itself are in `SYSTEM_ARCHITECTURE.md §4`.
> This file is the *matrix* — for each plugin, the rows are: name, purpose, status, depends-on, exposes, consumes.

---

## Plugin system rules (binding)

1. هر پلاگین **یک package** در monorepo است (e.g. `plugins/core-courses/`).
2. هر پلاگین **یک manifest** دارد: `plugin.json` با `name`, `version`, `permissions`, `hooks`, `events`.
3. هسته (core) **نمی‌داند** پلاگین‌ها چه کار می‌کنند — فقط آن‌ها را load می‌کند.
4. پلاگین‌ها فقط از طریق **core API** با هسته صحبت می‌کنند (read-only by default).
5. پلاگین‌ها به **هم** فقط از طریق **event bus** coupling دارند.
6. هیچ پلاگینی **مستقیم** به DB جدول پلاگین دیگر وصل نمی‌شود.
7. فعال/غیرفعال‌سازی پلاگین نباید هسته را بشکند (graceful degradation).

---

## v1 built-in plugins

### `core`

**پلاگین ویژه: خود هسته. جزء پلاگین‌های قابل‌غیرفعالسازی نیست.**

- **purpose:** tenant resolution, auth, RBAC, event bus, plugin loader.
- **status:** built-in (always on).
- **depends on:** nothing.
- **exposes:** `auth`, `tenant`, `events`, `permissions`, `plugins`.
- **consumes:** nothing.

---

### `core-users`

- **purpose:** مدیریت کاربران، نقش‌ها، invitation.
- **status:** planned (M2).
- **depends on:** `core`.
- **exposes:**
  - `users.create`, `users.update`, `users.deactivate`
  - `users.assignRole`, `users.revokeRole`
  - `users.invite`
- **consumes (events):** `tenant.created` (→ bootstrap admin user).
- **consumes (hooks):** `auth.onLogin` (→ log to audit).
- **DB tables:** `users`, `user_roles`, `sessions`.

---

### `core-courses`

- **purpose:** CRUD دوره و درس.
- **status:** planned (M3).
- **depends on:** `core`, `core-users` (for `created_by`).
- **exposes:**
  - `courses.create`, `courses.update`, `courses.publish`, `courses.archive`
  - `lessons.create`, `lessons.update`, `lessons.reorder`
- **consumes (events):** `tenant.created` (→ seed example course).
- **emits (events):** `course.published`, `course.archived`, `lesson.created`.
- **DB tables:** `courses`, `lessons`.

---

### `core-content`

- **purpose:** آپلود، ذخیره، و serve فایل‌های media.
- **status:** planned (M3).
- **depends on:** `core`.
- **exposes:**
  - `media.upload(stream, mime, size)`
  - `media.getUrl(key)` (signed URL)
  - `media.delete(key)`
- **consumes (events):** `tenant.created` (→ create storage prefix).
- **DB tables:** `media_assets`.
- **External deps:** S3-compatible object storage (or local FS in dev).

---

### `core-progress`

- **purpose:** ثبت‌نام، پیشرفت، گزارش.
- **status:** planned (M4).
- **depends on:** `core`, `core-courses`, `core-users`.
- **exposes:**
  - `progress.enroll(user, course)`
  - `progress.markLessonStarted(enrollment, lesson)`
  - `progress.markLessonCompleted(enrollment, lesson)`
  - `progress.getCourseCompletion(enrollment)`
  - `progress.reportByCourse(course)` (for teachers)
- **consumes (events):** `course.published`, `lesson.created`.
- **emits (events):** `enrollment.completed`, `course.completed` (all lessons done).
- **DB tables:** `enrollments`, `lesson_progress`.

---

### `core-certificates`

- **purpose:** صدور گواهی PDF بعد از تکمیل دوره.
- **status:** draft (M6).
- **depends on:** `core`, `core-courses`, `core-progress`, `core-content` (for PDF storage).
- **exposes:**
  - `certificates.issue(user, course)`
  - `certificates.verify(verificationCode)`
- **consumes (events):** `course.completed` (→ issue cert).
- **DB tables:** `certificates`.

---

### `core-i18n`

- **purpose:** ابزار i18n، تقویم شمسی، RTL helpers.
- **status:** planned (M3).
- **depends on:** `core`.
- **exposes:** date/time formatting, number formatting, translation lookup.
- **consumes (events):** none.
- **DB tables:** none (in-memory or files).

---

## Plugin lifecycle (برای هر plugin)

```
boot
  → core: load plugin (read manifest, register hooks)
  → plugin: onTenantCreated (if any) for each existing tenant

per request
  → core: dispatch hooks
  → plugin: handle hooks

shutdown
  → core: call plugin.onShutdown (graceful)
  → DB: persist any state
```

---

## Future plugins (back-burner)

- `core-quiz` — آزمون ساده
- `core-discussion` — گفتگوی زیر درس
- `core-notifications` — email + push
- `core-payments` — پرداخت آنلاین
- `core-reports` — گزارش‌های مدیریتی پیشرفته
- `core-ai` — AI features (summarization, transcription)

---

## Anti-patterns (ممنوع)

- ❌ پلاگین که مستقیم به DB پلاگین دیگر query بزند.
- ❌ پلاگین که global state داشته باشد (به‌جز config).
- ❌ پلاگین که request را بلاک کند بدون timeout.
- ❌ پلاگین built-in که در M2 خاموش شود.
- ❌ Circular dependency بین پلاگین‌ها (از طریق events مجاز، از طریق direct call ممنوع).
