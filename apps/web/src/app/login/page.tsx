import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import IslamicPattern from "@/components/IslamicPattern";
import { Icon } from "@/components/icons";
import Image from "next/image";

export const dynamic = "force-dynamic";

/**
 * «باید برخاست» — expressed as light, not text: vertical light columns
 * rising from the courtyard floor. The composition, not a headline, carries
 * the idea of rising to study, act, and continue the scholarly path.
 */
function RisingLight(): JSX.Element {
  const beams = [
    "left-[12%] h-2/3 w-24",
    "left-[40%] h-1/2 w-16",
    "right-[14%] h-3/4 w-20",
    "right-[44%] h-2/5 w-14",
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {beams.map((pos) => (
        <div
          key={pos}
          className={`absolute bottom-0 ${pos} bg-gradient-to-t from-white/15 via-white/[0.06] to-transparent blur-2xl`}
        />
      ))}
    </div>
  );
}

/** Small refined motto — a quiet institutional line, never a banner. */
function RisingMotto({ className = "" }: { className?: string }): JSX.Element {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px w-8 bg-emerald-300/70" aria-hidden="true" />
      <p className="text-sm font-light text-emerald-100">
        «باید برخاست»
      </p>
      <span className="h-px w-8 bg-emerald-300/70" aria-hidden="true" />
    </div>
  );
}

export default function LoginPage(): JSX.Element {
  return (
    <main dir="rtl" lang="fa" className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ══ Auth panel (right in RTL — primary interaction) ══════════ */}
      <section className="relative flex w-full flex-col lg:w-1/2 lg:justify-center">
        {/* Mobile photo band — identity above the fold, full-bleed */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden lg:hidden">
          <Image
            src="/hawza/courtyard.jpg"
            alt="حیاط مدرسهٔ آقابزرگ کاشان"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-emerald-950/75 to-emerald-950/95" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2.5 px-6 text-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                <Icon.Mosque className="h-5 w-5" />
              </div>
              <div className="text-right">
                <div className="text-sm font-bold leading-5 text-white">
                  پلتفرم یادگیری خانواده حوزوی
                </div>
                <div className="text-[11px] text-emerald-200">
                  سامانهٔ آموزش و دانش حوزوی
                </div>
              </div>
              <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                #حوزه
              </span>
            </div>
            <RisingMotto className="scale-90" />
          </div>
        </div>

        <div className="relative flex w-full flex-1 flex-col items-center justify-center px-6 py-10 lg:py-16">
          {/* Theme toggle — top corner */}
          <div className="absolute top-5 left-5 lg:top-6 lg:left-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-md">
            {/* Identity (desktop; mobile shows the photo band instead) */}
            <div className="mb-8 hidden items-center gap-3 lg:flex">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <Icon.Mosque className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  پلتفرم یادگیری خانواده حوزوی
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  سامانهٔ آموزش و دانش حوزوی
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              خوش آمدید
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              برای ادامه، شناسهٔ مرکز و مشخصات کاربری خود را وارد کنید.
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
      </section>

      {/* ══ Hero / visual panel (left in RTL, hidden on mobile) ══════ */}
      <aside
        aria-label="معرفی سامانه"
        className="relative hidden w-1/2 overflow-hidden lg:block"
      >
        {/* Real photo — a madrasa courtyard, the archetype of seminary study */}
        <Image
          src="/hawza/courtyard.jpg"
          alt="حیاط مدرسهٔ آقابزرگ کاشان؛ معماری مدارس علمیهٔ ایران"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover object-center"
        />
        {/* Ink-teal overlay: photo readable at top, anchors the text at the base */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-emerald-950/20"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-l from-emerald-950/55 via-transparent to-transparent"
        />
        <IslamicPattern
          className="absolute inset-0 h-full w-full text-white"
          opacity={0.05}
          strokeWidth={1}
        />
        <RisingLight />

        {/* Identity bar */}
        <header className="relative z-10 flex items-center gap-3 p-8 pb-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Icon.Mosque className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold leading-6 text-white">
              سامانهٔ آموزش و دانش حوزوی
            </div>
            <div className="text-xs text-emerald-200">
              پلتفرم یادگیری خانواده‌های حوزوی
            </div>
          </div>
          <span className="mr-auto shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            #حوزه
          </span>
        </header>

        {/* Editorial block — science → education → rising */}
        <div className="relative z-10 mt-auto p-8 pb-9">
          <h2 className="max-w-md text-3xl font-bold leading-[1.7] text-white">
            محیطی برای یادگیری، تدریس و تداوم مسیر علمی
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-emerald-100/90">
            سامانهٔ آموزش و دانش حوزوی؛ جایی که طلبه و استاد کنار هم درس
            می‌خوانند، مطالعه می‌کنند و میراث علمی حوزه را ادامه می‌دهند.
          </p>

          <RisingMotto className="mt-6" />

          <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
            <p
              dir="rtl"
              lang="ar"
              className="text-sm font-semibold leading-6 text-emerald-100/85"
            >
              طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
            </p>
            <p dir="ltr" className="text-[10px] leading-4 text-emerald-200/50">
              photo: Agha Bozorg madrasa courtyard · CC0 · Erik Albers
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
