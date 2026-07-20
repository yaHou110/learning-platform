# M5 Observability — Notes

> **Status:** ✅ Implemented (2026-07-20)
> **Branch:** `feat/m5-observability` (off `main`)
> **Risk:** LOW per ADR-0013 §42 (additive observability; no schema, no auth-flow change)

---

## 1. What M5 delivers

### Structured JSON logging (`packages/core/src/observability/logger.ts`)
- Singleton `pino` logger; one JSON object per line to stdout.
- ISO timestamps (`pino.stdTimeFunctions.isoTime`) so logs are greppable across instances.
- **Redaction list** (belt-and-suspenders PII guard): `password`, `passwordHash`, `token`, `authjs.session-token`, `AUTH_SECRET`, `DATABASE_URL`, `session`, `accessToken`, `cookie`, `cookies.*`, `headers.authorization`, `headers.cookie`. pino replaces any matching value with `[Redacted]` before serialization.
- Request-scoped context via `requestLogger(ctx)` → pino child logger carrying `requestId`, `method`, `route`, `tenantId`, `userId`.

### Request context (`packages/core/src/observability/requestContext.ts`)
- `generateRequestId(inbound)` honors a propagated inbound `x-request-id` if it is plausible (≥8 chars, safe charset), otherwise mints a UUID v4 via `node:crypto.randomUUID()`. No `Math.random` — collisions under load would ruin log correlation.
- Constant `RESPONSE_REQUEST_ID_HEADER = "x-request-id"`; routes set it on the response so a support report correlates to a server log line.

### Metrics (`packages/core/src/observability/metrics.ts`)
- In-process Prometheus-format collector. Counters (with an optional single `label` dimension) and histograms (fixed SLO bucket set for latency, p95 < 500 ms target).
- Rendered via `renderPrometheus()` → Prometheus text format 0.0.4. A future prometheus/grafana scrape (M6) is a config change, not a code change.
- `process_uptime_seconds` gauge appended to every scrape.

### Error reporting (`packages/core/src/observability/errors.ts`)
- `captureError(err, ctx)` is the single capture point. Logs at `error` level with `requestId`, `errName`, `errMessage`, `status`, `code`, and a **sanitized stack** (query strings stripped from frames so tokens in URLs do not leak).
- Returns a `PublicError` shape (`error`, `code`, `requestId`, `status`) for the client. For 5xx the public `error` is generic ("Internal error"); raw `error.message` stays server-side only.
- v1 ships **no remote error backend** (Sentry/GlitchTip) — that is a deployment-time operational choice (ADR-0007), not a code one. `captureError` is the only extension point when one is wired (M6+).

### Health (deep) and readiness (shallow)
- `health.check()` → `{ status, checks: { db, auth, storage } }`. `db` is a `select 1` ping; `auth` mirrors `db` (DB reachable ⇒ Auth.js Credentials + Drizzle adapter can serve); `storage` reports `"skipped"` (ADR-0010 not yet wired) so a missing dep reads as "not applicable", not "outage".
- `readiness.check()` → `{ status, checks: { config, maintenance } }`. Confirms `AUTH_SECRET` + `DATABASE_URL` are loaded and `MAINTENANCE_MODE` is not set. Does NOT ping external deps — that is `/api/health`'s job. Purpose: load-balancer membership (M6).

### Routes + middleware
- `/api/health` updated to the deep-check shape (200 ok / 503 degraded|error).
- `/api/ready` (new), `/api/metrics` (new).
- `/api/metrics` is **bearer-token gated**: if `METRICS_TOKEN` is set, callers must send `Authorization: Bearer <token>`; in prod with no token configured it refuses (503) rather than expose metrics; in dev with no token it allows (so local scrape works). Middleware does not short-circuit `/api/metrics` — the route returns 401 on a bad token, not a silent auth redirect.
- Middleware allows `/api/ready` and `/api/metrics` through the auth gate so a reverse proxy (M6) can scrape them without a session.

### `/api/users` wired as the first real consumer
- Per-request structured logging (requestId, tenantId, userId, route), Prometheus metrics (`http_requests_total{label="METHOD:/api/users:STATUS"}`, `http_request_duration_seconds`), error capture via `captureError`, and `x-request-id` response header on every path (401/403/429/400/200/5xx).

---

## 2. Design decisions & trade-offs

### Metric label cardinality — bounded by construction
The metric label dimension carries **only** `METHOD:ROUTE:STATUS` (e.g. `GET:/api/users:200`). There is a small, fixed set of routes and HTTP statuses, so the cardinality of `http_requests_total{label=...}` stays in the low hundreds. **We deliberately do NOT put `requestId`, `userId`, or `tenantId` into metric labels** — those are high-cardinality and would explode the in-process `Map` on a long-running VPS (memory growth + scrape bloat). Request-scoped identity travels in **logs** (via the pino child logger), not in metrics. This is the standard Prometheus guidance and we follow it.

