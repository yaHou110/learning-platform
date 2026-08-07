import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function LoginPage(): JSX.Element {
  return (
    <main
      dir="rtl"
      lang="fa"
      className="flex min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* ── Branding panel (right, hidden on mobile) ─────────────── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
            <Icon.GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-white">پلتفرم یادگیری حوزوی</div>
            <div className="text-xs text-emerald-200">سامانه آموزش خانواده‌های حوزوی</div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 px-10 pb-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-lg leading-8 text-white">
              «العلمُ نورٌ — علم، روشنایی است.»
            </p>
            <p className="mt-3 text-sm text-emerald-200">
              مرکز یادگیری خود را بسازید، دوره‌ها را مدیریت کنید و پیشرفت دانش‌آموزان را دنبال کنید.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-6 text-xs text-emerald-200/90">
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> چندمرکزی
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> خودمیزبان
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> اوپن‌سورس
            </span>
          </div>
        </div>
      </div>

      {/* ── Form panel (left) ────────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
            <Icon.GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              پلتفرم یادگیری حوزوی
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ورود به سامانه</div>
          </div>
        </div>

        {/* Theme toggle — top corner */}
        <div className="absolute top-5 left-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            خوش آمدید 👋
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            برای ورود به حساب خود، اطلاعات مرکز و کاربری را وارد کنید.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-8 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 text-xs text-gray-600 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-gray-300">
              <div className="mb-2 font-semibold text-emerald-800 dark:text-emerald-400">
                حساب نمونه
              </div>
              <div className="space-y-1" dir="rtl">
                <div>
                  مرکز: <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">demo</code>
                </div>
                <div>
                  ایمیل: <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">admin@lp.local</code>
                </div>
                <div>
                  رمز: <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">changeme</code>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} پلتفرم یادگیری خانواده حوزوی
          </p>
        </div>
      </div>
    </main>
  );
}
