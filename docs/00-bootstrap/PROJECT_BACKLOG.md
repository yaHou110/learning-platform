# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 025 — SPRINT-002 S1: Catalog + Learning API shipped |
| Date opened | 2026-08-01 |
| Driver | contributor |
| Sprint | SPRINT-002 — Feature Sprint (first slice) |
| Goal | **First feature slice on the M7-unblocked surface:** Catalog + Learning bounded-context APIs (courses, lessons, enrollments, progress) with authz, rate limits, observability envelope, unit tests, and real-Postgres integration evidence. Also unblocked production deploy (Vercel Root Directory + dead cron removal) and merged the governance docs PR #12. |
| Status | 🟢 **S1 merged.** 39 new unit tests + 20/20 integration checks green. `pnpm verify` green. Next: catalog UI (course cards/lesson list) or Dashboard slice. |

---

## Context

Session 024 closed M7 (Vercel + Railway target). Sessions after M7 (024b) added the schema foundation (PR #11, 5 tables) and the security audit fixes (PR #9). **Session 025 delivered SPRINT-002 S1:**

- **PR #12 merged** — `AGENTS.md` + `ENGINEERING_STANDARDS.md` governance docs (fix: PR body DoD checkbox needed backtick form `` `pnpm verify` ``).
- **Vercel production deploy unblocked** — project Root Directory set to `apps/web` via project API (framework detection previously failed: "No Next.js version detected"); dead `crons` block (nonexistent `/api/cron/daily-maintenance`) removed from `vercel.json` on main. Production deployment now `Ready`. Note: the project sits behind Vercel org SSO (`all_except_custom_domains`), so external smoke curls hit the SSO redirect — the local Docker lane (ADR-0018) is the endpoint-verification path until a custom domain is added.
- **SPRINT-002 S1 — Catalog & Learning API** (`feat/sprint2-catalog-learning-api`):
  - `packages/core/src/api/catalog.ts` + `learning.ts` (tenant-scoped, soft-delete aware, published-only for students, idempotent enroll, completion flip).
  - 8 routes: courses (list/create/get/patch/publish/lessons), lessons (create/get), enrollments (list/enroll), progress.
  - `apps/web/src/lib/api-route.ts` shared envelope; `parseQuery`/`parseBody` surface Zod issues.
  - Tests: 8 core rules + 20 catalog routes + 11 learning routes (DB-free).
  - Integration: `packages/core/scripts/verify-sprint2-integration.ts` → 20/20 PASS on real Postgres (evidence below).

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

## What to do next (Session 025+)

**M7 — Production Readiness Review** ✅ **COMPLETE.** Vercel + Railway cloud target is the v1 deployment model (ADR-0018). Feature gate lifted.

**Founder steps (env vars on Vercel dashboard):**

| Step | Description |
| --- | --- |
| F1 | Set `DATABASE_URL` on Vercel — from Railway (e.g., `postgresql://user:pass@host:5432/db?sslmode=require`) |
| F2 | Set `AUTH_SECRET` on Vercel — 32+ byte base64 random (`openssl rand -base64 32`) |
| F3 | Set `AUTH_TRUST_HOST=true` on Vercel — required by Auth.js v5 on Vercel serverless |
| F4 | Set `NEXTAUTH_URL` on Vercel — the production Vercel URL (e.g., `https://learning-platform.vercel.app`) |
| F5 | Redeploy (push to `main` or trigger deploy from Vercel dashboard) |
| F6 | Smoke: `curl https://<vercel-url>/api/health` → expect `{"status":"ok","checks":{"db":true,"auth":true,"storage":"skipped"}}` (object storage not wired in v1 — "skipped" is healthy) |

**Cloud provisioning (already done by founder 2026-07-23):**

| Step | Description |
| --- | --- |
| C1 | ✅ Vercel project created — wired to this GitHub repo |
| C2 | ✅ Railway Postgres provisioned — `DATABASE_URL` / `DATABASE_PUBLIC_URL` available |
| C3 | ✅ `vercel.json` at repo root — monorepo build config (buildCommand, framework, installCommand) |
| C4 | ✅ `next.config.mjs` — `output:"standalone"` gated behind `NEXTJS_STANDALONE=1` (Dockerfile sets it) |
| C5 | ✅ `apps/web/Dockerfile` — sets `NEXTJS_STANDALONE=1` so Docker still gets standalone output |

**Agent/contributor work (now unblocked — SPRINT-002 / Feature Sprint):**

- ✅ **Catalog plugin API** — courses + lessons CRUD/publish routes shipped (S1)
- ✅ **Learning plugin API** — enroll + progress routes shipped (S1)
- **Catalog UI** — course cards, lesson list pages (next slice)
- **Dashboard** — real dashboard UI with metrics/status cards
- **Credentials plugin** — certificate issuance, verification
- **PWA / offline** — ADR-0016 YES; Learning bounded context + service-worker/offline infra
- **Independent follow-ups (no founder decision required):**
  - HSTS header behind TLS (M4.2 §4.3)
  - CSP nonces — per-request infra to remove `'unsafe-inline'` from `style-src`
  - `security.txt` real `Contact` address
  - `osv-scanner` / GitHub Dependabot substitute for retired `pnpm audit`
  - Vercel org SSO blocks external smoke curls — add a custom domain when public access is desired

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