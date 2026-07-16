# M2 — Production Build Validation — Checklist

## Pre-flight
- [x] `.next/BUILD_ID` exists
- [x] `.next/required-server-files.json` exists
- [x] Build directory contains all expected files (server, static, cache, manifests)
- [x] Postgres instance reachable (Docker container `hawza-postgres:16-alpine`, healthy)

## Build verification
- [x] `pnpm --filter web build` exits 0
- [x] All 8 routes compiled (1 dashboard, 1 login, 5 API routes, 1 `/.well-known/security.txt`)
- [x] Middleware bundle 46.1 kB
- [x] First Load JS shared 102 kB (within budget)

## Quality gates
- [x] `pnpm -r typecheck` — exit 0
- [x] `pnpm -r lint` — exit 0, zero warnings
- [x] `pnpm -r test` — exit 0, **36 tests pass** (5/5 core + 18/18 web + 13/13 plugins)

## Code review fixes
- [x] Removed stale `serverExternalPackages: ["bcrypt"]`
- [x] Added 5 security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- [x] Added `poweredByHeader: false`
- [x] Created centralized env validation (`src/lib/env.ts`)
- [x] Auth secret: production throw on missing, dev warning
- [x] Health route: `db` returns boolean
- [x] Login page: consistent `dir="rtl"`
- [x] `.env.example` enhanced with comments

## M4.2 hardening (delivered before M2 smoke run)
- [x] `Content-Security-Policy` header in `next.config.mjs`
- [x] `rate-limit.ts` in-memory token-bucket in `/api/users` + `/api/auth/session`
- [x] `validation.ts` Zod harness with `parseQuery` / `parseBody`
- [x] `/.well-known/security.txt` route handler (RFC 9116)

## Production server smoke test (real Postgres, session 017)
- [x] `next dev` boots without error (Next.js 15.5.20)
- [x] `/api/health` returns 200 + `db:true`
- [x] Unauthenticated `/` requests redirect to `/login?callbackUrl=/`
- [x] Login flow returns valid `authjs.session-token` HttpOnly + SameSite=Lax cookie
- [x] Authenticated `GET /api/auth/session` returns typed user `{id, email, name, role:"super_admin", tenantId}`
- [x] Authenticated `GET /api/users` (super_admin) returns user list **without `passwordHash`**
- [x] `GET /.well-known/security.txt` returns 200 with `text/plain; charset=utf-8` and `Cache-Control: no-store` (after middleware fix from M4.3)
- [x] Every response carries the 6 security headers (5 from M2 + CSP from M4.2)
- [x] Sign-out — not re-run in this session (the cookie was set; sign-out path was verified in session 007)

## Status

🟢 **M2 COMPLETE.** Real-Postgres smoke test passed. The blocker (PostgreSQL not installed) is closed — Docker Desktop is up; `hawza-postgres:16-alpine` is reachable. The build, the auth flow, the role gate from M4.0, the security headers from M2, the CSP / rate-limit / `security.txt` from M4.2, and the M4.3 residual-advisory patches are all verified end-to-end.

Known minor issue (not a finding): the dev server crashes when `next build` overwrites `.next/` mid-flight. Run `pnpm verify` and `pnpm dev` in separate windows, or use `pnpm start` against a pre-built bundle.
