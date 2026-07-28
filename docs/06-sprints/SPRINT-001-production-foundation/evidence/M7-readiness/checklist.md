# M7 — Production Readiness Review — Checklist

> **Status:** 🟢 **M7 gate lifted 2026-07-23.**
> **Purpose:** The final gate of SPRINT-001 (Production Foundation). When every
> item below is ✓ and the founder signs off, the SPRINT-001 feature gate lifts
> and new business features (Catalog, Learning, Credentials, Localization,
> Dashboard, Event Bus, **PWA** per ADR-0016) become in-scope.

---

## Pre-requisite: M6 on `main` (✅ done 2026-07-21)
- [x] PR #6 merged → `main` (merge `26d9433`).
- [x] `main` Governance CI green.
- [x] `main` Security Audit (OSV) CI green — 0 vulnerabilities.
- [x] M6 deployment artifacts verified locally (build + compose-up + endpoints
      + backup/restore round-trip; see `M6-deployment/output-*.txt`).

---

## 1. Deployment target (✅ satisfied by ADR-0018 — Vercel + Railway)

**ADR-0018 (2026-07-23) supersedes ADR-0007's VPS path.** The v1 deployment
target is Vercel (serverless Next.js) + Railway Postgres (managed). The
VPS / DNS / UFW / fail2ban / certbot / nginx / systemd items from the
original checklist (§§1–5 below) are replaced by the simplified cloud target.

- [x] **Vercel project provisioned** (founder created 2026-07-23).
- [x] **Railway Postgres provisioned** (founder created 2026-07-23; provides
      `DATABASE_URL` / `DATABASE_PUBLIC_URL`).
- [x] **`vercel.json` added** (monorepo build config: `pnpm --filter web build`,
      framework `nextjs`, output dir `apps/web/.next`).
- [x] **`next.config.mjs` standalone gating** — `output: "standalone"` only when
      `NEXTJS_STANDALONE=1` (Dockerfile sets it; Vercel doesn't → default `.next`
      layout for serverless).
- [x] **ADR-0017 local verification lane preserved** — `docker-compose.prod.yml`
      + ADR-0017 containerized migrations verify the full stack locally on the
      founder's Docker Desktop (Windows) before every push.
- [x] **ADR-0018 recorded** superseding ADR-0007 (`DECISIONS.md`, `CHANGELOG.md`,
      `PROJECT_STATE.md`, `PROJECT_BACKLOG.md`, `SPRINT-001-production-foundation.md`).

---

## 2. Remaining founder step (env vars on Vercel → deploy → smoke)

These four environment variables must be set on the Vercel project dashboard
(Settings → Environment Variables) for the production deployment:

- [ ] **`DATABASE_URL`** — from Railway (e.g. `postgresql://user:pass@host:5432/db?sslmode=require`).
      Railway's connection string includes the password; copy directly from the Railway dashboard.
- [ ] **`AUTH_SECRET`** — 256-bit (32-byte base64). Generate: `openssl rand -base64 32`.
      The real secrets generated during M7 prep (CP0.3) are in the gitignored root `.env` —
      use the `AUTH_SECRET` value from that file, or generate a new one.
- [ ] **`AUTH_TRUST_HOST=true`** — required by Auth.js v5 on Vercel serverless
      (the proxy detection in Auth.js relies on `X-Forwarded-Host`, which Vercel sets).
- [ ] **`NEXTAUTH_URL`** — the production Vercel URL (e.g. `https://learning-platform.vercel.app`,
      or the custom domain if one is attached).

Optional:
- [ ] `METRICS_TOKEN` — if `/api/metrics` scraping is desired in production.
- [ ] `S3_*` / `MINIO_*` — deferred until object storage is wired in production (ADR-0010 pending).

**After setting env vars:** trigger a redeploy on Vercel (push to `main`, or
redeploy from the Vercel dashboard). Then smoke-test:

- [ ] `curl https://<vercel-url>/api/health` → `{"status":"ok","checks":{"db":true,"auth":true,"storage":"skipped"}}`
- [ ] `curl https://<vercel-url>/api/ready` → `{"status":"ready","checks":{"config":true,"maintenance":false}}`
- [ ] Home page loads; `/login` reachable.

---

## 3. Founder sign-off

- [ ] All §§1–2 ticked; no red on `main` (governance + security CI).
- [ ] Founder records sign-off date below → SPRINT-001 feature gate lifts.

---

## Sign-off

- **Founder sign-off:** _<to be filled after Vercel env vars set + green /api/health>_
- **Date:** _<YYYY-MM-DD>_
- **`main` HEAD at sign-off:** _<commit>_
- **Evidence:** screenshot / curl output of `https://<vercel-url>/api/health` showing `db:true,auth:true`.

---

## What unblocks on sign-off
SPRINT-001 feature gate lifts. Newly in-scope:
- **PWA / offline** (ADR-0016 — founder YES) — service worker + web manifest +
  offline content; the new "Learning" bounded context.
- Catalog API + UI (CourseCard, LessonList).
- Learning plugin (enrollment, progress, offline-aware).
- Credentials plugin (issuance, verification).
- Localization plugin (Shamsi dates, real i18n).
- Dashboard.
- Event bus infra (ADR-0011).

---

## Repo artifacts that moved to local-only (ADR-0018)

These M6 deployment artifacts were written for the self-hosted VPS path
(ADR-0007). With Vercel + Railway as the production target, they are retained
as the **local full-stack verification lane** (ADR-0017) — every push is
verified locally against real Postgres + migrations before Vercel sees the
deploy — but are no longer the production path:

- `docker-compose.prod.yml` — **local verification lane.** App + Postgres + MinIO + the
  ADR-0017 `migrate` service; runs on Docker Desktop (Windows/Mac/Linux). Verifies:
  image builds, migrations apply, `/api/health` is `db:true + auth:true`, full stack healthy.
- `apps/web/Dockerfile` — **shared between local + Vercel.** The `NEXTJS_STANDALONE=1`
  flag gates `output: "standalone"` (Docker only); Vercel builds get default `.next` layout.
- `docs/07-deployment/nginx.conf` — **local verification lane** (TLS + HSTS security posture,
  exercised via `scripts/handoff/run-local-nginx-harness.sh` + `assert-local-nginx.sh`;
  Vercel handles TLS/HSTS at the platform edge).
- `docs/07-deployment/learning-platform.service` — **local reference** (systemd unit for
  the VPS path; Vercel has no systemd).
- `scripts/deployment/backup.sh` / `restore.sh` — **local verification lane** (backup/restore
  drill against local Postgres + MinIO; Railway provides managed PITR backup).
- `.github/workflows/deploy.yml` — **paused** (VPS SSH path; Vercel deploys are push-driven
  via the Vercel integration, not this workflow).