# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 018 — M5 complete |
| Date opened | 2026-07-20 |
| Driver | contributor |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M1–M5 closed (M1 ✅, M2 ✅, M3 ✅, M4.0 ✅, M4.1 ✅, M4.2 ✅, M4.3 ✅, **M5 ✅**).** M5 Observability added (structured JSON logs, Prometheus metrics, error capture, health/ready/metrics endpoints). M6 Deployment unblocked. M7 + Q7 remain pending founder decisions. |
| Status | 🟢 **M5 complete.** M6 (Deployment / CI-CD) is the next unblocked milestone. |

---

## Context

Sessions 013–017 closed the M4 sprint (dependency upgrades, authorization gate, security headers, security contact point, residual advisories, M2 real-Postgres smoke test). Session 018 added M5 Observability:

- **Structured JSON logging** via `pino` — singleton logger + request-scoped child loggers with redaction of `password`/`passwordHash`/`token`/`cookie`/`headers.authorization`/`AUTH_SECRET`/`DATABASE_URL`.
- **Prometheus-format metrics** — in-process collector (`http_requests_total{label="METHOD:ROUTE:STATUS"}`, `http_request_duration_seconds`, `process_uptime_seconds`), bearer-token-gated `/api/metrics` endpoint.
- **Error capture** — single `captureError` point with sanitized stacks (query strings stripped), `x-request-id` correlation header on every response.
- **Deep health** — `/api/health` checks `db` (ping), `auth` (mirrors db), `storage` (skipped in v1, ADR-0010 pending).
- **Shallow readiness** — `/api/ready` checks config loaded (`AUTH_SECRET`+`DATABASE_URL`) + not in maintenance; no external deps.
- **First consumer** — `/api/users` wired with per-request logging, metrics, error capture, and `x-request-id` response header.

All core quality gates pass: `pnpm --filter @learning-platform/core typecheck`, `test`, `build`, `lint` ✅. Web builds cleanly (new routes `/api/health`, `/api/metrics`, `/api/ready` compiled; Middleware 46.1 kB; First Load JS 102 kB).

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

## What to do next (Session 019+)

**M6 — Deployment / CI-CD is now unblocked.** The next concrete session is M6 per `SPRINT-001-production-foundation.md`:

| M6 sub-task | Description |
| --- | --- |
| M6.1 | Docker Compose for production (app + Postgres + MinIO) |
| M6.2 | Nginx reverse-proxy config (TLS termination, HSTS, rate-limit proxy, metrics internal-only) |
| M6.3 | systemd unit for the Node process (restart, env, logging) |
| M6.4 | Backup & restore scripts (daily pg_dump + 30-day retention per `SYSTEM_ARCHITECTURE.md` §9) |
| M6.5 | Deployment guide (`docs/07-deployment/DEPLOYMENT_GUIDE.md`) |
| M6.6 | Post-deploy smoke test against the real production stack |

**M7 — Production Readiness Review** — final checklist, no red, founder sign-off → feature gate lifts.

**Q7 — PWA / offline** — founder decided **YES (2026-07-21, ADR-0016)**: PWA is necessary. Drives a new bounded context (Learning) + service-worker/offline infra. **Implementation parked until M7 sign-off** per the 2026-07-11 directive; ADR records the decision now to stop re-litigation.

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