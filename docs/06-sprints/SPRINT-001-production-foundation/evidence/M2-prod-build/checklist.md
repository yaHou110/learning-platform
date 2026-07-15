# M2 — Production Build Validation — Checklist

## Pre-flight
- [x] `.next/BUILD_ID` exists
- [x] `.next/required-server-files.json` exists
- [x] Build directory contains all expected files (server, static, cache, manifests)
- [ ] Postgres instance reachable — **BLOCKED: PostgreSQL not installed**

## Build verification
- [x] `pnpm --filter web build` exits 0
- [x] All 7 routes compiled (1 page, 5 API routes, 1 login page)
- [x] Middleware bundle 42.7 kB (was 42.5 kB — security headers added)
- [x] First Load JS shared 99.9 kB (within budget)

## Quality gates
- [x] `pnpm -r typecheck` — exit 0
- [x] `pnpm -r lint` — exit 0, zero warnings
- [x] `pnpm -r test` — exit 0, 18 tests pass

## Code review fixes
- [x] Removed stale `serverExternalPackages: ["bcrypt"]`
- [x] Added 5 security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- [x] Added `poweredByHeader: false`
- [x] Created centralized env validation (`src/lib/env.ts`)
- [x] Auth secret: production throw on missing, dev warning
- [x] Health route: `db` returns boolean
- [x] Login page: consistent `dir="rtl"`
- [x] `.env.example` enhanced with comments

## Production server smoke test
- [ ] `next start` boots without error — **BLOCKED**
- [ ] `/api/health` returns 200 + `db:true` — **BLOCKED**
- [ ] Unauthenticated requests redirect to `/login` — **BLOCKED**
- [ ] Login flow returns valid session cookie — **BLOCKED**
- [ ] Authenticated `GET /api/auth/session` returns typed user — **BLOCKED**
- [ ] Authenticated `GET /api/users` returns user list — **BLOCKED**
- [ ] Authenticated `GET /` returns 200 with Persian RTL HTML — **BLOCKED**
- [ ] Sign-out clears the cookie — **BLOCKED**
- [ ] Static asset request returns 200 — **BLOCKED**
- [ ] `next start` exits 0 on SIGTERM — **BLOCKED**

## Status

🟡 **M2 PARTIAL — BLOCKED by PostgreSQL.** Code review fixes applied. Smoke test requires PostgreSQL 16 (admin privileges needed for installation).
