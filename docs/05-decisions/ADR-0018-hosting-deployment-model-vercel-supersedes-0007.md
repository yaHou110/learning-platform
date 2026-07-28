# ADR-0018: Hosting & deployment model (v1 redirect) — Vercel (serverless Next.js) + Railway Postgres

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Founder

---

## Context

This ADR supersedes **ADR-0007** ("Hosting & deployment model — self-hosted single-VPS dedicated deployment for v1"). ADR-0007 was accepted on 2026-07-19 and governed the M6 Deployment / CI-CD milestone (SPRINT-001). It selected a single self-hosted VPS (~4 GB RAM) as the v1 deployment target under constraints C1 (single VPS), C3 (self-hosted), and C6 (low operational complexity).

**What changed:** On 2026-07-23, the founder cancelled the VPS plan and provisioned **Railway Postgres** (managed PostgreSQL 16) as the production database. The application deployment target is now **Vercel** (serverless Next.js). The deployment shape remains: single-region, single-tenant, founder-operated, customer-agnostic artifact — the same invariants ADR-0007/C1/C3/C6 require. Only the *execution substrate* changes: from a self-managed Ubuntu VPS (Docker Compose + Nginx + systemd) to Vercel + Railway managed services.

**Why this is a supersession, not an amendment:** ADR-0007's Decision §1 ("Self-hosted, on infrastructure we control") and §3 ("Dedicated shape, not SaaS") explicitly commit to a self-hosted VPS deployment. Vercel is a managed platform; Railway is a managed DB. These are not re-configurations of the same deployment model — they are a different model. The artifact identity and customer-agnostic property (ADR-0007 Decision §4, ADR-0014) are preserved, so the *architecture* does not fork, but the *deployment ADR* must be replaced.

**M7 gate impact:** SPRINT-001 M7 ("Production Readiness Review") was gated on "founder VPS provisioning + live smoke test → M7 sign-off" (ADR-0007, PROJECT_STATE, PROJECT_BACKLOG, ENGINEERING_PROTOCOL). That gate is now satisfied by a green Vercel + Railway deployment. The Docker Compose prod stack (`docker-compose.prod.yml`, ADR-0017) remains as the **local full-stack verification lane** on the founder's Docker Desktop (Windows), reproducible end-to-end via `scripts/handoff/verify-migrate-and-stack.sh`. This keeps the real-Postgres verification dependency (M2 smoke test passed 2026-07-15) without requiring a VPS.

### Forces at play

