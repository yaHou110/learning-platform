'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTransition } from 'react';

const SIGNIN_TIMEOUT_MS = 10000; // 10 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const session = await res.json();
      return Boolean(session?.user?.id);
    } catch (err) {
      console.error('Session check failed:', err);
      return false;
    }
  }, []);

  const waitForSession = useCallback(
    async (maxAttempts = 5): Promise<boolean> => {
      let attempt = 0;
      while (attempt < maxAttempts) {
        const hasSession = await checkSession();
        if (hasSession) return true;
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt)); // exponential backoff
        }
      }
      return false;
    },
    [checkSession]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const tenantSlug = String(formData.get('tenantSlug') ?? '');
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    // Validate inputs
    if (!tenantSlug || !email || !password) {
      setError('تمام فیلدها الزامی هستند.');
      setLoading(false);
      return;
    }

    try {
      // Call signIn with timeout
      const signInPromise = signIn('credentials', {
        tenantSlug,
        email,
        password,
        redirect: false,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signin_timeout')), SIGNIN_TIMEOUT_MS)
      );

      let result;
      try {
        result = await Promise.race([signInPromise, timeoutPromise]);
      } catch (timeoutErr) {
        if ((timeoutErr as Error).message === 'signin_timeout') {
          setError('درخواست برای ورود بیش‌ازحد طول کشید. لطفا دوباره تلاش کنید.');
          setLoading(false);
          return;
        }
        throw timeoutErr;
      }

      // Handle signin errors
      if (result?.error) {
        const errorMap: Record<string, string> = {
          unknown_tenant: 'شناسه مرکز نادرست است.',
          unknown_user: 'این ایمیل در سیستم ثبت نشده است.',
          bad_password: 'رمز عبور نادرست است.',
          inactive: 'این حساب غیرفعال است.',
          CredentialsSignin: 'نام کاربری یا رمز عبور اشتباه است.',
        };
        setError(errorMap[result.error] || 'خطا در ورود. لطفا دوباره تلاش کنید.');
        setLoading(false);
        setRetryCount(0);
        return;
      }

      // Validate session was created
      const sessionValid = await waitForSession();
      if (!sessionValid) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(retryCount + 1);
          setError('جلسه تایید نشد. دوباره تلاش می‌شود...');
          // Retry automatically
          setTimeout(() => onSubmit(e), RETRY_DELAY_MS);
          return;
        }
        setError('ایجاد جلسه ناموفق بود. لطفا دوباره تلاش کنید.');
        setLoading(false);
        setRetryCount(0);
        return;
      }

      // Session is valid, now redirect
      setRetryCount(0);
      startTransition(() => {
        router.push('/dashboard');
        router.refresh();
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('خطای غیرمنتظره رخ داد. لطفا دوباره تلاش کنید.');
      setLoading(false);
      setRetryCount(0);
    }
  }

  const isSubmitting = loading || isPending;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>شناسه مرکز</span>
        <input
          name="tenantSlug"
          type="text"
          required
          autoComplete="organization"
          disabled={isSubmitting}
          className="rounded border border-gray-300 p-2 disabled:bg-gray-100"
          placeholder="demo"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>ایمیل</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={isSubmitting}
          className="rounded border border-gray-300 p-2 disabled:bg-gray-100"
          dir="ltr"
          placeholder="admin@lp.local"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>رمز عبور</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          disabled={isSubmitting}
          className="rounded border border-gray-300 p-2 disabled:bg-gray-100"
          dir="ltr"
          placeholder="••••••••"
        />
      </label>
      {error && (
        <div
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {isSubmitting && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{isSubmitting ? 'در حال ورود...' : 'ورود'}</span>
      </button>
    </form>
  );
}
