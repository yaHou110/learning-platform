import { signIn } from "@/auth";
import { headers } from "next/headers";
import { safeCallbackUrl } from "@/lib/redirect";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}): Promise<JSX.Element> {
  const sp = await searchParams;
  const error = sp?.error;
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  // Use NEXTAUTH_URL if available, otherwise fall back to computed origin
  const nextAuthUrl = env.NEXTAUTH_URL;
  const origin = nextAuthUrl ?? (host ? `${proto}://${host}` : "");
  // Open-redirect defense (HIGH): see lib/redirect.ts. `signIn`'s redirectTo
  // flows straight into a 302 with no same-origin check, so a crafted
  // callbackUrl is collapsed to "/" unless it resolves to this app's origin.
  const callbackUrl = safeCallbackUrl(sp?.callbackUrl, origin);

  async function action(formData: FormData): Promise<void> {
    "use server";
    const tenantSlug = String(formData.get("tenantSlug") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    await signIn("credentials", {
      tenantSlug,
      email,
      password,
      redirectTo: callbackUrl,
    });
  }

  return (
    <main dir="rtl" lang="fa" className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">ورود</h1>
      <form action={action} className="flex flex-col gap-4">
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
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            نام کاربری یا رمز عبور اشتباه است.
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800"
        >
          ورود
        </button>
      </form>
      {process.env.NODE_ENV !== "production" ? (
        <p className="mt-6 text-xs text-gray-500">
          حساب نمونه: مرکز <code>demo</code>، ایمیل <code>admin@lp.local</code>، رمز <code>changeme</code>
        </p>
      ) : null}
    </main>
  );
}
