# DATA_MODEL.md

> **The shape of the data.** Logical schema (not SQL DDL — that comes from migrations).
> Every tenant-scoped table has `tenant_id`. Every audit-relevant table has `created_at`, `updated_at`, `created_by`.

---

## Conventions

- **Primary keys**: UUID v7 (sortable + globally unique).
- **Timestamps**: `timestamptz` (UTC stored, displayed in Jalali in UI).
- **Soft delete**: `deleted_at` (nullable) — never `DELETE` from app layer.
- **Tenant scope**: `tenant_id uuid NOT NULL` + composite index.
- **Naming**: snake_case for columns, plural for table names.
- **Migrations**: forward-only, never edited after merge.

---

## Core tables (built-in)

### `tenants`

هر ردیف = یک مرکز.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| slug | text UNIQUE | `tehran`, `qom`, … |
| name | text | |
| config | jsonb | theme, limits, feature flags |
| status | enum(`active`,`suspended`,`archived`) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK → tenants | NULL only for super_admin |
| email | citext UNIQUE per tenant | |
| password_hash | text | argon2id |
| name | text | |
| locale | text default `fa` | |
| status | enum(`active`,`invited`,`suspended`) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz NULL | |

UNIQUE constraint: `(tenant_id, email)` — همان ایمیل می‌تواند در tenantهای مختلف باشد.

### `user_roles`

| Column | Type | Notes |
| --- | --- | --- |
| user_id | uuid FK | |
| tenant_id | uuid FK | |
| role | enum(`student`,`teacher`,`center_admin`,`super_admin`) | |
| granted_at | timestamptz | |
| granted_by | uuid FK → users | |

PK: `(user_id, tenant_id, role)`.

### `sessions`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | session token |
| user_id | uuid FK | |
| tenant_id | uuid FK | |
| user_agent | text | |
| ip | inet | |
| expires_at | timestamptz | |
| created_at | timestamptz | |

### `audit_log`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigserial PK | |
| tenant_id | uuid FK | |
| actor_user_id | uuid FK | |
| action | text | e.g. `course.published` |
| resource_type | text | e.g. `course` |
| resource_id | uuid | |
| before | jsonb | nullable |
| after | jsonb | nullable |
| ip | inet | |
| occurred_at | timestamptz | |

append-only — no updates, no deletes.

---

## Plugin tables (v1 built-ins)

### `core_courses` plugin

#### `courses`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| title | text | |
| description | text | |
| status | enum(`draft`,`published`,`archived`) | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz NULL | |

#### `lessons`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| course_id | uuid FK → courses | |
| title | text | |
| content_type | enum(`video`,`audio`,`pdf`,`text`) | |
| content_ref | text | URL or storage key |
| order_index | int | |
| duration_seconds | int NULL | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz NULL | |

### `core_content` plugin

#### `media_assets`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| storage_key | text | path in object storage |
| mime_type | text | |
| size_bytes | bigint | |
| checksum | text | sha256 |
| uploaded_by | uuid FK → users | |
| created_at | timestamptz | |

### `core_progress` plugin

#### `enrollments`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| user_id | uuid FK | |
| course_id | uuid FK | |
| status | enum(`active`,`completed`,`dropped`) | |
| enrolled_at | timestamptz | |
| completed_at | timestamptz NULL | |

UNIQUE: `(tenant_id, user_id, course_id)`.

#### `lesson_progress`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| enrollment_id | uuid FK → enrollments | |
| lesson_id | uuid FK | |
| status | enum(`started`,`completed`) | |
| last_position_seconds | int NULL | for resume |
| started_at | timestamptz | |
| completed_at | timestamptz NULL | |

UNIQUE: `(enrollment_id, lesson_id)`.

### `core_certificates` plugin (future)

#### `certificates`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| tenant_id | uuid FK | |
| user_id | uuid FK | |
| course_id | uuid FK | |
| issued_at | timestamptz | |
| pdf_storage_key | text | |
| verification_code | text UNIQUE | for QR |

---

## Indexes (minimum)

```sql
-- tenant scoping (every tenant-scoped table)
CREATE INDEX ON <table> (tenant_id);

-- lookups
CREATE UNIQUE INDEX ON users (tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX ON courses (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX ON lessons (course_id, order_index) WHERE deleted_at IS NULL;
CREATE INDEX ON enrollments (tenant_id, user_id);
CREATE INDEX ON lesson_progress (enrollment_id, lesson_id);

-- audit log (append-only, query by time)
CREATE INDEX ON audit_log (tenant_id, occurred_at DESC);
CREATE INDEX ON audit_log (resource_type, resource_id);
```

---

## Multi-tenant data isolation: enforcement

سه لایه:

1. **Application layer** — هر query builder به‌صورت پیش‌فرض `tenant_id` اضافه می‌کند (e.g. Drizzle/Prisma plugin یا middleware).
2. **Database layer** — RLS (Row-Level Security) policy در Postgres: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
3. **Test layer** — integration test که ثابت می‌کند tenant A نمی‌تواند ردیف tenant B را ببیند.

اگر یکی از این سه لایه bypass شود، دو لایه دیگر باید جلوی leak را بگیرند.

---

## Migrations

- ابزار: TBD (Drizzle Kit, Prisma Migrate, Knex, …)
- نام‌گذاری: `<timestamp>_<description>.sql` (e.g. `20260710120000_create_tenants.sql`)
- **append-only** — هیچ migration حذف یا ویرایش نمی‌شود بعد از merge.
- برای تغییر schema → migration جدید.

---

## Open questions

- آیا نیاز به table جدا برای `learning_paths` هست یا فقط view روی courses؟ (در `ROADMAP.md` M4 بررسی می‌شود.)
- آیا `audit_log` به hash-chain نیاز دارد؟ (v2 اگر لازم شد.)
- آیا soft delete کافی است یا hard delete (GDPR-like) هم لازم است؟ (بعداً بررسی می‌شود.)
