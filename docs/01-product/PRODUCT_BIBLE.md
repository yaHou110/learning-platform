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

A **structured, native, long-term learning platform** for Islamic seminary families.

The platform addresses:
- Scattered learning resources (booklets, audio, classes, books) with no unified view.
- No clear learning path per level (beginner, intermediate, advanced).
- No tool to track a student's progress over years.
- Dependency on external tools (YouTube, WordPress, Moodle) that are not designed for this audience or that take data ownership away.

We are building our own. It will be:
- **Native** — designed for the language, culture, and pedagogy.
- **Durable** — usable and maintainable 10 years from now.
- **Owned by us** — no dependency on a third-party platform.
- **Extensible** — every learning center can run its own customized instance.

### 2.1 Platform strategy — a reusable platform, not one-off custom software

The first deployment is for an Islamic seminary organization. The **long-term product strategy**, however, is to evolve this codebase into a **reusable learning platform** that can later be deployed for more than one organization. The first customer is a *first customer*, not the *only* customer.

Accordingly:

- The project is treated as a **product platform**, not a customer-specific build.
- **Reusable platform capabilities** belong to the shared core (authentication, authorization, user management, course engine, lesson engine, quiz engine, media management, certificates, notifications, audit logging, search, CMS, admin dashboard, APIs, shared UI components).
- **Customer-specific behavior** stays isolated where practical (branding, theme, logo, domain, organization terminology, custom workflows, reports, integrations, optional modules).
- **Configuration over hardcoding** is preferred wherever practical (feature flags, branding, localization, organization settings, permission mappings, optional modules).
- Customer names and customer-specific assumptions must **not** be embedded into shared code.

This does **not** require immediate implementation of full multi-tenancy, nor premature abstraction, large refactors, or rewrites of stable code. Changes are made only where they provide clear long-term value. This strategic direction is recorded as a binding decision in [ADR-0014](../05-decisions/ADR-0014-reusable-platform-vision.md).

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
- پشتیبانی از چندین tenant هم‌زمان در v1 — چندمستاجری واقعی به ADR-0008 موکول شده است؛ v1 به‌گونه‌ای طراحی می‌شود که مانع استفاده مجدد در آینده نشود (ADR-0014).

> **Clarification on SaaS (binding):** The "Out of scope" item about an *external* SaaS platform refers only to **depending on a third-party SaaS as our backend**. It does **not** mean the platform itself cannot later be offered as SaaS. Whether the product is deployed as SaaS, self-hosted, or managed hosting for future customers is a **deployment model** decision deferred to [ADR-0007](../05-decisions/DECISIONS.md). This Vision records only the *intent* that the architecture must not lock out those deployment targets (per ADR-0014).

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
- ❌ یک پروژه که با رفتن بنیان‌گذار، نگهداری‌اش متوقف شود. (این دلیل اصلی استفاده از Engineering Protocol است.)

### 7.1 Future customers (مشتریان آینده)

پلتفرم با هدف استفاده‌مجدد برای بیش از یک نوع سازمان طراحی می‌شود. نشانه‌ها (نه الزام):

- مؤسسات آموزشی (Educational institutes)
- دانشگاه‌ها (Universities)
- مدارس (Schools)
- سازمان‌های مذهبی (Religious organizations)
- NGOها و موسسات غیرانتفاعی
- آموزش شرکتی (Corporate training)
- مشتریان بین‌المللی (International customers)

مشتری اول (حوزه) معتبر و اولویت اصلی باقی می‌ماند. این لیست جهت‌گیری آینده است، طبق اصل #۶ (YAGNI) نباید به‌عنوان pretext برای premature abstraction استفاده شود.

### 7.2 Ownership and IP strategy (مالکیت و مالکیت فکری)

- **مالکیت پلتفرم قابل استفاده‌مجدد** در درازمدت با بنیان‌گذار/سازنده باقی می‌ماند.
- **سفارشی‌سازی‌های خاص مشتری** باید در صورت ممکن از پلتفرم جدا نگه داشته شوند (Customer Layer).
- این معماری از چند مدل تجاری پشتیبانی می‌کند: SaaS، deployments دارای لایسنس (Licensed)، Managed hosting، پیاده‌سازی خاص مشتری.
- **مالکیت و لایسنس واقعی** هر deployment همواره تابع قرارداد با مشتری است؛ این Vision فقط **قصد** را ثبت می‌کند.

### 7.3 Architectural anti-vision (جلوگیری از lock-in با آینده)

- ❌ جاسازی نام مشتری یا فرضیات خاص مشتری در کد مشترک.
- ❌ تصمیمات معماری که استفاده‌مجدد در آینده را بدون دلیل لازم سد می‌کنند.
- ❌ premature abstraction یا rewrite کد پایدار بدون ارزش روشن بلندمدت.

> _بخش‌های ۷.۱–۷.۳ **قصد استراتژیک بلندمدت** را ثبت می‌کنند، نه تعهدات قطعی برای هر مشتری. اجرای فنی هر تصمیم این بخش‌ها نیازمند ADR جداگانه است._

---

## 8. Change policy

این فایل فقط زمانی تغییر می‌کند که **خود محصول** عوض شود (vision, mission, scope, target users, success metrics).
تغییرات implementation، stack، یا timeline در فایل‌های مربوطه ثبت می‌شود.

هر تغییر در این فایل باید:
- در `PROJECT_HANDOVER.md` ثبت شود.
- اگر binding است، یک ADR جدید ایجاد کند.

> **تغییرات این سِشن (Session 019، 2026-07-16):** بخش‌های ۲.۱ (استراتژی پلتفرم)، ۴ (توضیح SaaS)، ۷.۳ (مشتریان آینده + IP)، و ۷.۵ (anti-vision معماری) اضافه شد. این یک تغییر **binding** در Vision است و توسط [ADR-0014](../05-decisions/ADR-0014-reusable-platform-vision.md) ثبت شده است.
