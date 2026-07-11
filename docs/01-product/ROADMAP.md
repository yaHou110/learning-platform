# ROADMAP.md

> **Where we are going, in what order, and why.** Time horizons are honest estimates, not commitments.
> Statuses: `planned` / `in-progress` / `shipped` / `cut`.

---

## Time horizons

- **Now (0–3 months)**: documentation OS + first deployable skeleton.
- **Next (3–9 months)**: MVP — minimum usable product for the first tenant.
- **Later (9–18 months)**: multi-tenant beta + first 3 tenants.
- **Future (18+ months)**: plugin ecosystem + advanced features.

---

## Milestones

### M0 — AI Project OS v1.0 ✅ (shipped: 2026-07-10)

- ایجاد ساختار مستندات AI-native
- اتصال بین AGENTS.md و سایر فایل‌ها
- تصمیمات binding: no-WordPress, AI-native docs

### M1 — Stack Lock + Repo Bootstrap (Now → ~2026-08)

**هدف:** تکنولوژی fixed شده و یک `pnpm dev` قابل اجرا.

- [ ] ADR-0003 — Web framework
- [ ] ADR-0004 — Database
- [ ] ADR-0005 — Auth
- [ ] ADR-0006 — Plugin architecture
- [ ] `pnpm create` + initial scaffold
- [ ] CI pipeline (lint, test, build) — basic
- [ ] Hello world در production deploy

**Definition of done:** یک صفحه "Hello, Hawza" روی subdomain آزمایشی، با README درست.

### M2 — Multi-tenant + Auth MVP (~2026-09 → 2026-10)

**هدف:** کاربر می‌تواند ثبت‌نام کند، وارد شود، و tenant جدید ساخته شود.

- [ ] FR-001..008 (Auth)
- [ ] FR-050..052 (multi-tenant data isolation)
- [ ] پنل CenterAdmin حداقلی
- [ ] یک tenant نمونه (دمو) seed شده

**Definition of done:** یک CenterAdmin می‌تواند یک Teacher و یک Student اضافه کند، و Student می‌تواند وارد شود.

### M3 — Course Core (~2026-10 → 2026-12)

**هدف:** یک دوره واقعی ساخته، منتشر، و دیده شود.

- [ ] FR-010..018 (Course CRUD)
- [ ] FR-040, FR-041 (آپلود و پخش فایل)
- [ ] FR-080 (RTL + فارسی)
- [ ] یک دوره واقعی با ۵ درس آپلود شده

**Definition of done:** Student می‌تواند درس‌ها را ببیند و علامت «دیدم» بزند.

### M4 — Progress + Path (~2026-12 → 2027-02)

- [ ] FR-020..025 (Enrollment + progress)
- [ ] FR-030..032 (Learning path)
- [ ] گزارش پیشرفت برای Teacher
- [ ] پایلوت با مرکز اول

**Definition of done:** مرکز اول به‌صورت محدود (< 20 طلبه) استفاده می‌کند.

### M5 — Multi-tenant Beta + Onboarding (~2027-02 → 2027-04)

- [ ] subdomain اختصاصی (FR-053)
- [ ] onboarding یک tenant جدید در < 1 روز
- [ ] ۳ tenant فعال

**Definition of done:** ۳ مرکز فعال، ۵۰+ طلبه per tenant، Uptime ≥ 99.5%.

### M6 — Plugin System Hardening (~2027-04 → 2027-06)

- [ ] FR-060, FR-061
- [ ] مستندات API پلاگین
- [ ] ۲-۳ پلاگین built-in آماده (`core-certificates`، `core-progress`، `core-content`)

**Definition of done:** یک پلاگین جدید می‌تواند بدون تغییر هسته اضافه شود.

### M7 — v1.0 GA (~2027-06 → 2027-09)

- [ ] تمام MUST requirements تکمیل
- [ ] تمام SHOULD requirements بررسی شده (تأیید یا back-burner)
- [ ] مستندات استقرار (deployment) کامل
- [ ] Uptime و performance در SLA

**Definition of done:** اولین انتشار عمومی محدود.

---

## Back-burner (ایده‌هایی برای v2+)

- اپلیکیشن موبایل native
- پرداخت آنلاین
- سیستم آزمون پیچیده
- هوش مصنوعی مولد (رونویسی، خلاصه‌سازی، توصیه)
- پلاگین third-party
- Theme اختصاصی برای هر tenant
- چندزبانه (انگلیسی، عربی)
- API عمومی

---

## Anti-roadmap (چیزهایی که عمداً نمی‌سازیم)

- ❌ نسخه free برای استفاده عمومی
- ❌ marketplace برای پلاگین
- ❌ ابزار بازاریابی (email marketing، CRM)
- ❌ analytics پیچیده (Mixpanel, Amplitude) — حداقل Google Analytics یا Plausible کافی است

---

## Change policy

این فایل هر ماه یا با تغییر milestone بزرگ به‌روزرسانی می‌شود.
تغییرات جزئی (task-level) در `NEXT_SESSION.md` و `MASTER_HANDOFF.md` ثبت می‌شود، نه اینجا.
