# M4-2 — Security Hardening (CSP, rate-limit, input validation, security.txt) + rebrand audit scrub

> **Status:** ✅ Implemented (Session 016, 2026-07-15)
> **Author:** Session 016 (2026-07-15)
> **Risk:** MEDIUM per ADR-0013 §42 (security-hardening; no schema, no feature, header-behavior change)

---

## 1. Background — the gap

`PROJECT_BACKLOG.md` (line 56) names **M4.2** as the next secret-free sprint work: CSP header, rate-limit middleware, Zod input validation on `/api/users` + `/api/auth/*`, and `/.well-known/security.txt`. Pre-M4.2:

- `next.config.mjs` set five security headers but **no Content-Security-Policy** — the single most important header against XSS/data-exfil was absent.
- No rate limiting on any API route — an unauthenticated caller could hammer `/api/auth/session` to probe session validity, and an admin could flood `/api/users`.
- No reusable input-validation harness — future routes accepting query/body params would reach the DB raw unless each author re-implemented validation.
- No RFC 9116 security contact point (`security.txt`).

Separately, the de-AI/rebrand sweep left one straggler: three audit-evidence JSON files (`audit-after.json`, `audit-after-2.json`, `audit-baseline.json`) still embedded the old `@hawza/core` scope in recorded dependency paths — a standing-instruction violation (scrub all Hawza names including history; see `MEMORY.md`). M4-2 closes that too.

## 2. Definition of Ready (ADR-0013 §39)

| Item | Status |
|---|---|
| Goal is clear and singular | ✅ Land the four M4.2 hardening items + scrub `@hawza/core` from audit evidence |
| Bounded scope | ✅ `apps/web` only (config, two route handlers, two lib helpers, one well-known route, two tests) + three evidence JSONs. No schema, no new feature, no DB. |
| Spec exists | ✅ This file. |
| Risk classified | ✅ MEDIUM — see §5. |
| Test strategy | ✅ New Vitest suites pin limiter + validator behavior; `pnpm verify` (lint/type/test/build) gates. |
| Rollback plan | ✅ `git revert <commit>`; no migration, no data backfill. |
| Evidence requirement | ✅ This file + updated `checklist.md` + green `pnpm verify`. |

## 3. Acceptance criteria

1. `next.config.mjs` emits a `Content-Security-Policy` header on all routes (`/((.*))`).
2. A valid CSP is served with `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; inline styles allowed only (`'unsafe-inline'`) because Next/Tailwind require it in v1.
3. `/api/users` is rate-limited per admin (30 burst / 1 req·s⁻¹ sustained).
4. `/api/auth/session` is rate-limited per IP (60 burst / 1 req·s⁻¹ sustained).
5. `parseQuery` / `parseBody` helpers exist, return the `requireRole`-style discriminated union, and `/api/users` validates its query string defensively.
6. `/.well-known/security.txt` serves RFC 9116 fields with `Content-Type: text/plain; charset=utf-8`.
7. No `@hawza/core` remains in any tracked file (audit-evidence JSON paths rebranded to `@learning-platform/core`).
8. `pnpm verify` is green; new tests pass.

## 4. Specification (ADR-0013 §40)

### 4.1 File changes

| File | Change | Risk |
|---|---|---|
| `apps/web/next.config.mjs` | Add `Content-Security-Policy` to existing `headers()` array | LOW — additive header; v1 static CSP |
| `apps/web/src/lib/rate-limit.ts` (NEW) | In-memory token bucket + `ipKey()` for Node handlers | LOW — isolated helper |
| `apps/web/src/lib/validation.ts` (NEW) | `parseQuery` / `parseBody` Zod guards | LOW — isolated helper |
| `apps/web/src/app/api/users/route.ts` | Accept `NextRequest`; add `rateLimit` + `parseQuery` (strict empty schema) | LOW — guard before existing logic |
| `apps/web/src/app/api/auth/session/route.ts` | Accept `NextRequest`; add IP `rateLimit` | LOW — guard before existing logic |
| `apps/web/src/app/.well-known/security.txt/route.ts` (NEW) | RFC 9116 contact point | NONE — new public route |
| `apps/web/tests/rate-limit.test.ts` (NEW) | Bucket capacity / refill / per-key isolation / 429 shape | — |
| `apps/web/tests/validation.test.ts` (NEW) | Happy path + rejection → 400; malformed JSON → 400 | — |
| `evidence/M4-security/audit-{after,after-2,baseline}.json` | `@hawza/core` → `@learning-platform/core`; strip stale BOM from baseline | NONE — evidence text |

### 4.2 Architectural decision — rate limiter placement

Next.js middleware runs on the **Edge runtime** (no `runtime` override in `apps/web/src/middleware.ts`). In-memory `Map` state and timers are not durable there, so a token-bucket in middleware is unreliable. The limiter therefore lives in **Node-runtime route handlers** (`apps/web/src/lib/rate-limit.ts`). This honors the constraints:

- OSS-first / self-hosted (C3): no Redis / SaaS dependency.
- Single VPS ≤ 4 GB (C1): one Node process → one bucket map is effective; the `rateLimit()` call-site shape is unchanged if a shared store is ever needed for multi-process.

### 4.3 CSP policy (v1)

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self' fonts.gstatic.com; connect-src 'self';
frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'
```

- `'unsafe-inline'` on styles is required by Next + Tailwind inline style attributes in v1; nonces are parked.
- `HSTS` deliberately **not** set — only valid over TLS; v1 dev/preview is HTTP. Enable behind the M6 reverse proxy once TLS is live.

### 4.4 security.txt

Route handler (no `apps/web/public/` dir exists in v1). Fields: `Contact: mailto:security@example.com`, `Expires: 2027-07-15…`, `Preferred-Languages: fa, en`, `Canonical: /.well-known/security.txt`. `Contact` is a placeholder pending a real address from the founder.

## 5. Risk classification (ADR-0013 §42)

| Dimension | Rating | Rationale |
|---|---|---|
| Blast radius | MEDIUM | CSP affects every route's framing/exec; rate-limit can shape all admin + session traffic. |
| Reversibility | HIGH | Single revert; no migration, no flags. |
| Security impact (before) | MEDIUM | No CSP, no rate-limit, no security.txt. |
| Security impact (after) | LOW | Strict CSP, per-identity rate-limits, RFC 9116 contact, rebrand gap closed. |
| Performance impact | LOW | In-memory token bucket is O(1) per request; CSP is a header, sub-ms. |
| Schedule pressure | LOW | No DB, parallel-safe with M4/M5. |
| **Overall** | **MEDIUM** | No founder approval mandatory under §41, but surfaced and recorded. |

## 6. Rollback (ADR-0013 §30, §55)

- `git revert <commit>` — restores the previous `next.config.mjs`, route handlers, and audit JSON; the two new lib/test files are removed by the revert. No DB migration. No data backfill. Worst case: M4.2 hardening disappears, service stays up (it was up pre-M4.2).

## 7. Evidence (ADR-0013 §5, §36)

- This file (`M4-2-hardening.md`) — DoR/spec/risk/rollback.
- `apps/web/tests/rate-limit.test.ts`, `apps/web/tests/validation.test.ts` — behavior pins.
- `pnpm verify` output (captured to `commands.txt` / `notes.md`).
- `audit-after.json` / `audit-after-2.json` / `audit-baseline.json` — rebranded; `git grep hawza` returns none.

## 8. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Founder | Dani | ⏳ (auto-proceeded per founder directive 2026-07-15: full access, no questions, push per plan at best quality) | 2026-07-15 |
