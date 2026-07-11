# TECH_STACK.md

> **The chosen technologies and why.** Stub for v1.0 — to be filled in M1 (`ROADMAP.md`).
> Each major choice will be backed by a dedicated ADR.

---

## Status

🚧 **STUB.** This file will be updated as ADR-0003 → ADR-0006 are written (see `NEXT_SESSION.md`).

---

## Categories (to be filled)

### Language & runtime

- **TBD** — TypeScript (almost certainly)
- Runtime: TBD — Node.js / Bun / Deno

### Web framework (frontend + backend)

- **TBD** — see ADR-0003
- Candidates: Next.js, Remix, Nuxt, SvelteKit

### Database

- **PostgreSQL** (assumed) — see ADR-0004
- ORM/query builder: TBD — Drizzle, Prisma, Kysely
- Migrations: TBD
- Possible vector DB (for AI features): TBD

### Auth

- **TBD** — see ADR-0005
- Candidates: Auth.js, Clerk, Lucia, custom

### UI / styling

- **TBD** — likely Tailwind + shadcn/ui (or equivalent headless)
- Icons: TBD — Lucide, Tabler
- Forms: TBD — react-hook-form + zod

### Object storage

- **S3-compatible** for media (R2, MinIO, or Scaleway — to be decided)
- Local FS in dev

### Background jobs / queue

- **TBD** — likely a simple queue (BullMQ, Inngest, or pg-boss) for cert generation, email, etc.

### Email

- **TBD** — transactional email provider (Postmark, Resend, SES)

### i18n

- **TBD** — Farsi primary, RTL, with shamsi date support

### Observability

- **TBD** — at minimum: structured logs + error tracking (Sentry or self-hosted)
- Metrics: TBD (Prometheus + Grafana, or hosted)

### Testing

- **TBD** — Vitest or Jest for unit; Playwright for e2e
- Coverage target: ≥ 70% (NFR-011)

### CI/CD

- **GitHub Actions** (assumed — repo is on GitHub)
- Lint + typecheck + test + build on every PR
- Deploy on merge to `main`

### Hosting (v1)

- **TBD** — see ADR (later)
- Candidates: a single VPS (Hetzner / Scaleway / Iranian host), Fly.io, Railway, Vercel (for web only)

---

## Constraints (binding)

از `PRODUCT_BIBLE.md` و `REQUIREMENTS.md`:

- ✅ TypeScript (default for new code).
- ✅ Open-source-friendly stack (no Microsoft-only, no Google-only).
- ✅ Deployable on a single VPS ≤ 4GB RAM (NFR-009).
- ✅ Works without GPU (AI features are out of scope for v1).
- ✅ License-compatible (no GPL dependencies in core).
- ✅ Persian + RTL first-class.
- ❌ No WordPress. (ADR-0001)
- ❌ No proprietary backend-as-a-service as primary store.

---

## How this file will be filled

Each row above will be replaced by:

```markdown
### <category>

- **Choice:** <X>
- **Version:** <v>
- **Why:** <1-3 sentences>
- **Trade-offs:** <1-3 sentences>
- **Migration cost (6 months):** <low/medium/high>
- **ADR:** ADR-NNN
```

---

## Until filled

If a new agent needs to make a tech decision:

1. Read `NEXT_SESSION.md` first.
2. If the decision is on the open list, write the ADR.
3. Update this file.
4. Update `PROJECT_STATE.md` to mark the question closed.
5. Commit.

If the decision is **not** on the open list, **stop and ask the user** — do not invent.