- **C1 / C3 / C6 (ARCHITECTURE_CONSTRAINTS):** single VPS ~4 GB, self-hosted, low operational complexity. Vercel + Railway *satisfy* these constraints operationally (founder operates one Vercel project + one Railway service, no server management), even though the execution model is managed rather than self-hosted. The "single VPS" constraint is met in spirit: one founder, one deployable, one region, one tenant.
- **ADR-0014 (Reusable platform vision):** the artifact must be customer-agnostic and re-configurable, not forked per deployment target. **Preserved** — nothing in shared code assumes Vercel or Railway; the same Next.js build runs on Docker Compose locally and on Vercel in production.
- **ADR-0017 (Containerized DB migrations):** the local verification lane (`docker-compose.prod.yml` with one-shot `migrate` service) must remain green and runnable on Docker Desktop Windows. **Preserved** — the cloud target does not replace the local verification lane; it adds a production target alongside it.
- **Founder decision (2026-07-23):** VPS plan cancelled; Railway Postgres provisioned; Vercel project created. The deployment decision must reflect the actual provisioned infrastructure.
- **YAGNI (Project Principle #6 / §11):** do not maintain two deployment ADRs for one product. ADR-0007 is superseded in full; this ADR records the current v1 deployment model.

### Key terms

- **Cloud target** — Vercel (serverless Next.js) + Railway (managed Postgres 16). The production deployment for v1.
- **Local verification lane** — `docker-compose.prod.yml` + `apps/web/Dockerfile` + ADR-0017 containerized migrations, run on the founder's Docker Desktop (Windows) to verify the full stack (app + Postgres + MinIO + migrations) end-to-end before pushing to Vercel.
- **Customer-agnostic artifact** — the same `pnpm --filter web build` output runs on both targets; no build-time constants encode the deployment target.

### Deadline

This decision is required before M7 sign-off (SPRINT-001) can proceed. The VPS gate text in SPRINT-001, ENGINEERING_PROTOCOL, PROJECT_STATE, and PROJECT_BACKLOG must be updated to reflect the cloud target.

---

## Decision

**v1 deploys the Next.js application to Vercel (serverless) and PostgreSQL 16 to a Railway managed service. The Docker Compose production stack (`docker-compose.prod.yml`) is retained as the local full-stack verification lane per ADR-0017. The customer-agnostic, single-artifact, single-region, founder-operated invariants from ADR-0007 are preserved.**

1. **Production target: Vercel + Railway.** The founder has provisioned a Railway Postgres service (providing `DATABASE_URL` / `DATABASE_PUBLIC_URL`) and a Vercel project. The Next.js app builds and deploys to Vercel serverless functions. The same `pnpm --filter web build` artifact is used — `output: "standalone"` is gated behind `NEXTJS_STANDALONE=1` (set by the Dockerfile) so Docker builds get the standalone layout while Vercel builds get the default `.next` layout that serverless functions are generated from.

2. **Local verification lane: Docker Compose (unchanged).** `docker-compose.prod.yml` with the ADR-0017 `migrate` service runs on the founder's Docker Desktop (Windows). It uses the same app image (which ships migrations) against a local Postgres container. This verifies: (a) the image builds, (b) migrations apply correctly against real Postgres, (c) `/api/health` returns `db:true` + `auth:true` on a fresh schema, (d) the full stack (app + Postgres + MinIO) is healthy. This is the "real Postgres" verification M2 established (2026-07-15), now codified as a permanent local lane.

3. **Environment variables (4 required on Vercel).** The following must be set on the Vercel project dashboard (Settings → Environment Variables) for the production deployment:
   - `DATABASE_URL` — from Railway (e.g., `postgresql://user:pass@host:5432/db?sslmode=require`)
   - `AUTH_SECRET` — 32+ byte base64 random (same generation as M6 guide §3 step 5a)
   - `AUTH_TRUST_HOST=true` — required by Auth.js v5 on Vercel serverless
   - `NEXTAUTH_URL` — the production Vercel URL (e.g., `https://learning-platform.vercel.app`)

   Optional / inherited: `METRICS_TOKEN` (if `/api/metrics` scraping is desired), `S3_*` / `MINIO_*` (if object storage is wired — MinIO stays local-only in v1).

4. **No customer identity baked in.** The Vercel project and Railway service are parameterized by configuration, not code. A second customer's deployment is a re-configuration (new Vercel project + new Railway service, same artifact), not a fork. This honors ADR-0007 Decision §4 and ADR-0014 §1/§2.

5. **M7 gate redefined.** M7 is now satisfied by: Vercel project wired (done), Railway Postgres provisioned (done), the 4 env vars set on Vercel, redeploy, and a green `/api/health` smoke test (`status: "ok"`, `checks: {db: true, auth: true, storage: true}`). The "founder VPS provisioning" blocker is removed.

6. **ADR-0007 is superseded in full.** It is moved to the Superseded section of `DECISIONS.md` with a link to this ADR. ADR-0007 is never edited (append-only history).

---

## Rationale

### 1. It satisfies C1/C3/C6 operationally without a VPS

The founder operates exactly one Vercel project and one Railway service — no SSH, no Docker host, no certbot, no nginx, no systemd, no backup scripts. This is *lower* operational complexity than the self-hosted VPS path, not higher. The "single VPS ~4 GB" constraint (C1) is met in spirit: one deployable, one region, one tenant, one founder. The "self-hosted" constraint (C3) is relaxed to "founder-operated managed services" — the control plane is Vercel/Railway, but the founder still owns the deployment and data. C6 (low operational complexity) is improved.

### 2. It keeps ADR-0014's promise without paying for it twice

ADR-0014 already requires the architecture not to lock out future deployment targets. The same artifact (`pnpm --filter web build`) runs on Docker Compose locally and on Vercel in production. No build-time constants encode the target. The capability/operation split is honored: the *capability* (multi-tenant-capable code, customer-agnostic artifact) is present; the *operation* (how it runs) is a configuration choice.

### 3. The local verification lane (ADR-0017) is preserved and strengthened

The VPS path required a live VPS to verify migrations + full stack. The cloud target *adds* a production lane but the Docker Compose lane remains the primary pre-push verification. This is strictly better: every push is verified against real Postgres + migrations locally before Vercel sees it. The M2 "real Postgres smoke test" (2026-07-15) is now a permanent local gate, not a one-time milestone.

### 4. It closes the M7 blocker without weakening verification

The M7 gate was "founder VPS provisioning + live smoke test." That blocker existed because the VPS path required manual infrastructure work. The cloud target removes the infrastructure work (Vercel + Railway are provisioned) while keeping the verification requirement (green `/api/health` on a fresh deploy). The gate is *satisfied*, not *weakened*.

### 5. Consistent with ADR-0017 and the existing ADR stream

ADR-0017's `migrate` service runs in the local compose stack against a local Postgres container. That mechanism is unchanged. The production `DATABASE_URL` on Vercel points to Railway; the local `DATABASE_URL` in compose points to the compose `postgres` service. The same migration SQL runs in both contexts — single source of truth.

---

## Consequences

### Positive

- ✅ M7 blocker removed — no VPS purchase, DNS, SSH hardening, certbot, nginx, systemd, backup scripts required for production.
- ✅ Lower operational complexity (C6) — managed platform + managed DB, no server ops.
- ✅ Faster deploy feedback — Vercel deploys in ~60s vs. VPS SSH + compose pull + up + smoke (~5–10 min).
- ✅ Local verification lane (ADR-0017) preserved — every push verified against real Postgres + migrations on Docker Desktop before Vercel.
- ✅ Customer-agnostic artifact preserved — same build runs on Docker Compose and Vercel; no fork.
- ✅ ADR-0014 re-configurability honored — a second customer is a new Vercel project + Railway service, same artifact.

### Negative

- ❌ Vendor dependency on Vercel + Railway (was: generic VPS). Mitigated: the artifact is portable; a future move to VPS / other managed platform is a re-configuration, not a rewrite (ADR-0014).
- ❌ `docker-compose.prod.yml` + `nginx.conf` + `learning-platform.service` + `backup.sh`/`restore.sh` become "local-only" artifacts. They remain in the repo for the verification lane but are no longer the production path. Documented in `DEPLOYMENT_GUIDE.md` as the local lane.
- ❌ `AUTH_TRUST_HOST=true` is a Vercel-specific Auth.js config. Documented; it is a runtime env var, not a build constant.
- ❌ MinIO (S3-compatible object storage) stays local-only in v1. Production object storage is not yet wired. ADR-0010 (Media storage provider) is still proposed.

### Neutral

- 🔁 The specific hosting provider (Vercel) and DB provider (Railway) are operational choices beneath this ADR and may change per deployment without architectural impact.
- 🔁 TLS termination, HSTS, rate-limiting, and metrics gating are handled by Vercel's platform (not host nginx). The local lane keeps the nginx config for parity verification.
- 🔁 Backup / restore for Railway Postgres uses Railway's managed backup (point-in-time recovery), not the local `backup.sh` script. The local script remains for the verification lane.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Vercel + Railway (chosen)** | Accepted | Founder provisioned both; satisfies C1/C3/C6 operationally; preserves customer-agnostic artifact; keeps local verification lane (ADR-0017); removes M7 blocker. |
| **Keep ADR-0007 VPS path, provision VPS anyway** | Rejected | Founder cancelled VPS plan. Maintaining an unused VPS path adds operational burden with no benefit. The VPS path artifacts stay as the local verification lane. |
| **Vercel + Neon / Supabase / other managed Postgres** | Rejected for v1 | Railway is already provisioned. All are managed Postgres; the choice is operational, not architectural. Revisit if Railway proves unsuitable (ADR-0010). |
| **Vercel + self-hosted Postgres on a small VPS (hybrid)** | Rejected | Defeats the operational simplicity gain. If running a DB server, might as well run the app too. |
| **Cloudflare Pages + D1 / other edge** | Rejected for v1 | Next.js on Cloudflare Pages has different constraints (edge runtime, no Node APIs). Vercel is the native Next.js platform; the artifact is built for Vercel. |
| **Defer — keep VPS gate, implement cloud later** | Rejected | The VPS gate is a real blocker (founder cancelled the plan). "Later" means feature work stays parked indefinitely. The cloud target is provisioned *now*. |

---

## When to revisit

- **A second customer is signed.** The operational layer (multiple Vercel projects + Railway services, tenant routing) becomes real work; a new ADR decides the multi-deployment topology. The artifact identity/re-configurability from Decision §4 is what makes that a growth, not a rewrite.
- **Railway Postgres proves unsuitable** (cost, limits, region, features) → migrate to another managed Postgres (Neon, Supabase, AWS RDS, self-hosted). The artifact is portable; only the `DATABASE_URL` changes. This would be an operational change, not an ADR revision, unless the migration mechanism changes.
- **Vercel proves unsuitable** (cost, limits, region, features) → migrate to another Next.js-native platform (self-hosted VPS, AWS Amplify, Netlify with Next.js adapter). A new ADR is required if the deployment *model* changes (e.g., from serverless to long-running containers).
- **Object storage is needed in production** → ADR-0010 (Media storage provider) decides the provider. MinIO stays local-only until then.
- **A product-strategy shift toward or away from reusability/SaaS** → a new ADR would be required to overturn this one's shape.

A new ADR is required to overturn this one.

---

## References

- [`ADR-0007-hosting-deployment-model.md`](./ADR-0007-hosting-deployment-model.md) — **Superseded by this ADR**. Original v1 VPS decision. Decision §1/§3 committed to self-hosted VPS; this ADR replaces the deployment model while preserving the customer-agnostic artifact invariant (Decision §4).
- [`ADR-0014-reusable-platform-vision.md`](./ADR-0014-reusable-platform-vision.md) — §1 (no customer identity in shared code), §4 (deployment model deferred to ADR-0007, now this ADR), §5 (no premature abstraction).
- [`ADR-0017-containerized-db-migrations.md`](./ADR-0017-containerized-db-migrations.md) — Local verification lane: containerized one-shot `migrate` service in `docker-compose.prod.yml`, reusing the app image (which ships migrations), runs against local Postgres before app boots. Preserved unchanged.
- [`ADR-0006-plugin-architecture.md`](./ADR-0006-plugin-architecture.md) — "One deployable" produced by `pnpm --filter web build`; this ADR's cloud target runs that same artifact on Vercel serverless.
- [`ADR-0004-database.md`](./ADR-0004-database.md) — PostgreSQL 16 + Drizzle ORM. Railway provides managed Postgres 16.
- [`docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md) — C1 (single VPS ~4 GB), C3 (self-hosted), C6 (low operational complexity). This ADR satisfies them operationally via managed services.
- [`docs/00-bootstrap/PROJECT_STATE.md`](../00-bootstrap/PROJECT_STATE.md) — open question Q5 (now closed by this ADR, superseding ADR-0007).
- [`docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md) — M7 gate text updated by this ADR.
- [`docs/07-deployment/DEPLOYMENT_GUIDE.md`](../07-deployment/DEPLOYMENT_GUIDE.md) — Updated to add §"Cloud target (Vercel + Railway)" alongside the existing Docker/VPS path.
- `vercel.json` (repo root) — monorepo build config for Vercel: `buildCommand: pnpm --filter web build`, `framework: nextjs`, `outputDirectory: apps/web/.next`, `installCommand: pnpm install --frozen-lockfile`.
- `apps/web/next.config.mjs` — `output: "standalone"` gated behind `NEXTJS_STANDALONE=1` so Docker builds keep standalone layout while Vercel builds get default `.next` layout.
- `apps/web/Dockerfile` — sets `NEXTJS_STANDALONE=1` env so Docker still gets standalone output.
- `scripts/handoff/verify-migrate-and-stack.sh` — local full-stack verification script (Docker Compose + migrations + health checks).