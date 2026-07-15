# PERMISSION_MATRIX.md

> **Who can do what.** RBAC matrix for v1.
> Roles × actions × resources. If something is not in this matrix, the action is denied by default.

---

## Roles (v1)

| Role | Description | Scope |
| --- | --- | --- |
| `super_admin` | مالک محصول | all tenants |
| `center_admin` | مدیر یک مرکز | one tenant |
| `teacher` | استاد/مدرس | one tenant |
| `student` | طلبه | one tenant |
| `parent` | والدین (دسترسی فقط‌خواندنی محدود) | one tenant |

هر کاربر **می‌تواند** چند نقش داشته باشد (e.g. هم `teacher` و هم `center_admin`).
`super_admin` فقط در سطح سیستم (across tenants) تعریف می‌شود.

---

## Actions (canonical list)

برای ثبات، actionها با `verb.resource` نام‌گذاری می‌شوند.

- `read.user` / `update.user` / `deactivate.user` / `invite.user`
- `assign.role` / `revoke.role`
- `read.course` / `create.course` / `update.course` / `publish.course` / `archive.course`
- `read.lesson` / `create.lesson` / `update.lesson` / `reorder.lesson` / `delete.lesson`
- `read.enrollment` / `create.enrollment` / `drop.enrollment`
- `read.lesson_progress` / `update.lesson_progress` (own / all)
- `read.certificate` / `issue.certificate` / `verify.certificate`
- `read.audit_log` (center_admin: own tenant; super_admin: all)
- `manage.tenant` (create/suspend/archive) — only `super_admin`
- `manage.plugins` (enable/disable) — only `super_admin`
- `read.parent_view` — for `parent` role

---

## Permission matrix

علامت‌ها:
- ✅ = allowed
- 🔒 = allowed only on **own** resource (e.g. own enrollment)
- ❌ = denied
- ⚠️ = conditional (see notes)

| Action | super_admin | center_admin | teacher | student | parent |
| --- | --- | --- | --- | --- | --- |
| `read.user` (any in tenant) | ✅ all tenants | ✅ own tenant | ✅ own tenant (limited fields) | 🔒 own profile | 🔒 linked student |
| `update.user` | ✅ all | ✅ own tenant | 🔒 own | 🔒 own | ❌ |
| `deactivate.user` | ✅ all | ✅ own tenant | ❌ | ❌ | ❌ |
| `invite.user` | ✅ all | ✅ own tenant | ⚠️ invite teacher (M4+) | ❌ | ❌ |
| `assign.role` | ✅ all | ✅ own tenant (except super_admin) | ❌ | ❌ | ❌ |
| `revoke.role` | ✅ all | ✅ own tenant | ❌ | ❌ | ❌ |
| `read.course` | ✅ all | ✅ own tenant | ✅ own tenant | ✅ own tenant (published only) | ❌ |
| `create.course` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `update.course` | ✅ | ✅ | 🔒 own | ❌ | ❌ |
| `publish.course` | ✅ | ✅ | 🔒 own | ❌ | ❌ |
| `archive.course` | ✅ | ✅ | 🔒 own | ❌ | ❌ |
| `read.lesson` | ✅ | ✅ | ✅ | ✅ (enrolled) | ❌ |
| `create.lesson` | ✅ | ✅ | 🔒 own courses | ❌ | ❌ |
| `update.lesson` | ✅ | ✅ | 🔒 own courses | ❌ | ❌ |
| `reorder.lesson` | ✅ | ✅ | 🔒 own courses | ❌ | ❌ |
| `delete.lesson` | ✅ | ✅ | 🔒 own courses | ❌ | ❌ |
| `read.enrollment` | ✅ | ✅ own tenant | ✅ own courses (roster) | 🔒 own | 🔒 linked student |
| `create.enrollment` | ✅ | ✅ | ⚠️ own courses (if enabled) | 🔒 self-enroll (if allowed) | ❌ |
| `drop.enrollment` | ✅ | ✅ | ❌ | 🔒 own | ❌ |
| `read.lesson_progress` | ✅ | ✅ own tenant | ✅ own courses | 🔒 own | 🔒 linked student |
| `update.lesson_progress` | ❌ | ❌ | ❌ | 🔒 own | ❌ |
| `read.certificate` | ✅ | ✅ | ✅ own courses | 🔒 own | 🔒 linked student |
| `issue.certificate` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `verify.certificate` | ✅ (any) | ✅ (own tenant) | ✅ (own courses) | 🔒 own | 🔒 linked |
| `read.audit_log` | ✅ all | ✅ own tenant | ❌ | ❌ | ❌ |
| `manage.tenant` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `manage.plugins` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `read.parent_view` | n/a | n/a | n/a | n/a | 🔒 linked student only |

---

## Resource ownership (برای 🔒)

وقتی یک نقش فقط روی resourceهای «خودش» دسترسی دارد، تعریف «خودش»:

| Resource | Owner |
| --- | --- |
| `course` | `created_by` |
| `lesson` | parent course's `created_by` |
| `enrollment` | `user_id` |
| `lesson_progress` | parent enrollment's `user_id` |
| `certificate` | `user_id` |
| `media_asset` | `uploaded_by` |

---

## Edge cases

### Student wants to enroll in a course

- اگر course `enrollment_policy = self` → `student` می‌تواند `create.enrollment` کند.
- اگر course `enrollment_policy = admin` → فقط `center_admin` یا `teacher` می‌تواند.
- پیش‌فرض v1: `admin` (ایمن‌تر).

### Teacher leaves a center

- دوره‌های او: `created_by` تغییر نمی‌کند (history حفظ شود).
- دسترسی او به `update.course` و `update.lesson` به `center_admin` منتقل می‌شود.
- تصمیم: soft-revoke + reassign prompt به center_admin.

### Parent wants to see a child's data

- فقط student linked شده (از طریق `parent_links` table — M5).
- فقط summary view (پیشرفت کلی، نه محتوای درس).
- Parent نمی‌تواند progress را تغییر دهد.

---

## Open questions

- آیا teacher می‌تواند student را enroll کند؟ (فعلاً ❌؛ بعداً بررسی می‌شود.)
- آیا center_admin می‌تواند teacher را suspend کند؟ (فعلاً ❌؛ در M5 بررسی می‌شود.)
- آیا student می‌تواند teacher یک دوره را rate کند؟ (v2.)

---

## Implementation notes

- Permission check در **middleware** قبل از handler.
- هیچ business logic بدون check.
- Deny by default — اگر action در این ماتریس نیست، ❌.
- در کد: یک helper مثل `can(user, action, resource?)` که به policy object map می‌شود.
- Audit log برای denyهای حساس (مثل `manage.tenant` fail).
