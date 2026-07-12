# M2 — Production Build Validation — Notes

## What we did

1. **Pre-flight verified**: `.next/BUILD_ID` exists, build directory is complete with all expected manifests and bundles.
2. **Code review**: Read all source files across the monorepo. Identified and fixed 8 issues (see checklist).
3. **Quality gates re-run**: All pass (typecheck, lint, test, build).
4. **Build verified**: `next build` produces 7 routes, middleware 42.7 kB, first-load JS 99.9 kB.

## What is blocked

**PostgreSQL 16 is not installed** on this dev machine, and installation requires admin privileges that are not available in the current shell.

### Installation attempts
| Method | Result |
|---|---|
| `winget install PostgreSQL.PostgreSQL.16` | Downloaded but installer timed out (interactive, needs GUI) |
| `choco install postgresql16` | "Access to the path ... is denied" (needs elevated shell) |

### Impact
The `next start` smoke test (sections 2.2–2.7 of the M2 task) cannot proceed without a running PostgreSQL instance. The health endpoint will return `503` and login will fail without a database.

### Resolution options
1. **Run cmd as Administrator** and re-run `choco install postgresql16` or `winget install PostgreSQL.PostgreSQL.16`
2. **Install Docker Desktop** (also needs admin) and use the existing `docker-compose.yml`
3. **Use a remote PostgreSQL** — set `DATABASE_URL` to point at an accessible instance

## Code review findings (and fixes)

### Fix 1: Stale `serverExternalPackages: ["bcrypt"]`
The `next.config.mjs` still referenced `bcrypt` (native C++ bindings) in `serverExternalPackages`, but M1 switched to `bcryptjs` (pure JS). Removed the stale entry. Harmless but misleading.

### Fix 2: Security headers (free, high-impact)
Added 5 security headers via `next.config.mjs` `headers()`:
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — legacy XSS filter (defense-in-depth)
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — disables unused APIs

Also added `poweredByHeader: false` to hide the Next.js version string.

### Fix 3: Centralized env validation (`src/lib/env.ts`)
Previously, `AUTH_SECRET` had a hardcoded fallback string duplicated in `auth.ts` and `middleware.ts`. In production, if `AUTH_SECRET` is not set, the app would silently use a predictable secret — a critical security issue.

New behavior:
- **Production**: throws immediately at startup with a clear error message
- **Development**: uses safe defaults with a `console.warn`

### Fix 4: Health route `db` field type
The `db` field returned `"ok"` or `"fail"` (strings), but the backlog spec expected `true`/`false` (booleans). Changed to return `boolean` for consistency and easier client-side checking. Also added a `try/catch` to handle unexpected errors gracefully.

### Fix 5: Login page RTL consistency
The login page `<main>` was missing `dir="rtl"`, while the dashboard had it. Added for consistency. The root `<html dir="rtl">` already propagates, but explicit is better than implicit.

### Fix 6: `.env.example` improvements
Added comments explaining each variable, a note about never committing secrets, and a command to generate a proper `AUTH_SECRET` (`openssl rand -base64 32`).

## Build output comparison

| Metric | Before | After | Delta |
|---|---|---|---|
| Middleware size | 42.5 kB | 42.7 kB | +0.2 kB (security headers) |
| First Load JS | 99.9 kB | 99.9 kB | no change |
| Routes | 7 | 7 | no change |
| Tests | 18 | 18 | no change |
| Lint warnings | 0 | 0 | no change |

## Status

🟡 **M2 PARTIAL — code review + quality fixes complete. Smoke test blocked by PostgreSQL.**
