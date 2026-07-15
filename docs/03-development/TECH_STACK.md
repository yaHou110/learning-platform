# TECH_STACK.md

> **The chosen technologies and why.** Each major choice is backed by a dedicated ADR.
> This file is the quick-reference; for the *why*, read the ADR.

> Last updated: 2026-07-11 (after ADR-0003..0006 Accepted)

---

## Status

✅ **v1.1 — Core stack locked.** Open: object storage, background jobs, email, observability tooling details (no ADR yet; defer to implementation phase or to ADR-0007/0009/0010).

---

## Locked choices

### Language & runtime

- **Choice:** TypeScript 5.x with `strict: true`
- **Version:** TS 5.4+
- **Runtime:** Node.js 20 LTS
- **Why:** Strong typing end-to-end (required by plugin-typing story, ADR-0006). Node 20 LTS is the supported runtime for Next.js 15 (ADR-0003).
- **Trade-offs:** Slightly slower cold start than a Go/Rust binary; acceptable for our SLO.
- **Migration cost (6 months):** low (within the TS/Node major line).
- **ADR:** ADR-0003

### Web framework (frontend + backend)

- **Choice:** Next.js 15 (App Router)
- **Version:** 15.x
- **Why:** One runtime for UI + API; RSC for server-first rendering; mature TypeScript story; fits the 4 GB VPS modular-monolith target.
- **Trade-offs:** Opinionated; App Router is newer than Pages Router and a few libs lag.
- **Migration cost (6 months):** medium (within Next.js 15 → 16 once the latter ships).
- **ADR:** ADR-0003

### Database

- **Choice:** PostgreSQL 16 with Drizzle ORM
- **Version:** PG 16, drizzle-orm latest, drizzle-kit latest
- **Why:** Self-hostable, license-clean, mature multi-tenant story (RLS), `jsonb` for plugin metadata, small Drizzle runtime.
- **Trade-offs:** Drizzle younger than Prisma; some advanced queries require raw SQL. Single primary is a SPOF for v1 — accepted within the 99.5% SLO.
- **Migration cost (6 months):** low (PG major is stable; Drizzle is additive).
- **Vector DB:** **none in v1** (AI out of scope per `MVP_SCOPE.md`; will get its own ADR when needed).
- **ADR:** ADR-0004

### Auth

- **Choice:** Auth.js (NextAuth) v5 — Credentials provider, bcrypt (cost 12), server-side sessions in Postgres via `@auth/drizzle-adapter`
- **Why:** OSS, self-hostable, official Drizzle adapter, httpOnly+secure session cookies out of the box.
- **Trade-offs:** Credentials provider has more attack surface than OAuth-only; we mitigate with bcrypt + httpOnly cookies + CSRF + rate limits.
- **Migration cost (6 months):** low (additive providers; bounded by Auth.js v5 API).
- **ADR:** ADR-0005

### Plugin architecture

