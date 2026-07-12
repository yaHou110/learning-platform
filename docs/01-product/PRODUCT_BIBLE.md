# PRODUCT_BIBLE.md

> **The single source of truth for *what* we are building and *why*.** If something is not here, it is not a product fact.
> Update only when the *product itself* changes, not when implementation details change.

---

## 1. Vision (فارسی)

یک **پلتفرم یادگیری ساختاریافته، بومی و بلندمدت** برای خانواده‌های حوزوی.

خانواده حوزوی امروز با چند مشکل همزمان روبرو است:
- منابع پراکنده (جزوه، فایل صوتی، کلاس، کتاب) که هیچ‌جا کنار هم قرار نمی‌گیرند.
- نبود یک مسیر یادگیری روشن برای هر سطح (مقدماتی، متوسط، پیشرفته).
- نبود ابزاری که بتواند پیشرفت طلبه را در طول سال‌ها دنبال کند.
- وابستگی به ابزارهای خارجی (YouTube، WordPress، Moodle) که یا برای این مخاطب طراحی نشده‌اند، یا مالکیت داده را از ما می‌گیرند.

ما ابزار خودمان را می‌سازیم. ابزاری که:
- **بومی** است — با زبان، فرهنگ و ساختار آموزشی حوزه طراحی شده.
- **پایدار** است — ۱۰ سال بعد هم قابل استفاده و قابل نگهداری باشد.
- **متعلق به خود ماست** — بدون وابستگی به پلتفرم خارجی.
- **قابل توسعه** است — هر مرکز حوزوی بتواند نسخه سفارشی خودش را داشته باشد.

## 2. Vision (English, summary)

A **structured, native, long-term learning platform** for Hawza (Islamic seminary) families.

The platform addresses:
- Scattered learning resources (booklets, audio, classes, books) with no unified view.
- No clear learning path per level (beginner, intermediate, advanced).
- No tool to track a student's progress over years.
- Dependency on external tools (YouTube, WordPress, Moodle) that are not designed for this audience or that take data ownership away.

We are building our own. It will be:
- **Native** — designed for Hawza's language, culture, and pedagogy.
- **Durable** — usable and maintainable 10 years from now.
- **Owned by us** — no dependency on a third-party platform.
- **Extensible** — every Hawza center can run its own customized instance.

---

## 3. Mission (چرا این محصول، چرا حالا)

- **چرا محصول**: خانواده‌های حوزوی ابزار آموزشی اختصاصی ندارند. هر چه هست، وصله‌پینه‌ای از ابزارهای عمومی است.
- **چرا حالا**: هزینه ساخت یک پلتفرم یادگیری سفارشی به‌خاطر فریم‌ورک‌های مدرن و زیرساخت ابری، در ۵ سال گذشته ۱۰ برابر کمتر شده. این پنجره باز است.
- **چرا خودمان**: هیچ پلتفرم آماده‌ای نیازهای ما (محتوای حوزوی، زبان فارسی، ساختار طلبگی، چندمرکزی) را یکجا پوشش نمی‌دهد.

---

## 4. Scope (چه چیزی هست، چه چیزی نیست)

### In scope (v1)

- مدیریت دوره‌ها (Course management).
- مسیر یادگیری (Learning path) برای سطوح مختلف.
- پروفایل طلبه + پیشرفت (Progress tracking).
- سیستم پلاگین برای افزودن قابلیت‌های جدید بدون تغییر هسته.
- چندمرکزی (Multi-tenant) — هر مرکز حوزوی یک tenant.
- احراز هویت ساده (ایمیل + رمز، با امکان اضافه کردن پیامک بعداً).
- پنل ادمین برای مدیر مرکز.

### Out of scope (v1)

- پرداخت آنلاین (Payment) — اضافه می‌شود ولی نه در v1.
- اپلیکیشن موبایل native — فقط وب ریسپانسیو.
- سیستم آزمون آنلاین پیچیده — فقط آزمون ساده چندگزینه‌ای.
- پشتیبانی از زبان‌های غیر از فارسی.
- هوش مصنوعی مولد برای تولید محتوا — این قابلیت در roadmap بلندمدت است.

### Never (تصمیمات دائمی)

- ❌ استفاده از WordPress به‌عنوان CMS — `ADR-0001`.
- ❌ وابستگی به یک پلتفرم SaaS خارجی به‌عنوان backend اصلی.
- ❌ ذخیره محتوای اصلی در سرویس‌های third-party (S3 اختصاصی یا self-hosted اولویت دارد).

---

## 5. Target users (خلاصه — جزئیات در PERSONAS.md)

| Persona | توضیح کوتاه |
| --- | --- |
| **Student (Talabeh)** | طلبه‌ای که می‌خواهد مسیر یادگیری‌اش را دنبال کند. |
| **Teacher (Ostad)** | استاد یا مدرس که دوره یا محتوا تولید می‌کند. |
| **Center Admin (Modir-e Markaz)** | مدیر مرکز حوزوی که tenant را مدیریت می‌کند. |
| **Super Admin** | مالک محصول — دسترسی به همه tenantها. |
| **Parent (والدین)** | اختیاری — والدینی که پیشرفت فرزندشان را می‌بینند. |

جزئیات، نیازها و user journey هر persona در `PERSONAS.md`.

---

## 6. Success metrics (موفقیت چگونه سنجیده می‌شود)

| Metric | Target (12 ماه اول) |
| --- | --- |
| تعداد مراکز فعال (active tenants) | ۳ |
| تعداد طلبه‌های ثبت‌نام‌شده (per tenant) | ۵۰+ |
| نرخ تکمیل دوره (course completion) | ۳۰٪+ |
| Uptime | ۹۹.۵٪ |
| زمان پاسخ API p95 | < ۵۰۰ms |
| زمان متوسط onboarding یک tenant جدید | < ۱ روز |

---

## 7. Anti-vision (چه نمی‌خواهیم بشویم)

- ❌ یک LMS عمومی مثل Moodle که فقط skin حوزوی روی آن است.
- ❌ یک اپ بسته که فقط روی یک مرکز خاص کار می‌کند.
- ❌ یک محصول که برای کار کردن به اینترنت پرسرعت و ابزارهای خارجی وابسته باشد.
- ❌ یک پروژه که با رفتن بنیان‌گذار، نگهداری‌اش متوقف شود. (این دلیل اصلی استفاده از AI Project OS است.)

---

## 8. Change policy

این فایل فقط زمانی تغییر می‌کند که **خود محصول** عوض شود (vision, mission, scope, target users, success metrics).
تغییرات implementation، stack، یا timeline در فایل‌های مربوطه ثبت می‌شود.

هر تغییر در این فایل باید:
- در `PROJECT_HANDOVER.md` ثبت شود.
- اگر binding است، یک ADR جدید ایجاد کند.
