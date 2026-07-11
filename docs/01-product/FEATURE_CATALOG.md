# FEATURE_CATALOG.md

> **Every feature in one place.** Each feature has an ID, a status, and a link to the requirements it implements.
> Update this file *together with* `REQUIREMENTS.md` and `ROADMAP.md`. They are three views of the same data.

---

## Status legend

- `draft` — ایده هنوز قطعی نشده.
- `planned` — در roadmap است، هنوز شروع نشده.
- `in-progress` — در حال ساخت.
- `beta` — آماده برای آزمایش محدود.
- `shipped` — در production.
- `dropped` — منتفی شده (با دلیل).

---

## Features by capability

### Auth & user

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-AUTH-01 | ثبت‌نام ایمیلی | planned | FR-001 | ساده، با rate limit |
| F-AUTH-02 | ورود | planned | FR-002 | JWT + refresh token |
| F-AUTH-03 | بازیابی رمز | planned | FR-003 | token یکبار مصرف |
| F-AUTH-04 | تایید ایمیل | planned | FR-005 | لینک تایید ۲۴ ساعته |
| F-AUTH-05 | ورود با OTP پیامکی | dropped | FR-006 | به v2 موکول شد (هزینه SMS در ایران) |
| F-AUTH-06 | مدیریت نقش‌ها | planned | FR-007, FR-008 | RBAC ساده |

### Course

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-CRS-01 | CRUD دوره | planned | FR-010..012 | |
| F-CRS-02 | CRUD درس | planned | FR-013, FR-014 | ترتیب با drag-drop |
| F-CRS-03 | پلیر ویدئو/صوت | planned | FR-041 | HTML5 native |
| F-CRS-04 | نمایش PDF | planned | FR-040 | embed viewer |
| F-CRS-05 | پیش‌نیاز | draft | FR-016 | الگوریتم ساده |
| F-CRS-06 | دسته/برچسب | planned | FR-017 | taxonomy ساده |

### Progress

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-PRG-01 | ثبت‌نام در دوره | planned | FR-020 | |
| F-PRG-02 | ثبت پیشرفت | planned | FR-021 | heartbeat هر ۱۰ ثانیه |
| F-PRG-03 | نمایش درصد | planned | FR-022 | |
| F-PRG-04 | گزارش پیشرفت | planned | FR-023 | CSV export |
| F-PRG-05 | گواهی PDF | draft | FR-024 | ساده با qr code |

### Path

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-PTH-01 | تعریف مسیر | planned | FR-030 | sequence of courses |
| F-PTH-02 | قفل مرحله بعدی | draft | FR-032 | فقط بعد از تکمیل |

### Content

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-CTN-01 | آپلود فایل | planned | FR-040 | S3-compatible (later: local fs) |
| F-CTN-02 | پخش استریم | planned | FR-041 | range requests |
| F-CTN-03 | رونویسی AI | dropped | FR-043 | نیاز به GPU؛ v2 |

### Multi-tenant

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-MT-01 | تفکیک داده | planned | FR-050..052 | shared DB, tenant_id column |
| F-MT-02 | subdomain اختصاصی | draft | FR-053 | wildcard DNS |
| F-MT-03 | theme اختصاصی | dropped | FR-054 | v2 |

### Plugin

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-PLG-01 | معماری پلاگین | planned | FR-060 | v1 ساده: monorepo + manifest |
| F-PLG-02 | فعال/غیرفعال‌سازی | planned | FR-061 | |
| F-PLG-03 | نصب third-party | dropped | FR-062 | v2 — security risk |

### Admin

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-ADM-01 | پنل CenterAdmin | planned | FR-070 | |
| F-ADM-02 | پنل SuperAdmin | planned | FR-071 | |
| F-ADM-03 | Audit log | planned | FR-072 | append-only table |

### i18n

| ID | Feature | Status | Implements | Notes |
| --- | --- | --- | --- | --- |
| F-I18-01 | رابط فارسی RTL | planned | FR-080 | i18n-ready code |
| F-I18-02 | تقویم شمسی | draft | FR-081 | moment-jalaali یا dayjs + plugin |

---

## Plugins (v1 — built-in)

| Plugin | Purpose | Status | Depends on |
| --- | --- | --- | --- |
| `core-courses` | منطق دوره‌ها | planned | none |
| `core-users` | منطق کاربران | planned | none |
| `core-content` | آپلود و پخش فایل | planned | `core-courses` |
| `core-progress` | ردگیری پیشرفت | draft | `core-courses` |
| `core-certificates` | گواهی PDF | draft | `core-progress` |

جزئیات معماری پلاگین در `docs/02-architecture/PLUGIN_MATRIX.md`.

---

## Backlog (raw, unsorted)

ایده‌هایی که هنوز به feature رسمی تبدیل نشده‌اند:

- سیستم آزمون (Quiz) ساده
- بحث و گفتگو (Discussion) زیر هر درس
- اعلان (Notification) — ایمیل + push
- گزارش سالانه برای والدین
- اتصال به تقویم آموزشی مرکز
- پشتیبانی از محتوای تعاملی (H5P-style)
- API عمومی برای اتصال به اپ‌های دیگر

برای ارتقا از backlog به feature رسمی، از `templates/FEATURE_REQUEST.md` استفاده کنید.
