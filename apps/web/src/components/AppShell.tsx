import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { Role } from "@learning-platform/core/db/schema";
import { Icon } from "./icons";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { getDictionary, getLocale } from "@/lib/i18n";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];

export default async function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const isAdmin = ADMIN_ROLES.includes(user.role);

  const navItems = [
    {
      href: "/dashboard",
      label: dict.common.dashboard,
      icon: <Icon.Home className="h-5 w-5" />,
      badge: "اصلی",
    },
    {
      href: "/courses",
      label: dict.common.courses,
      icon: <Icon.BookOpen className="h-5 w-5" />,
      badge: "درحال برگزاری",
    },
    {
      href: "/verify",
      label: locale === "fa" ? "استعلام و صدور مدرک" : locale === "ar" ? "تحقق من الشهادة" : "Verify Certificate",
      icon: <Icon.CheckCircle className="h-5 w-5" />,
      badge: null,
    },
  ];

  const adminItems = [
    {
      href: "/admin/courses",
      label: dict.common.manageCourses,
      icon: <Icon.Cog className="h-5 w-5" />,
      badge: "مدیریت",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col border-e border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 lg:flex shadow-sm">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800/70">
          <Link href="/dashboard" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 text-white shadow-md shadow-emerald-900/20 transition-transform duration-300 group-hover:scale-105">
              <Icon.Mosque className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{dict.brand.name}</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {dict.brand.tagline}
              </div>
            </div>
          </Link>
        </div>

        {/* Center Indicator Banner */}
        <div className="mx-4 mt-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 dark:border-emerald-500/10 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900 dark:text-emerald-300">مرکز رویش ۱۰۱</span>
            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-md shadow-2xs">کد: ۱۰۰۱</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>ترم پاییز و زمستان ۱۴۰۵</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">فعال</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {dict.nav.mainMenu}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-emerald-50/80 hover:text-emerald-900 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200 hover:translate-x-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}

          {isAdmin ? (
            <>
              <div className="px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {dict.nav.management}
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-emerald-50/80 hover:text-emerald-900 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200 hover:translate-x-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </>
          ) : null}
        </nav>

        {/* User Card & Controls */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center justify-between">
            <LanguageSwitcher current={locale} label={dict.nav.changeLanguage} />
            <ThemeToggle lightLabel={dict.nav.themeLight} darkLabel={dict.nav.themeDark} />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800/70 dark:border-slate-700/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-sm font-bold text-white shadow-inner">
              {user.name.slice(0, 1) || "م"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {user.name}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {dict.common.roles[user.role] ?? user.role}
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title={dict.nav.logout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              >
                <Icon.Logout className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 text-white shadow-sm">
            <Icon.Mosque className="h-5 w-5" />
          </div>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            {dict.brand.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle lightLabel={dict.nav.themeLight} darkLabel={dict.nav.themeDark} />
          <form action={logoutAction}>
            <button
              type="submit"
              title={dict.nav.logout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <Icon.Logout className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Horizontal Nav */}
      <nav className="sticky top-[57px] z-20 flex gap-2 overflow-x-auto border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 lg:hidden">
        {[...navItems, ...(isAdmin ? adminItems : [])].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          >
            <span className="text-slate-400 dark:text-slate-400">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="lg:ps-72">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
