# SYSTEM_ARCHITECTURE.md

> **How the system is built.** High-level — deep dives go in `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
> This is the *first* architecture doc to read. Others are referenced from here.

---

## 1. Architectural style

- **Modular monolith** for v1 — یک deployable واحد، اما با boundaryهای واضح داخلی.
- **Plugin-based** — هسته کوچک، قابلیت‌ها به‌صورت پلاگین.
- **Multi-tenant** با shared database + tenant_id column (v1).
- **API-first** — هر عملکرد از طریق API قابل دسترسی است. UI یک client دیگر API است.

### چرا modular monolith (و نه microservice از روز اول)؟

- یک بنیان‌گذار تنها دارد. Microservice = overhead عملیاتی بالا.
- مرزهای plugin در داخل monolith می‌تواند بعداً به microservice تبدیل شود (اگر لازم شد).
- هزینه اولیه کمتر، توسعه سریع‌تر.

---

## 2. High-level diagram (متنی)

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (RTL)                        │
│                  Next.js / React app                     │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  API Gateway / App Server                │
│  ┌───────────────────────────────────────────────────┐   │
│  │                Core (هسته)                         │   │
│  │  • Tenant resolver                                │   │
│  │  • Auth (session/JWT)                             │   │
│  │  • Permission/RBAC                                │   │
│  │  • Event bus                                      │   │
│  │  • Plugin loader                                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ core-users   │ │ core-courses │ │ core-content │ ...  │
│  │  (plugin)    │ │  (plugin)    │ │  (plugin)    │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   PostgreSQL        │
                  │   (shared DB,       │
                  │    tenant_id col)   │
                  └─────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Object storage    │
                  │   (S3-compatible    │
                  │    for media)       │
                  └─────────────────────┘
```

---

## 3. Tenancy model

- **Strategy:** shared database, shared schema, `tenant_id` column on every tenant-scoped table.
- **Tenant identification:** subdomain (e.g. `tehran.lp.app`) in v1; custom domain in v2.
- **Isolation enforcement:** middleware در app server (هیچ query بدون `tenant_id` نباید اجرا شود).
- **Per-tenant config:** جدول `tenants.config` (JSONB) برای theme, limits, feature flags.

### چرا shared DB + tenant_id (و نه DB per tenant)؟

- هزینه operational پایین‌تر.
- Migration یک‌بار، نه N بار.
- برای v1 با چند tenant کافی است.
- اگر یک tenant بزرگ شد و نیاز به isolation بیشتر داشت، می‌توان آن tenant را به schema یا DB جدا منتقل کرد.

---

## 4. Plugin architecture (overview — details in PLUGIN_MATRIX.md)

هر پلاگین:
- یک **package** جدا (monorepo) است.
- یک **manifest** دارد (`plugin.json`): name, version, permissions, hooks.
- در **lifecycle** (boot, request, shutdown) هوک ثبت می‌کند.
- به **event bus** گوش می‌دهد.
- از **core APIs** (read-only by default) استفاده می‌کند.

**Rule:** پلاگین‌ها نمی‌توانند به DB مستقیم وصل شوند (به‌جز پلاگین‌های built-in معتمد). همه چیز از طریق core API.

---

## 5. Request lifecycle (یک request معمولی)

```
1. Browser → API request
2. API Gateway
   - Rate limit
   - Auth (if required)
   - Tenant resolver (از subdomain)
3. App server
   - Permission check (RBAC)
   - Route to plugin/handler
   - Plugin executes business logic
     - Reads from core API or own tables (with tenant_id)
     - Emits events (e.g. "course.published")
   - Returns response
4. Audit log (if data mutation)
5. Response → Browser
```

---

## 6. Data flow principles

- **No direct cross-plugin DB reads.** هر پلاگین فقط به جدول‌های خودش + core API.
- **Events** برای coupling ضعیف (e.g. `course.published` → `progress` plugin گوش می‌دهد).
- **Idempotency** برای عملیات حساس (publish, certificate generation).

---

## 7. Security architecture (overview — details in PERMISSION_MATRIX.md + a future SECURITY.md)

- HTTPS only (HSTS).
- Passwords: argon2id (never MD5/SHA1/bcrypt-only).
- Session: httpOnly + Secure + SameSite=Strict cookie.
- CSRF: double-submit cookie یا origin check.
- Input validation: zod (TypeScript) یا equivalent.
- SQL: فقط parameterized queries.
- Secrets: env vars (never committed).
- Per-tenant data: enforced at query layer (see §3).
- Audit log: append-only, tamper-evident (later: hash chain).

---

## 8. Frontend architecture (overview)

- **Framework**: TBD (see ADR-0003).
- **State**: server-first (no Redux for v1). Server components + minimal client state.
- **Styling**: utility-first (Tailwind) + shadcn/ui or equivalent headless components.
- **i18n**: Farsi primary, RTL. Other languages are config-only in v1.
- **Forms**: react-hook-form + zod resolver.

---

## 9. Deployment topology

- **v1**: single VPS (or single container host) — app + DB + object storage.
- **CI/CD**: GitHub Actions → build → push image → deploy.
- **Backups**: daily DB snapshot + 30-day retention.
- **CDN**: in front of static assets and (later) media.

> Detailed deployment plan is in `docs/07-deployment/` (not yet created — see M1 in `ROADMAP.md`).

---

## 10. What this file is NOT

- ❌ Not a database schema (that's `DATA_MODEL.md`).
- ❌ Not a plugin spec (that's `PLUGIN_MATRIX.md`).
- ❌ Not an auth spec (that's `PERMISSION_MATRIX.md` + future `SECURITY.md`).
- ❌ Not a tech stack decision (that's `TECH_STACK.md` + ADRs).

This file is the **map**. Other files are the territory.
