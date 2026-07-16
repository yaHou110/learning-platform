# M2 — Production Build Validation — Notes

## What we did

### Session 009 (initial pass)
1. **Pre-flight verified**: `.next/BUILD_ID` exists, build directory is complete with all expected manifests and bundles.
2. **Code review**: Read all source files across the monorepo. Identified and fixed 8 issues (see checklist).
3. **Quality gates re-run**: All pass (typecheck, lint, test, build).
4. **Build verified**: `next build` produces 7 routes, middleware 42.7 kB, first-load JS 99.9 kB.

### Session 017 (smoke test against real Postgres)
1. **Docker Desktop started** (was off). Existing `hawza-postgres:16-alpine` and `hawza-adminer` containers came up healthy.
2. **Migrations applied** (idempotent — no new migrations on this snapshot).
3. **Seed re-run** for `admin@lp.local` (a stale row from a prior run had an unknown password hash; deleted and re-seeded).
4. **Dev server started** with `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXTAUTH_URL` set in the shell.
5. **Smoke walk** through `/api/health` → `/api/auth/csrf` → `/api/auth/callback/credentials` (login) → `/api/auth/session` → `/api/users` → `/.well-known/security.txt`.
6. **Bug found and fixed in-flight:** `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. Added `isSecurityTxt` to the public-route set in `apps/web/src/middleware.ts`. After-fix: 200 OK, no auth, correct Content-Type.

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

Also added `poweredByHeader: false` to hide the Next.js version string. The 6th security header (`Content-Security-Policy`) was added in M4.2.

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

## Why the seed had to be re-run

The seed script uses `onConflictDoNothing` on `(tenantId, email)`, so a pre-existing `admin@lp.local` row from a previous run was **not** updated. The bcrypt cost factor in `packages/core/src/auth/credentials.ts` is 12 (`BCRYPT_COST = 12`); the prior run may have used a different cost. The new password `changeme` was hashed at the current cost, so the auth route could verify. **Re-seeding the same user is only safe if the existing passwordHash is unknown / from a different run**; the same-idempotency rule applies (it just means re-seeding is a no-op if the row already exists). For production, the rule is "the seed script only runs in dev."

## Why `/.well-known/security.txt` was being redirected (and the fix)

The M4.2 spec created the route and the route handler. The middleware, however, had only two public-route exceptions: `isApiAuthPage` (Auth.js endpoints) and `isHealthPage` (`/api/health`). Anything else, including `/.well-known/security.txt`, fell through to the `if (!token)` block and was redirected to `/login?callbackUrl=…`.

This is a real bug, not a cosmetic one: the entire purpose of RFC 9116 is to let security researchers reach a contact point **without** authentication. If the file is gated, it's not RFC 9116 compliant.

Fix is a 1-line addition:

```typescript
// RFC 9116 security.txt — public; must not require auth.
const isSecurityTxt =
  request.nextUrl.pathname === "/.well-known/security.txt";

if (isApiAuthPage || isHealthPage || isSecurityTxt) {
  return NextResponse.next();
}
```

The `security.txt` Contact address remains a placeholder (`security@example.com`) pending the founder. Other fields are RFC 9116 compliant (`Expires` 2027-07-15 < 1 year out, `Preferred-Languages: fa, en`, `Canonical` set).

## Known minor issue (not a finding)

The dev server crashes when `next build` (run via `pnpm verify`) overwrites `.next/` mid-flight. This is a Next.js + dev/build coexistence issue, not a code bug. Workaround: stop `pnpm dev` before running `pnpm verify`, or run `pnpm start` against a pre-built production bundle. Captured for the M5+ ops doc.

## Build output comparison

| Metric | Pre-M2 | M2 (session 009) | M4.2 (session 016) | M4.3 (this session) |
|---|---|---|---|---|
| Middleware size | 42.5 kB | 42.7 kB | 46 kB | 46.1 kB |
| First Load JS | 99.9 kB | 99.9 kB | 102 kB | 102 kB |
| Routes | 7 | 7 | 8 (+security.txt) | 8 |
| Tests | 18 | 18 | 36 | 36 |
| Lint warnings | 0 | 0 | 0 | 0 |
| CSP header | — | — | ✅ | ✅ |
| Rate limit | — | — | ✅ | ✅ |
| `security.txt` public | n/a | n/a | ❌ (bug) | ✅ (fixed) |

## Status

🟢 **M2 COMPLETE.** Real-Postgres smoke test passed. The blocker (PostgreSQL not installed) is closed — Docker Desktop is up; `hawza-postgres:16-alpine` is reachable. M5+ (hosting pick, multi-tenant model, PWA, deployment/CI-CD) is parked on founder decisions.
