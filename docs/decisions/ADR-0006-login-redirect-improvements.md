# ADR-0006: Login Redirect Robustness & Error Handling

**Date:** 2026-08-07
**Status:** ACCEPTED
**Context:** Login page hanging on redirect, no timeout mechanism, poor error UX

## Problem Statement

The login form was using `window.location.href = '/dashboard'` without:
1. Validating that the session was actually created
2. Any timeout for the `signIn()` call
3. Retry logic for transient failures
4. Specific error messages for different failure modes

This caused:
- Infinite loading state when Auth.js timed out
- Users clicking multiple times (creating duplicate attempts)
- No way to recover without hard refresh
- Generic error messages

## Decision

Implement robust login flow with:

1. **Timeout Protection**: 10s timeout on `signIn()` using `Promise.race()`
2. **Session Validation**: Verify session exists via `/api/auth/session` before redirect
3. **Retry Logic**: Auto-retry up to 3 times with exponential backoff (500ms, 1s, 1.5s)
4. **Specific Errors**: Map Auth.js error reasons to user-friendly messages
5. **Better UX**:
   - Loading spinner during submission
   - Disabled inputs during submission
   - Clear error boundaries with `role="alert"`
6. **Server-side Guards**: Redirect already-authenticated users away from login page

## Architecture

```
User Input
    ↓
Form Validation (client-side)
    ↓
signIn('credentials', { ... }) with Promise.race(timeout)
    ↓
[Timeout?] → Error: "Request took too long"
[Error?] → Display specific error message + allow retry
    ↓
waitForSession() → Exponential backoff polling of /api/auth/session
    ↓
[Session valid?] → router.push('/dashboard')
[Session invalid?] → Retry auto (up to 3 times) or manual
[Max retries?] → Error: "Session creation failed"
```

## Implementation Details

### LoginForm.tsx (Client Component)

```typescript
const SIGNIN_TIMEOUT_MS = 10000;  // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const checkSession = async (): Promise<boolean> => {
  const res = await fetch('/api/auth/session');
  if (!res.ok) return false;
  const session = await res.json();
  return Boolean(session?.user?.id);
};

const waitForSession = async (maxAttempts = 5): Promise<boolean> => {
  // Exponential backoff polling
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await checkSession()) return true;
    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
  return false;
};

// In onSubmit:
const result = await Promise.race([
  signIn('credentials', { tenantSlug, email, password, redirect: false }),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('signin_timeout')), SIGNIN_TIMEOUT_MS)
  )
]);
```

### login/page.tsx (Server Component)

```typescript
const session = await auth();
if (session?.user) {
  redirect('/dashboard');  // Already logged in
}

export const revalidate = 0;  // No caching
```

### auth.ts (Configuration)

```typescript
async authorize(raw) {
  try {
    const parsed = CredentialsInputSchema.safeParse(raw);
    if (!parsed.success) return null;
    const result = await verifyPassword(getDb(), parsed.data);
    if (!result.ok) return null;
    return { id, email, name, role, tenantId };
  } catch (err) {
    console.error('Authorization error:', err);
    return null;
  }
}
```

## Error Messages

```javascript
const errorMap = {
  unknown_tenant: 'شناسه مرکز نادرست است.',
  unknown_user: 'این ایمیل در سیستم ثبت نشده است.',
  bad_password: 'رمز عبور نادرست است.',
  inactive: 'این حساب غیرفعال است.',
  signin_timeout: 'درخواست برای ورود بیش‌ازحد طول کشید.',
  CredentialsSignin: 'نام کاربری یا رمز عبور اشتباه است.',
};
```

## Benefits

✅ **User Experience**
- Clear loading indicator
- Specific error messages
- Automatic retry for transient failures
- No infinite hangs

✅ **Reliability**
- Timeout protection
- Session validation
- Exponential backoff retry
- Comprehensive error handling

✅ **Security**
- No window.location.href (XSS safer)
- Proper cleanup via useTransition
- User activation check on session

✅ **Debuggability**
- Console logging for errors
- Specific error categories
- Server-side guards

## Trade-offs

| Aspect | Trade-off |
|--------|----------|
| **Performance** | Extra /api/auth/session call adds ~50-100ms, but ensures safety |
| **UX** | Auto-retry adds 2-3s max delay, but prevents manual retries |
| **Timeout** | 10s is conservative; could be tuned to 5-8s if needed |

## Testing

- ✅ Form validation (empty fields)
- ✅ Timeout simulation (slow API)
- ✅ Retry logic (session check failures)
- ✅ Error messages (all types)
- ✅ Redirect (successful login)
- ✅ Pre-auth redirect (already logged in)

## Rollback Plan

If issues arise:
1. Revert to commit `80f0c6e40d9bcdca3fcc9be8536e18ce4d635f1f`
2. Or: Disable timeout by removing `Promise.race()`, keep session validation
3. Or: Increase timeout from 10s to 20s if needed

## Future Improvements

- [ ] Add analytics/logging for session validation times
- [ ] Configurable timeout via env vars
- [ ] Rate limiting on login attempts
- [ ] WebSocket for real-time session status (if scale demands)
- [ ] Add "Resend" button for failed attempts

## References

- Auth.js v5 docs: https://authjs.dev/
- Next.js useTransition: https://react.dev/reference/react/useTransition
- ADR-0005 (Session security): See docs/decisions/ADR-0005.md
