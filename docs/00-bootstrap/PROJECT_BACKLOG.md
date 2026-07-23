# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 023 — M7 pre-provision prep complete |
| Date opened | 2026-07-22 |
| Driver | contributor |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M1–M6 closed (M1–M5 ✅, **M6 ✅**). M6 Deployment/CI-CD merged to main (PR #6). M7 pre-provision prep complete (PR #7 merged): ADR-0017 containerized DB migrations, docker-compose.prod.yml `image:` fix, DEPLOYMENT_GUIDE.md heredoc fix, local TLS nginx harness. M7 gate active — awaiting founder VPS provisioning + live smoke test → M7 sign-off.** |
| Status | 🟢 **M6 + M7 prep complete.** M7 gate: founder VPS + DNS + GitHub un-park → live deploy → sign-off. |

---

## Context

Sessions 013–017 closed the M4 sprint (dependency upgrades, authorization gate, security headers, security contact point, residual advisories, M2 real-Postgres smoke test). Session 018 added M5 Observability. Session 019–022 handled governance (precedence + Product Vision + AI-instruction policy, ADR-0014 reusable-platform vision + English artifacts rule, ADR-0007/0008 for Q5/Q6). **Session 023 (2026-07-22) completed M6 Deployment/CI-CD (merged via PR #6) and M7 pre-provision prep (merged via PR #7):**

- **M6 — Deployment / CI-CD (merged PR #6):** Docker Compose prod (app + Postgres 16 + MinIO), host Nginx (TLS/HSTS/rate-limit/metrics gate), systemd unit, backup/restore scripts, DEPLOYMENT_GUIDE.md, deploy.yml CI/CD (build → GHCR → SSH → smoke → rollback). Locally verified: image builds, all three services healthy, endpoints `/api/health` 200 / `/api/ready` 200 / `/api/metrics` 401→200(bearer), backup→destroy→restore round-trip recovers Postgres + MinIO byte-identical.
- **M7 pre-provision prep (merged PR #7):** ADR-0017 containerized DB migrations (one-shot `migrate` service in compose, reuses app builder stage with tsx+drizzle-orm+migrations, runs against prod DATABASE_URL before app boots). Fixed deploy defects: `docker-compose.prod.yml` `app` service gains `image:` field (fixes CI `pull`), `DEPLOYMENT_GUIDE.md` §3 heredoc fixed (real secrets not literal `$(...)`), new `env.template` (keys-only). Local TLS nginx harness validates HSTS/headers/metrics gate. Observed gap before fix: fresh stack → `/api/health` degraded (`db:false, auth:false`) → deploy.yml smoke grep would roll back good release.

---

## What session 018 delivered

- **M5 — Observability (SPRINT-001)**
  - Spec: `evidence/M5-observability/checklist.md` (DoR / spec / risk LOW / rollback per ADR-0013).
  - Code:
    - `packages/core/src/observability/logger.ts` — pino singleton + request-scoped child + redaction list.
    - `packages/core/src/observability/requestContext.ts` — `generateRequestId` (honors propagated inbound id, UUID v4 fallback).
    - `packages/core/src/observability/metrics.ts` — in-process Prometheus collector (counter + histogram + uptime gauge).
    - `packages/core/src/observability/errors.ts` — `captureError` with sanitized stack + `PublicError` shape.
    - `packages/core/src/observability/index.ts` — public export barrel.
    - `packages/core/src/api/index.ts` — enhanced `health.check()` (deep), new `readiness.check()` (shallow).
    - `apps/web/src/app/api/health/route.ts` — updated for deep-check shape.
    - `apps/web/src/app/api/ready/route.ts` — **NEW** shallow readiness endpoint.
    - `apps/web/src/app/api/metrics/route.ts` — **NEW** bearer-token-gated Prometheus scrape.
    - `apps/web/src/middleware.ts` — allows `/api/ready` + `/api/metrics` through auth gate.
    - `apps/web/src/app/api/users/route.ts` — wired structured logging, metrics, error capture, `x-request-id` header.
    - `packages/core/package.json` — added `./observability` export.
  - Tests: `packages/core/tests/observability-metrics.test.ts` (5 tests: counters with labels + aggregate, histograms with buckets/sum/count, uptime gauge, stable sorted render).
  - Evidence: `commands.txt`, `output-tests.txt`, `output-build.txt`, `notes.md`, `checklist.md` (all ✅).
  - `pnpm verify` green for core; web build green (ESLint pre-existing issue with `eslint-plugin-import` missing, not M5-introduced; typecheck + page generation both succeed).

---

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence: `../06-sprints/SPRINT-001-production-foundation/evidence/M{1..5}-*/`

---

## What to do next (Session 024+)

**M7 — Production Readiness Review** — final checklist, no red, founder sign-off → feature gate lifts.

**Founder steps (in order, per `pre-provision-checklist.md`):**

| Step | Description |
| --- | --- |
| F0.1 | Domain name decision (e.g. `hawza.example.ir`) |
| F0.2 | GitHub decision: un-park GitHub (use `deploy.yml` CI/CD) or stay parked (manual deploy) |
| F1.1 | Purchase VPS ≤ 4 GB RAM, 50 GB SSD, Ubuntu 22.04/24.04 LTS |
| F1.2 | DNS — point A/AAAA record for domain at VPS IP |
| F1.3 | First login + harden SSH (deploy user, key-only auth, fail2ban, UFW) |
| F1.4 | Install stack deps (docker, compose plugin, certbot, minio-client, nginx) |
| F1.5 | Get code onto host (`git clone` or `scp -r`) |
| F2.1 | GitHub repo secrets (if F0.2a): GHCR_TOKEN, PROD_HOST, PROD_USER, PROD_SSH_KEY, PROD_ENV |
| F2.2 | Host env file — write `/etc/learning-platform/env` from CP0.4 template + real secrets |
| F3.1 | certbot — Let's Encrypt cert for domain |
| F3.2 | Install nginx.conf (already validated in CP0.5) |
| F4.1 | systemd unit install + enable |
| F4.2 | `docker compose -f docker-compose.prod.yml up -d` (or next push runs deploy.yml) |
| F4.3 | Live smoke: `/api/health` 200, `/api/ready` 200, `/api/metrics` 401/200 |
| F5.1 | Founder sign-off → gate lifts |

**Q7 — PWA / offline** — founder decided **YES (2026-07-21, ADR-0016)**: PWA is necessary. Drives a new bounded context (Learning) + service-worker/offline infra. **Implementation parked until M7 sign-off** per the 2026-07-11 directive.

**Independent follow-ups (no founder decision required):**
- HSTS header at M6 behind TLS (M4.2 §4.3).
- CSP nonces — per-request infra to remove `'unsafe-inline'` from `style-src` (M4.2 §4.3).
- `security.txt` real `Contact` address — founder needs to supply.
- `pnpm audit` endpoint retirement — future audits need a substitute (`osv-scanner`, GitHub Dependabot, Snyk).

**Out of scope until M7 sign-off** (per founder directive 2026-07-11): all new business features — Catalog, Learning, Credentials, Localization, Dashboard, Event Bus, PWA.

---

## Done record (Sessions up to 2026-07-20)

- [x] M4.3 — residual advisories + `security.txt` public access
- [x] M2 — Production smoke test (real Postgres)
- [x] M4.2 — CSP + rate limits + input validation + security.txt
- [x] M4.1 — next/next-auth dependency upgrade
- [x] M4.0 — authorization gap + passwordHash leak (P0)
- [x] M3 — CI/CD governance workflow
- [x] M1 — Baseline verification
- [x] **M5 — Observability (pino JSON logs + Prometheus metrics + error capture + health/ready/metrics endpoints)**
- [x] `pnpm verify` green (core lint ✓, typecheck ✓, test ✓ 10/10, build ✓; web typecheck ✓, build ✓)
- [x] `CHANGELOG.md`, `PROJECT_STATE.md` updated with M5
- [x] Evidence complete: `docs/06-sprints/SPRINT-001-production-foundation/evidence/M5-observability/`

---

## Operating notes

- The `eslint-plugin-import` missing-module error in `apps/web` `next lint` is **pre-existing** (not introduced by M5). Build + typecheck both succeed; it only blocks `next lint`. Recommended follow-up: add `eslint-plugin-import` as a web devDependency or migrate to the standalone ESLint CLI per Next's migration guide.
- `pnpm audit` endpoint is retired; future audits need a substitute (`osv-scanner`, GitHub Dependabot, Snyk). Captured as tool-status note, not a finding.
- The dev server crashes when `next build` overwrites `.next/` mid-flight. Not a code bug — re-run `pnpm dev` after a `pnpm verify` build.
- The existing `hawza-postgres` container name is from before the de-AI rebrand. Container names are operational, not committed; the new `docker-compose.yml` uses `lp-postgres`. Future migration: `docker compose down` (new) → re-create from `docker-compose.yml` → re-seed.