- **Choice:** pnpm 9 workspaces monorepo, internal compile-time plugins with typed Zod manifest
- **Layout:** `apps/web` (Next.js), `packages/core` (DB + auth + plugin registry), `packages/contracts` (shared types), `packages/plugins/*` (one per bounded context)
- **Plugin rule:** plugins may not import `drizzle-orm` or `pg` — enforced by ESLint `no-restricted-imports`.
- **Why:** Real package boundaries, no runtime loading, no marketplace (per principles #7, #9). Build-time errors catch most misuse.
- **Trade-offs:** Every plugin change recompiles `web`. We accept this — it is the cost of compile-time safety.
- **Migration cost (6 months):** low (additive plugins, no DB DDL coupling).
- **ADR:** ADR-0006

### UI / styling

- **Choice:** Tailwind CSS + shadcn/ui (Radix primitives) + Lucide icons + react-hook-form + Zod
- **Why:** Tailwind is the de-facto utility-first CSS in the Next.js ecosystem. shadcn/ui gives accessible Radix primitives without locking us into a component library runtime. Zod is already pulled in by the plugin manifest (ADR-0006), so reusing it for forms is free.
- **Trade-offs:** Tailwind class soup on complex UIs; mitigated by shadcn/ui patterns and our own component layer.
- **Migration cost (6 months):** low.
- **ADR:** *(none — derived from ADR-0003 ecosystem and ADR-0006 Zod usage)*

### Object storage

- **Choice:** S3-compatible — **TBD** (MinIO self-hosted in v1 dev; production pick deferred to deployment ADR)
- **Status:** Out of scope for this round (no ADR-0010 yet). Local FS in dev.
- **ADR:** ADR-0010 (proposed in `DECISIONS.md`)

### Background jobs / queue

- **Choice:** **pg-boss** (Postgres-backed queue) — *tentative, no ADR yet*
- **Why:** No new service to operate on a 4 GB VPS. Reuses the same Postgres.
- **Status:** Tentative. To be confirmed in an ADR when the first async job is implemented (likely certificate generation in the Credentials plugin).
- **ADR:** *(none yet)*

### Email

- **Choice:** **TBD** — candidate: **Resend** (or self-hosted SMTP for centers that want full ownership)
- **Status:** Out of scope for v1 (no transactional email in `MVP_SCOPE.md` v1; password reset emails will trigger an ADR).
- **ADR:** *(none yet)*

### i18n

- **Choice:** `next-intl` + Intl APIs + `date-fns-jalali` (or `@internationalized/date`) for Shamsi dates
- **Why:** `next-intl` is the standard for App Router i18n. Persian/RTL is a hard requirement (`MVP_SCOPE.md`).
- **Status:** Locked as part of ADR-0003 stack. No separate ADR.
- **ADR:** *(derived from ADR-0003)*

### Observability

- **Choice:** **TBD** — minimum: structured JSON logs (pino) + error tracking (Sentry self-hosted OR GlitchTip self-hosted)
- **Status:** Not blocking; no ADR yet.
- **ADR:** *(none yet)*

### Testing

- **Choice:** Vitest (unit + integration), Playwright (e2e)
- **Why:** Vitest is fast, ESM-native, plays well with pnpm workspaces. Playwright is the de-facto e2e in the Next.js ecosystem.
- **Coverage target:** ≥ 70% (NFR-011)
- **Status:** Locked. No separate ADR.
- **ADR:** *(none — derived from stack)*

### CI/CD

- **Choice:** GitHub Actions
- **Pipeline:** install → lint → typecheck → test → build (`pnpm verify`), on every PR; deploy on merge to `main` (deploy step deferred until hosting ADR).
- **Status:** Locked. No separate ADR.
- **ADR:** *(none yet)*

### Hosting (v1)

- **Choice:** **TBD** — single VPS, self-hosted (Hetzner / Scaleway / an Iranian host). No SaaS-primary.
- **Status:** Open — Q5 in `PROJECT_STATE.md`. To be picked before M7.
- **ADR:** ADR-0007 (proposed)

---

## Constraints (binding)

از `PRODUCT_BIBLE.md` و `REQUIREMENTS.md`:

- ✅ TypeScript (default for new code).
- ✅ Open-source-friendly stack (no Microsoft-only, no Google-only).
- ✅ Deployable on a single VPS ≤ 4 GB RAM (NFR-009).
- ✅ Works without GPU (AI features are out of scope for v1).
- ✅ License-compatible (no GPL dependencies in core).
- ✅ Persian + RTL first-class.
- ❌ No WordPress. (ADR-0001)
- ❌ No proprietary backend-as-a-service as primary store.

---

## How to update this file

1. If the change is a new technology category, write an ADR first (`docs/05-decisions/`).
2. Update the relevant row above.
3. Update `PROJECT_STATE.md` to mark the question closed.
4. Update `CHANGELOG.md` and `PROJECT_HANDOVER.md`.
5. Commit.
