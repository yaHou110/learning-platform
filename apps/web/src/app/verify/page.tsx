import Link from "next/link";
import { credentials, catalog, identity } from "@learning-platform/core/api";
import { Icon } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { formatDate, getDictionary, getLocale } from "@/lib/i18n";
import type { Certificate } from "@learning-platform/core/api";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ hash?: string }>;
}): Promise<JSX.Element> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { hash } = await searchParams;

  let cert: Certificate | null = null;
  let errorMsg: string | null = null;
  let courseTitle: string | null = null;
  let studentName: string | null = null;

  if (hash) {
    try {
      cert = await credentials.verifyCertificate(hash.trim());
      if (cert) {
        const course = await catalog.getCourse(cert.tenantId, cert.courseId, { includeNonPublished: true });
        courseTitle = course?.title ?? "دوره تخصصی";
        const student = await identity.getUserById(cert.tenantId, cert.userId);
        studentName = student?.displayName ?? "دانش‌پژوه گرامی";
      }
    } catch {
      errorMsg = "گواهی‌نامه‌ای با این کد یا هش دیجیتال در سامانه یافت نشد.";
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      {/* Top Header */}
      <header className="mx-auto max-w-4xl flex items-center justify-between pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Icon.Mosque className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100">
              سامانه استعلام مدارک و گواهی‌نامه‌ها
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              مرکز فرهنگی تربیتی رویش
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher current={locale} label={dict.nav.changeLanguage} />
          <ThemeToggle lightLabel={dict.nav.themeLight} darkLabel={dict.nav.themeDark} />
        </div>
      </header>

      <div className="mx-auto max-w-2xl">
        {/* Search / Verification Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 mb-8">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🔍</span>
            <span>استعلام اصالت مدرک دیجیتال</span>
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-5">
            جهت تأیید اعتبار گواهی‌نامه صادرشده، کد هش (امضای دیجیتال) درج‌شده در پایین مدرک را وارد نمایید.
          </p>

          <form method="GET" action="/verify" className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="hash"
              defaultValue={hash ?? ""}
              required
              placeholder="کد هش یا امضای دیجیتال گواهی..."
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition"
            >
              بررسی اصالت مدرک
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {cert ? (
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl shadow-sm">
                ✓
              </span>
              <div className="flex-1">
                <span className="inline-block rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 px-3 py-0.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  مدرک معتبر و دارای اصالت است
                </span>
                <h2 className="mt-2 text-xl font-bold text-gray-950 dark:text-gray-100">
                  {studentName}
                </h2>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mt-1">
                  « {courseTitle} »
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs border-t border-emerald-200 dark:border-emerald-800/50 pt-4">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">تاریخ صدور: </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(locale, cert.issueDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">وضعیت مدرک: </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">فعال</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">شناسه مدرک: </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{cert.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 p-6 text-center">
            <span className="text-3xl mb-2 inline-block">⚠️</span>
            <h2 className="text-sm font-bold text-red-800 dark:text-red-300">مدرک یافت نشد</h2>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
          </div>
        ) : null}

        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/login" className="text-emerald-700 dark:text-emerald-400 hover:underline">
            ورود اعضا و دانش‌پژوهان به سامانه
          </Link>
        </div>
      </div>
    </main>
  );
}
