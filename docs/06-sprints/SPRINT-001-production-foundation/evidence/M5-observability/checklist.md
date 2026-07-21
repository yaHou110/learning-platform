# M5 — Observability — Checklist

## Structured JSON Logging
- [x] Add `pino` to `@learning-platform/core` dependencies
- [x] Create `packages/core/src/observability/logger.ts` — singleton pino logger with request context
- [ ] Create `packages/core/src/observability/middleware.ts` — Next.js middleware wrapper for request-scoped logging (deferred: manual context in route handlers is sufficient for v1 single-process)
- [x] Integrate logger into existing API routes (`health`, `users`, `auth` via `/api/users` route)
- [x] Log format: JSON, includes `requestId`, `tenantId`, `userId`, `timestamp`, `level`, `message`, `durationMs`

## Metrics Endpoint
- [x] Create `packages/core/src/observability/metrics.ts` — Prometheus-format metrics collector
- [x] Create `apps/web/src/app/api/metrics/route.ts` — GET `/api/metrics` (internal only, bearer token gated)
- [x] Metrics: `http_requests_total`, `http_request_duration_seconds`, `process_uptime_seconds`
- [x] Protect endpoint (internal network only or auth via METRICS_TOKEN)

## Error Reporting
- [x] Create `packages/core/src/observability/errors.ts` — structured error capture with correlation IDs
- [x] Integrate with logger for automatic error logging
- [x] No PII in error reports (redaction via pino + sanitized stack)

## Health Endpoint (Deep)
- [x] Enhance `packages/core/src/api/index.ts` health.check() — add auth reachability, object storage reachability
- [x] Update `apps/web/src/app/api/health/route.ts` to use deep check
- [x] Response: `status: ok|degraded|error`, `checks: { db, auth, storage }`, `timestamp`

## Readiness Endpoint (Shallow)
- [x] Create `packages/core/src/api/index.ts` readiness.check() — process alive, config loaded, not in maintenance
- [x] Create `apps/web/src/app/api/ready/route.ts` — GET `/api/ready`
- [x] Response: `status: ready|not_ready`, `checks: { config, maintenance }`, `timestamp`

## Evidence
- [x] `commands.txt` — exact commands run
- [x] `output-*.txt` — captured output
- [x] `notes.md` — observations, deviations
- [x] This checklist.md with ticks

## Verification
- [x] `pnpm verify` passes (lint, typecheck, test, build)
- [x] `GET /api/health` returns deep check results
- [x] `GET /api/ready` returns shallow check results
- [x] `GET /api/metrics` returns Prometheus format
- [x] Structured JSON logs visible in dev server output
- [x] Error correlation IDs work