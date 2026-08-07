# 🚨 Learning Platform - Bug Analysis & Fix Report

## 📊 Project State
- **Repository:** yaHou110/learning-platform
- **Default Branch:** main
- **Open Issues:** 11
- **Open PRs:** 10+ (mostly Dependabot)
- **Languages:** TypeScript (72.6%), JavaScript (13.8%), PowerShell (7.1%), Shell (4.5%), Dockerfile (1.6%), CSS (0.4%)
- **Status:** Production (Vercel: https://learning-platform-web-theta.vercel.app)

---

## ✅ ISSUE #1: Login Redirect Hang (FIXED)

### 🔴 Problem
```
User logs in → signIn() call hangs → page frozen for ~10-30s → no feedback → no redirect
```

**Root Causes:**
1. No timeout on `signIn('credentials', ...)` - if Auth.js stalls, user waits forever
2. Redirect happens via `window.location.href = '/dashboard'` without session validation
3. Race condition: redirect fires before session cookie is created
4. No retry logic for transient failures
5. Generic error messages: "نام کاربری یا رمز عبور اشتباه است" for all failures

### ✅ Solution Implemented

**Files Modified:**
- `apps/web/src/app/login/LoginForm.tsx` (completely rewritten)
- `apps/web/src/app/login/page.tsx` (added pre-auth redirect)
- `apps/web/src/auth.ts` (added try-catch + debug logging)

**Key Changes:**

1. **Timeout Protection (10s)**
   ```typescript
   const result = await Promise.race([
     signIn('credentials', { ... }),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('signin_timeout')), 10000)
     )
   ]);
   ```

2. **Session Validation Before Redirect**
   ```typescript
   const checkSession = async (): Promise<boolean> => {
     const res = await fetch('/api/auth/session');
     if (!res.ok) return false;
     const session = await res.json();
     return Boolean(session?.user?.id);
   };
   
   const sessionValid = await waitForSession(5); // 5 attempts max
   if (!sessionValid) {
     // retry or error
   }
   ```

3. **Retry Logic (3 attempts, exponential backoff)**
   ```typescript
   const MAX_RETRIES = 3;
   const RETRY_DELAY_MS = 500;
   
   await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
   ```

4. **Specific Error Messages**
   ```typescript
   const errorMap = {
     unknown_tenant: 'شناسه مرکز نادرست است.',
     unknown_user: 'این ایمیل در سیستم ثبت نشده است.',
     bad_password: 'رمز عبور نادرست است.',
     inactive: 'این حساب غیرفعال است.',
     signin_timeout: 'درخواست برای ورود بیش‌ازحد طول کشید.',
   };
   ```

5. **Better UX: Loading Spinner + Disabled Inputs**
   - Visual feedback during submission
   - Prevent double-submission
   - Error boundary with `role="alert"`

6. **Server-side Guard (Already Logged In)**
   ```typescript
   const session = await auth();
   if (session?.user) redirect('/dashboard');
   ```

7. **Cache Busting**
   ```typescript
   export const revalidate = 0; // No caching
   export const dynamic = 'force-dynamic';
   ```

**Commit:** ba4d1c0d66a807818c6b2d20551d789d0a9a5a45

---

## 🔍 Identified Remaining Issues (Not Yet Fixed)

### ⚠️ ISSUE #2: Session Deactivation Gap (Medium Risk)

**Problem:**
- User logs in → gets JWT token valid for X hours
- Admin deactivates user account
- User continues to access dashboard for up to X hours (until token expires)

**Current Mitigation:**
- `auth.ts` has `session` callback that checks `identity.checkUserActive()` per request
- Cost: ~1 DB query per request (sub-ms)
- **Limitation:** Only checked on page/route load, not on client navigation

**Fix Needed:**
```typescript
// Periodic re-check in middleware or as a client-side hook
setInterval(() => {
  fetch('/api/auth/session').then(r => r.json()).then(session => {
    if (!session?.user) signOut();
  });
}, 60000); // Every minute
```

---

### ⚠️ ISSUE #3: Missing Error Boundary on Auth Routes

**Problem:**
- `/api/auth/callback/credentials` might throw uncaught errors
- No try-catch wrapper for edge cases

**Current State:**
- `authorize()` has basic try-catch
- **Missing:** Error logging to external service (Sentry, etc.)

**Fix Needed:**
```typescript
// In auth.ts authorize callback
try {
  // ...
} catch (err) {
  // Log to external service
  captureException(err, { tags: { auth: 'credentials' } });
  return null;
}
```

---

### ⚠️ ISSUE #4: No CSRF Protection on Auth Forms

**Problem:**
- Login form doesn't include CSRF token
- Susceptible to CSRF attacks if deployed without proper SameSite cookie config

**Current State:**
- Auth.js handles CSRF internally via session cookies
- **Assumption:** CSRF token in callback URL (implicit)

**Fix Needed:**
```typescript
// Verify SameSite=Strict in next-auth config
session: { 
  strategy: 'jwt',
  maxAge: 24 * 60 * 60, // 24 hours
}

// Add to cookies config if available
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax', // or 'strict'
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
}
```

---

### ⚠️ ISSUE #5: Middleware Session Check Race Condition

**Problem:**
- Middleware checks for `__Secure-authjs.session-token` or `authjs.session-token` (cookie presence only)
- Does NOT validate token signature or expiry in Edge runtime
- User with expired cookie → passes middleware → redirected by page's `auth()` call
- 2-request roundtrip delay

**Current State:**
```typescript
// middleware.ts lines 42-45
const sessionCookie = 
  request.cookies.get('__Secure-authjs.session-token') ??
  request.cookies.get('authjs.session-token');
const hasSession = Boolean(sessionCookie);
```

**Why Not Fixed in Edge:**
- Auth.js v5 beta.31 uses CompressionStream/DecompressionStream (Node.js APIs)
- Not available in Cloudflare Workers / Edge Runtime
- See ADR-0005 for rationale

**Workaround:**
- Page-level redirect is sufficient (cost: 1 extra request)
- Could be optimized with custom Edge middleware if needed

---

### ⚠️ ISSUE #6: Password Reset / Forgot Password Not Implemented

**Problem:**
- No forgot password flow
- Users locked out if they forget credentials
- No email verification

**Current State:**
- Only hardcoded demo account: `demo / admin@lp.local / changeme`
- No user self-service password recovery

**Fix Needed:**
1. Create `/login/forgot-password` page
2. Implement email-based reset link
3. Add reset token storage (db: `password_reset_tokens`)
4. Secure token expiry (15 min)
5. Rate limiting on reset requests

---

### ⚠️ ISSUE #7: No Rate Limiting on Login Attempts

**Problem:**
- Brute force attack possible
- No slowdown after N failed attempts
- No IP-based throttling

**Current State:**
- Timing equalization on password check (good)
- **Missing:** Rate limiting middleware

**Fix Needed:**
```typescript
// Add to middleware or route handler
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min
});

const { success } = await ratelimit.limit(`login:${email}`);
if (!success) {
  return new Response('Too many login attempts', { status: 429 });
}
```

---

### ⚠️ ISSUE #8: No Multi-Factor Authentication (MFA)

**Problem:**
- High-value accounts (admin) only protected by password
- No TOTP/SMS/email verification

**Current State:**
- `role` field exists (super_admin, center_admin, teacher, student)
- **Missing:** MFA enforcement for admin roles

**Fix Needed:**
1. Add TOTP support (e.g., `speakeasy` library)
2. Create MFA setup page
3. Require MFA for super_admin / center_admin
4. Handle MFA callback in auth flow

---

### ⚠️ ISSUE #9: Dashboard Redirect Path Not Checked

**Problem:**
- Login page redirects to `/dashboard`
- But what if user accesses `/login?callbackUrl=/admin/secret`?
- Could redirect to unintended route if not validated

**Current State:**
- Middleware sets `callbackUrl` (line 85)
- **Missing:** Validation that callbackUrl is safe (not external URL)

**Fix Needed:**
```typescript
// In middleware.ts
const callbackUrl = pathname;
const isSafeUrl = callbackUrl.startsWith('/') && !callbackUrl.includes('..');
if (isSafeUrl) {
  loginUrl.searchParams.set('callbackUrl', callbackUrl);
}
```

---

### ⚠️ ISSUE #10: Database Connection Pooling Under Load

**Problem:**
- Each login call = DB query to verify password
- No connection pooling configured (might be in packages/core/db)
- High traffic → connection exhaustion

**Current State:**
- Using Drizzle ORM
- **Assumption:** PgBouncer or Railway manages pooling

**Fix Needed:**
1. Verify `DATABASE_URL` uses PgBouncer (transaction mode)
2. Set connection pool size in env var
3. Add connection metrics monitoring
4. Rate limit auth attempts per user

---

### ⚠️ ISSUE #11: Session Storage on JWT (No Revocation)

**Problem:**
- JWT tokens are stateless
- No server-side "blacklist" for invalidated tokens
- Users who sign out still have valid JWT until expiry

**Current State:**
- Session strategy: `jwt`
- Per-request `checkUserActive()` call (mitigation)
- **Limitation:** Signing out doesn't immediately invalidate token

**Fix Needed:**
1. Maintain `jwt_blacklist` table in DB
2. On signOut, add token to blacklist with expiry
3. Check blacklist in `session` callback
4. Cleanup expired entries nightly

```typescript
// In session callback
const isBlacklisted = await db.query(
  'SELECT 1 FROM jwt_blacklist WHERE token = $1',
  [token.jti]
);
if (isBlacklisted) return session without user;
```

---

## 🎯 Fix Priority Ranking

| # | Issue | Severity | Effort | Impact |
|---|-------|----------|--------|--------|
| 1 | Login Redirect Hang | 🔴 CRITICAL | ✅ DONE | Users can't log in |
| 2 | Password Reset | 🔴 CRITICAL | 🟠 Medium | Users locked out |
| 3 | Rate Limiting | 🟠 HIGH | 🟢 Low | Brute force risk |
| 4 | Open Redirect (callbackUrl) | 🟠 HIGH | 🟢 Low | OWASP A10 |
| 5 | Session Revocation | 🟡 MEDIUM | 🟠 Medium | Signout lag |
| 6 | MFA | 🟡 MEDIUM | 🔴 High | Admin account risk |
| 7 | Session Deactivation Gap | 🟡 MEDIUM | 🟢 Low | Immediate check |
| 8 | Error Logging | 🟡 MEDIUM | 🟢 Low | Debug harder |
| 9 | DB Connection Pooling | 🟡 MEDIUM | 🟢 Low | Scalability |
| 10 | CSRF Protection | 🟢 LOW | 🟢 Low | Auth.js covers |
| 11 | Middleware Race Condition | 🟢 LOW | 🟢 Low | Acceptable tradeoff |

---

## 📝 Prompt for Next AI Agent

**Context:** This is a full-stack learning platform (LMS) built with Next.js, TypeScript, Drizzle ORM, and Auth.js v5. Login was hanging due to missing timeout/validation. Issue #1 is fixed.

**Your Task:** Fix issues #2-#11 in priority order. Here are specifics:

### Priority 1: Password Reset (CRITICAL)
- **File:** Create `apps/web/src/app/login/forgot-password/page.tsx`
- **File:** Create `apps/web/src/app/login/reset-password/[token]/page.tsx`
- **File:** Create `apps/web/src/app/api/auth/forgot-password/route.ts` (POST)
- **File:** Create `apps/web/src/app/api/auth/reset-password/route.ts` (POST)
- **DB Migration:** Add table `password_reset_tokens(id, user_id, token, expires_at, created_at)`
- **Email:** Use existing email service (if available) or mock in dev
- **Constraints:**
  - Token valid for 15 minutes
  - Rate limit: 1 reset email per 10 minutes per email
  - Token should be 32-char random hex
  - UI should be RTL-friendly (Persian)

### Priority 2: Rate Limiting (HIGH)
- **File:** Modify `apps/web/src/app/api/auth/callback/credentials/route.ts` (if exists) or create it
- **Tool:** Use @upstash/ratelimit or implement custom with Redis
- **Rules:**
  - 5 failed attempts → 15 min lockout
  - Show countdown timer to user
  - Per-email + per-IP tracking
  - Logging on lockout

### Priority 3: Open Redirect Fix (HIGH)
- **File:** Modify `apps/web/src/middleware.ts` (line 84-86)
- **Logic:** Validate `callbackUrl` is internal route only
- **Test:** Try `/login?callbackUrl=https://evil.com` → should ignore

### Priority 4-11: Other Issues
- Create corresponding ADRs for decisions
- Add tests for each fix
- Document in this file

**Files You Have Access To:**
- All source code in the repo
- Database schema (packages/core/src/db/schema)
- Existing utilities (packages/core/src)
- Environment config (apps/web/src/lib/env.ts)

**Testing:** Run `pnpm verify` after each fix (lint + type + test + build)

**Commit Format:** `fix(auth): [issue number] [description]`

---

## 📊 Metrics & Monitoring

### Current Deployment
- **Web:** Vercel (https://learning-platform-web-theta.vercel.app)
- **DB:** Railway (PostgreSQL)
- **Monitoring:** Likely via Vercel Analytics
- **Logs:** Check Vercel dashboard

### Suggested Additions
- [ ] Sentry for error tracking
- [ ] Datadog for performance monitoring
- [ ] Auth event logging (login/logout/failed attempts)
- [ ] Email delivery tracking

---

## 🔐 Security Checklist

- [x] Password hashing (bcrypt, cost 12)
- [x] Timing attack equalization
- [x] HTTP-only cookies
- [x] Secure flag in production
- [ ] Rate limiting on auth endpoints
- [ ] OWASP A01 fixed (Open Redirect)
- [ ] Password reset token rotation
- [ ] MFA for admin accounts
- [ ] Session blacklist on signout
- [ ] Audit logging for sensitive ops

---

## 📞 Contact & References

- **Repository:** https://github.com/yaHou110/learning-platform
- **Auth Design:** See `docs/decisions/ADR-0005-auth-session-design.md`
- **This Report:** `docs/decisions/ADR-0006-login-redirect-improvements.md`
- **Next Steps:** Follow prompt above for remaining issues
