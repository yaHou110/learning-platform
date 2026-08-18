import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import IslamicPattern from "@/components/IslamicPattern";
import { Icon } from "@/components/icons";
import { fmt, getDictionary, getLocale } from "@/lib/i18n";
import { getMeta } from "@/lib/i18n/config";
import Image from "next/image";

/** Year in the active locale's calendar — e.g. ۱۴۰۵ (fa), 2026 (en/ar). */
function yearInLocale(intl: string): string {
  return new Intl.DateTimeFormat(intl, { year: "numeric" }).format(new Date());
}

/** A restrained visual metaphor for movement and continuity. */
function RisingLight(): JSX.Element {
  const beams = [
    "left-[10%] h-2/3 w-24",
    "left-[42%] h-1/2 w-16",
    "right-[12%] h-3/4 w-20",
    "right-[43%] h-2/5 w-14",
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {beams.map((pos) => (
        <div
          key={pos}
          className={`absolute bottom-0 ${pos} bg-gradient-to-t from-white/[0.14] via-white/[0.04] to-transparent blur-2xl`}
        />
      ))}
    </div>
  );
}

/** A quiet secondary reference, never the primary headline. */
function QiyamVerse({
  translation,
  reference,
  className = "",
  compact = false,
}: {
  translation: string;
  reference: string;
  className?: string;
  compact?: boolean;
}): JSX.Element {
  return (
    <div className={className}>
      <p
        lang="ar"
        dir="rtl"
        className={`font-semibold leading-8 text-emerald-50 ${
          compact ? "text-xs leading-6" : "text-base"
        }`}
      >
        قُلْ إِنَّمَا أَعِظُكُمْ بِوَاحِدَةٍ ۖ أَنْ تَقُومُوا لِلَّهِ
        مَثْنَىٰ وَفُرَادَىٰ
      </p>
      {!compact ? (
        <>
          {translation ? (
            <p className="mt-2 max-w-xl text-[11px] leading-6 text-emerald-100/80">
              {translation}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-emerald-200/65">{reference}</p>
        </>
      ) : null}
    </div>
  );
}

export default async function LoginPage(): Promise<JSX.Element> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const meta = getMeta(locale);
  const year = yearInLocale(meta.intl);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Auth panel — the clearest and most usable part of the page. */}
        <section className="login-auth-panel order-1 flex w-full flex-col bg-gray-50 dark:bg-gray-950 lg:order-2 lg:w-[46%] lg:justify-center">
          {/* Mobile identity band: keeps context above the form without a second desktop logo. */}
          <div className="relative h-44 w-full shrink-0 overflow-hidden lg:hidden">
            <Image
              src="/hawza/courtyard.jpg"
              alt={dict.login.courtyardAlt}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/45 via-emerald-950/70 to-emerald-950/95" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2.5 px-6 text-center">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                  <Icon.Mosque className="h-5 w-5" />
                </div>
                <div className="text-start">
                  <div className="text-sm font-bold leading-5 text-white">
                    {dict.brand.name}
                  </div>
                  <div className="text-[11px] text-emerald-100">
                    {dict.brand.tagline}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                {dict.brand.motto}
              </p>
            </div>
          </div>

          <div className="login-auth-content relative flex w-full flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
            <div className="absolute start-5 top-5 flex items-center gap-2 sm:start-8 lg:start-10 lg:top-8">
              <LanguageSwitcher
                current={locale}
                label={dict.nav.changeLanguage}
              />
              <ThemeToggle
                lightLabel={dict.nav.themeLight}
                darkLabel={dict.nav.themeDark}
              />
            </div>

            <div className="rise-in w-full max-w-[27rem]">
              {/* Single source of brand truth on desktop. */}
              <div className="mb-9 hidden items-center gap-3 lg:flex">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm shadow-emerald-900/10">
                  <Icon.Mosque className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-950 dark:text-gray-100">
                    {dict.brand.name}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {dict.brand.tagline}
                  </div>
                </div>
              </div>

              <div className="mb-9">
                <p className="mb-3 text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
                  {dict.login.membersLogin}
                </p>
                <h1 className="text-3xl font-bold leading-[1.3] tracking-tight text-gray-950 dark:text-gray-100 sm:text-[2.15rem]">
                  {dict.login.welcome}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-7 text-gray-600 dark:text-gray-400">
                  {dict.login.intro}
                </p>
              </div>

              {/* No card: the form sits directly on the panel — editorial,
                  not a SaaS widget floating on a gray field. */}
              <div>
                <LoginForm dict={dict} />
              </div>

              {process.env.NODE_ENV !== "production" ? (
                <div className="mt-5 rounded-xl border border-dashed border-emerald-300/80 bg-emerald-50/70 p-4 text-xs text-gray-600 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-gray-300">
                  <div className="mb-2 font-semibold text-emerald-800 dark:text-emerald-400">
                    {dict.login.demoTitle}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <div>
                      {dict.login.demoCenter}:{" "}
                      <code className="demo-code">۱۰۰۱</code>
                    </div>
                    <div>
                      {dict.login.demoNationalId}:{" "}
                      <code className="demo-code">۱۲۳۴۵۶۷۸۹۱</code>
                    </div>
                    <div>
                      {dict.login.demoPhone}:{" "}
                      <code className="demo-code">۰۹۱۲۳۴۵۶۷۸۹</code>
                    </div>
                    <div>
                      {dict.login.demoPassword}:{" "}
                      <code className="demo-code">changeme</code>
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="mt-7 text-center text-xs text-gray-400 dark:text-gray-500">
                {fmt(dict.login.copyright, { year, brand: dict.brand.name })}
              </p>
            </div>
          </div>
        </section>

        {/* Visual panel — image is readable, cultural, and subordinate to the form. */}
        <aside
          aria-label={dict.login.visualAria}
          className="order-2 relative hidden min-h-screen w-full overflow-hidden lg:order-1 lg:flex lg:w-[54%] lg:flex-col"
        >
          <Image
            src="/hawza/courtyard.jpg"
            alt={dict.login.courtyardAltLong}
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            priority
            className="object-cover object-center"
          />
          {/* Lighter upper overlay preserves the architecture; deeper lower overlay supports text. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/35 to-emerald-950/5"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-l from-emerald-950/35 via-transparent to-transparent"
          />
          <IslamicPattern
            className="absolute inset-0 h-full w-full text-white"
            opacity={0.035}
            strokeWidth={0.8}
          />
          <RisingLight />

          <div className="relative z-10 flex items-center gap-3 p-8 pb-0 xl:p-10 xl:pb-0">
            <span className="h-10 w-1 rounded-full bg-emerald-300/70" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">
                {dict.login.visualTitle}
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">
                {dict.login.visualSubtitle}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto max-w-2xl p-8 pb-10 xl:p-10 xl:pb-12">
            <div className="border-s-2 border-emerald-300/70 ps-5">
              <QiyamVerse
                translation={dict.login.verse.translation}
                reference={dict.login.verse.reference}
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