### Manual request context vs. AsyncLocalStorage
v1 threads request context **manually** (`requestLogger({ requestId, ... })` at the top of each route handler). This is explicit and easy to read for a small surface (one wired route today, a handful after the feature gate lifts). If the route count grows, the upgrade path is `node:async_hooks` `AsyncLocalStorage` seeded by middleware — the `requestLogger` API already takes a context object, so an ALS-backed `getRequestLogger()` would be a drop-in addition, not a rewrite. We do not build the ALS indirection now (YAGNI, §11 / Project Principle #6): the manual form is ~3 lines per route and keeps the request boundary visible.

### No remote error-tracking backend in v1
Per ADR-0007 the deployment is a single self-hosted dedicated VPS operated by the founder. A Sentry/GlitchTip instance is real operational load (C6) for zero marginal value before a second customer. `captureError` is the seam; wiring a transport later is additive.

### Pretty logs intentionally not added
A pino pretty transport is a separate runtime dependency. v1 keeps the prod and dev log shape identical (JSON to stdout) so behavior does not change between environments and there is one fewer moving part on the 4 GB VPS. Developers can pipe through `pino-pretty` at the shell if they want color.

---

## 3. Verification results

| Gate | Result |
| --- | --- |
| `pnpm --filter @learning-platform/core typecheck` | ✅ exit 0 |
| `pnpm --filter @learning-platform/core test` | ✅ 10 tests pass (incl. 5 new `observability-metrics.test.ts`) |
| `pnpm --filter @learning-platform/core build` | ✅ exit 0 |
| `pnpm --filter web typecheck` | ✅ exit 0 |
| `pnpm --filter web build` | ✅ exit 0 — `/api/health`, `/api/metrics`, `/api/ready` compiled; Middleware 46.1 kB; First Load JS 102 kB (unchanged) |
| `pnpm test` (workspace) | ✅ all packages pass |
| `pnpm lint` | ⚠️ core ✅; web has a **pre-existing** `eslint-plugin-import` missing-module error (not introduced by M5; the `next lint` config cannot resolve its config file). Build still passes. |

### Test coverage
- `packages/core/tests/observability-metrics.test.ts` (5 tests): counter with label slices + aggregate; histogram bucketing + `_sum`/`_count`; uptime gauge; stable sorted render order.

---

## 4. Known issues / deferred

- **Web `next lint` config error** — pre-existing: `Cannot find module 'eslint-plugin-import'` referenced by `eslint-config-next`. Not caused by M5; `pnpm build` proceeds past it (typecheck + page generation both succeed). Recommended follow-up: add `eslint-plugin-import` as a web devDependency or migrate `apps/web` to the standalone ESLint CLI per Next's migration guide. Logged here, not blocking M5.
- **Metrics route not exercised by an integration test** — the bearer-token gate logic is straightforward; a route-level test would require importing the route handler. Deferred until the web test harness supports route-handler imports (or M6 adds an e2e scrape test).
- **AsyncLocalStorage request-context indirection** — deferred per §2 (manual context is sufficient for v1).
- **Remote error backend wiring** — deferred per §2 (operational choice, M6+).

---

## 5. Addressing the external review notes (cardinality / PII / context)

Three points were raised during review; all three are handled by this design:

1. **"If requestId/userId/tenantId go into metric labels, cardinality explodes."** — Correct, and we do not do that. Metric labels carry only the low-cardinality `METHOD:ROUTE:STATUS` tuple. High-cardinality identity (requestId, userId, tenantId) lives in **logs**, via the pino child logger, never in metrics. See §2.
2. **"Ensure Authorization / Cookie / Password / Token are never logged."** — Enforced at two layers: (a) the pino `redact.paths` list masks those exact fields (plus `AUTH_SECRET`, `DATABASE_URL`, `headers.authorization`, `headers.cookie`, `cookies.*`) to `[Redacted]`; (b) the error-capture stack sanitizer strips query strings from frames so tokens in URLs do not leak. See logger.ts `REDACT_PATHS` and errors.ts `sanitizeStack`.
3. **"If routes multiply, manage context via middleware/AsyncLocalStorage instead of manual logger construction."** — Agreed; the manual form is the v1 shape and the `requestLogger(ctx)` API is already ALS-compatible (takes a context object). An ALS-backed `getRequestLogger()` is a drop-in addition when route count justifies it, not now (§11). See §2.

---

## 6. Rollback (ADR-0013 §30, §55)

M5 is purely additive: new files + new exports + new routes. There is no schema, no migration, no auth-flow change, no breaking API change. Revert is `git revert <commit>`; no data, no durable state to restore. The only behavioral change on an existing route is `/api/health` returning a richer JSON body (broader, still comprehensible to the M2 smoke test expectations).

---

## 7. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Founder | (founder directive: best decisions, go to the end) | ⏳ auto-proceeded | 2026-07-20 |