import Link from "next/link";
import { signOut } from "@/auth";
import type { Role } from "@learning-platform/core/db/schema";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];

/**
 * Shared app shell: top navigation + content container.
 * Server component — receives the signed-in user's role to decide which
 * nav items are visible (admin management surfaces).
 */
export default function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: React.ReactNode;
}): JSX.Element {
  const isAdmin = ADMIN_ROLES.includes(user.role);

  async function logoutAction(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div dir="rtl" lang="fa" className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-emerald-800">
            پلتفرم یادگیری حوزوی
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/courses" className="text-gray-700 hover:text-emerald-700">
              دوره‌ها
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-emerald-700">
              داشبورد
            </Link>
            {isAdmin ? (
              <Link href="/admin/courses" className="text-gray-700 hover:text-emerald-700">
                مدیریت دوره‌ها
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {user.name}
              <span className="mr-1 text-xs text-gray-400">({user.role})</span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
