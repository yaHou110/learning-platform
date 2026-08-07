'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    const getCsrfToken = () => {
      const match = document.cookie.match(/(?:^|; )__Host-authjs\.csrf-token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : '';
    };
    const token = getCsrfToken();
    setCsrfToken(token);
    // Also listen for changes
    const interval = setInterval(() => {
      const t = getCsrfToken();
      setCsrfToken(t);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      tenantSlug: String(formData.get('tenantSlug') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirect: false,
    });

    if (result?.error) {
      setError('نام کاربری یا رمز عبور اشتباه است.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>شناسه مرکز</span>
        <input
          name="tenantSlug"
          type="text"
          required
          autoComplete="organization"
          className="rounded border border-gray-300 p-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>ایمیل</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-gray-300 p-2"
          dir="ltr"
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
          className="rounded border border-gray-300 p-2"
          dir="ltr"
        />
      </label>
      {csrfToken && (
        <input
          type="hidden"
          name="csrfToken"
          value={csrfToken}
        />
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? 'در حال ورود...' : 'ورود'}
      </button>
    </form>
  );
}