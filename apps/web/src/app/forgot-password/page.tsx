import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Icon } from "@/components/icons";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { getDictionary, getLocale } from "@/lib/i18n";

/**
 * Password recovery — a verification code is sent by SMS to the
 * registered mobile number.
 */
export default async function ForgotPasswordPage(): Promise<JSX.Element> {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="absolute top-5 start-5 flex items-center gap-2">
        <LanguageSwitcher current={locale} label={dict.nav.changeLanguage} />
        <ThemeToggle
          lightLabel={dict.nav.themeLight}
          darkLabel={dict.nav.themeDark}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Identity */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Icon.Mosque className="h-6 w-6" />
          </div>
          <div className="text-start">
            <div className="text-base font-bold text-gray-900 dark:text-gray-100">
              {dict.brand.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dict.brand.tagline}
            </div>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          {dict.forgotPassword.title}
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-gray-500 dark:text-gray-400">
          {dict.forgotPassword.intro}
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <ForgotPasswordForm dict={dict} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/login"
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {dict.forgotPassword.backToLogin}
          </Link>
        </p>
      </div>
    </main>
  );
}
