# REQUIREMENTS.md

> **Functional + non-functional requirements.** Derived from `PRODUCT_BIBLE.md`. Source of truth for *what the system must do*.
> Format: MoSCoW (Must / Should / Could / Won't). Each requirement has a stable ID.

---

## How to use this file

- **MUST** — بدون این، محصول شکست می‌خورد.
- **SHOULD** — مهم است ولی نسخه اول بدون آن هم منتشر می‌شود.
- **COULD** — خوب است اگر وقت شد.
- **WON'T (v1)** — عمداً در v1 نیست (برای جلوگیری از drift scope).

هر requirement یک ID دارد: `FR-<n>` (functional) یا `NFR-<n>` (non-functional).
این IDها در `FEATURE_CATALOG.md`، تست‌ها و PRها استناد می‌شوند.

---

## Functional requirements

### Authentication & user management

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-001 | MUST | ثبت‌نام با ایمیل و رمز عبور |
| FR-002 | MUST | ورود با ایمیل و رمز عبور |
| FR-003 | MUST | بازیابی رمز عبور از طریق ایمیل |
| FR-004 | MUST | خروج (logout) |
| FR-005 | SHOULD | تایید ایمیل بعد از ثبت‌نام |
| FR-006 | SHOULD | ورود با OTP پیامکی (بعداً) |
| FR-007 | MUST | تفکیک نقش‌ها: Student, Teacher, CenterAdmin, SuperAdmin (جزئیات در `PERMISSION_MATRIX.md`) |
| FR-008 | MUST | امکان اختصاص نقش به یک کاربر توسط CenterAdmin |

### Course management

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-010 | MUST | ایجاد دوره توسط Teacher یا CenterAdmin |
| FR-011 | MUST | ویرایش دوره (محدود به سازنده + admins) |
| FR-012 | MUST | انتشار/عدم انتشار دوره |
| FR-013 | MUST | افزودن درس (lesson) به دوره (متن، ویدئو، فایل صوتی، PDF) |
| FR-014 | MUST | ترتیب درس‌ها (ordering) |
| FR-015 | MUST | نمایش دوره به Student ثبت‌نام‌شده |
| FR-016 | SHOULD | پیش‌نیاز (prerequisite) بین درس‌ها و دوره‌ها |
| FR-017 | SHOULD | دسته‌بندی و برچسب‌گذاری دوره‌ها |
| FR-018 | COULD | دوره‌های ترکیبی (blended) — ترکیب آنلاین و آفلاین |

### Enrollment & progress

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-020 | MUST | ثبت‌نام Student در دوره (توسط خودش یا admin) |
| FR-021 | MUST | ثبت پیشرفت در درس (started, completed) |
| FR-022 | MUST | نمایش درصد پیشرفت دوره به Student |
| FR-023 | MUST | گزارش پیشرفت به Teacher/CenterAdmin |
| FR-024 | SHOULD | گواهی (certificate) پایان دوره (PDF) |
| FR-025 | COULD | یادآوری (reminder) برای درس‌های ناتمام |

### Learning path

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-030 | MUST | تعریف مسیر یادگیری (مجموعه دوره‌ها به ترتیب) |
| FR-031 | MUST | اختصاص مسیر به سطح (مقدماتی/متوسط/پیشرفته) |
| FR-032 | SHOULD | قفل‌شدن دوره بعدی تا تکمیل دوره قبلی |
| FR-033 | COULD | مسیر یادگیری شخصی‌سازی‌شده (adaptive) |

### Content

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-040 | MUST | آپلود فایل (PDF، صوتی، تصویری) — محدودیت حجم: ۲۰۰MB |
| FR-041 | MUST | پخش آنلاین ویدئو و صوت (streaming) |
| FR-042 | SHOULD | متن همراه ویدئو (transcript) |
| FR-043 | COULD | رونویسی خودکار صوت/ویدئو (AI) — roadmap |

### Multi-tenancy

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-050 | MUST | هر CenterAdmin فقط به tenant خودش دسترسی دارد |
| FR-051 | MUST | SuperAdmin به همه tenantها دسترسی دارد |
| FR-052 | MUST | داده‌های هر tenant کاملاً جدا (data isolation) |
| FR-053 | SHOULD | subdomain اختصاصی برای هر tenant (مثلاً `tehran.hawza.app`) |
| FR-054 | COULD | theme اختصاصی برای هر tenant (لوگو، رنگ) |

### Plugin system

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-060 | MUST | معماری پلاگین (جزئیات در `PLUGIN_MATRIX.md` و `SYSTEM_ARCHITECTURE.md`) |
| FR-061 | MUST | فعال/غیرفعال‌سازی پلاگین توسط SuperAdmin (v1 فقط ۲-۳ پلاگین داخلی) |
| FR-062 | COULD | نصب پلاگین شخص ثالث (v2) |

### Admin

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-070 | MUST | پنل ادمین برای CenterAdmin (مدیریت کاربران، دوره‌ها) |
| FR-071 | MUST | پنل SuperAdmin (مدیریت tenantها، پلاگین‌ها) |
| FR-072 | SHOULD | لاگ فعالیت‌ها (audit log) |

### Internationalization (i18n)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-080 | MUST | رابط کاربری کاملاً فارسی (RTL) |
| FR-081 | SHOULD | پشتیبانی از تقویم شمسی (Jalali) |
| FR-082 | WON'T v1 | زبان دوم (انگلیسی/عربی) — فقط ساختار i18n آماده باشد |

---

## Non-functional requirements

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-001 | MUST | Uptime ≥ 99.5% |
| NFR-002 | MUST | p95 API response < 500ms |
| NFR-003 | MUST | First Contentful Paint < 2s روی 3G |
| NFR-004 | MUST | تمام داده‌های حساس encrypted at rest |
| NFR-005 | MUST | HTTPS only (HSTS) |
| NFR-006 | MUST | رعایت GDPR-equivalent ایرانی (اصول حفاظت داده) |
| NFR-007 | MUST | Backup خودکار روزانه + نگهداری ۳۰ روز |
| NFR-008 | MUST | لاگ تمام تغییرات داده‌ای (audit) |
| NFR-009 | SHOULD | قابلیت اجرا روی VPS ارزان (≤ ۴GB RAM) |
| NFR-010 | SHOULD | CI/CD کامل (lint, test, build, deploy) |
| NFR-011 | SHOULD | Test coverage ≥ 70% برای منطق تجاری |
| NFR-012 | COULD | قابلیت اجرای air-gapped (بدون اتصال اینترنت عمومی) |

---

## Open questions

سؤالاتی که هنوز جواب ندارند و در `PROJECT_STATE.md` ثبت شده‌اند، در این فایل **تغییر** ایجاد نمی‌کنند. وقتی جواب داده شدند، requirements مربوطه به‌روزرسانی می‌شود.
