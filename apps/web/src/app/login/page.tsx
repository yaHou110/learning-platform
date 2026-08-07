import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import IslamicPattern from "@/components/IslamicPattern";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

/** Mosque skyline silhouette — domes & minarets, the hawza skyline. */
function DomeSkyline(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 220"
      preserveAspectRatio="xMidYMax slice"
      className="h-56 w-full text-white"
      style={{ opacity: 0.07 }}
    >
      <g fill="currentColor">
        {/* Left minaret */}
        <path d="M60 220 L60 130 L76 100 L92 130 L92 220 Z" />
        {/* Great dome */}
        <path d="M120 220 C120 160 165 120 230 120 C295 120 340 160 340 220 Z" />
        {/* Finial on the great dome */}
        <path d="M230 120 L230 104 L233 104 L233 120 Z" />
        {/* Mid dome */}
        <path d="M380 220 C380 175 415 148 462 148 C509 148 544 175 544 220 Z" />
        {/* Right minaret */}
        <path d="M590 220 L590 140 L606 110 L622 140 L622 220 Z" />
        {/* Small far-right dome */}
        <path d="M650 220 C650 195 675 180 710 180 C745 180 770 195 770 220 Z" />
      </g>
    </svg>
  );
}

export default function LoginPage(): JSX.Element {
  return (
    <main
      dir="rtl"
      lang="fa"
      className="flex min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* ── Branding panel (right, hidden on mobile) ─────────────── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-950 lg:flex lg:flex-col lg:justify-between">
        {/* Islamic geometric pattern overlay (white strokes, theme-independent) */}
        <IslamicPattern
          className="absolute inset-0 h-full w-full text-white"
          opacity={0.07}
          strokeWidth={1}
        />

        {/* Decorative light blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />

        {/* Mosque skyline at the base */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <DomeSkyline />
        </div>

        {/* Logo + identity */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Icon.Mosque className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-white">
              پلتفرم یادگیری حوزوی
            </div>
            <div className="text-xs text-emerald-200">
              سامانه آموزش خانواده‌های حوزوی
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            #حوزه
          </span>
        </div>

        {/* Hadith of seeking knowledge */}
        <div className="relative z-10 px-10 pb-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
                <Icon.Mosque className="h-6 w-6" />
              </div>
              <div>
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-xl font-bold leading-9 text-white"
                >
                  طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
                </p>
                <p className="mt-1.5 text-sm text-emerald-100">
                  «دانش‌آموختن بر هر مسلمانی واجب است.»
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-emerald-200">
              مرکز یادگیری خود را بسازید، دوره‌ها را مدیریت کنید و پیشرفت
              دانش‌آموزان را دنبال کنید.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-emerald-200/90">
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> چندمرکزی
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> خودمیزبان
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle className="h-4 w-4" /> اوپن‌سورس
            </span>
            <span className="mr-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-100">
              <Icon.Sparkles className="h-3.5 w-3.5" />
              جامعه‌ی خانواده‌های حوزوی
            </span>
          </div>
        </div>
      </div>

      {/* ── Form panel (left) ────────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
            <Icon.Mosque className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              پلتفرم یادگیری حوزوی
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ورود به سامانه
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">
                #حوزه
              </span>
            </div>
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
                  مرکز:{" "}
                  <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">
                    demo
                  </code>
                </div>
                <div>
                  ایمیل:{" "}
                  <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">
                    admin@lp.local
                  </code>
                </div>
                <div>
                  رمز:{" "}
                  <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200">
                    changeme
                  </code>
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
