import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "مدیر کل",
  center_admin: "مدیر مرکز",
  teacher: "استاد",
  student: "دانش‌آموز",
};

const CARDS = [
  {
    href: "/courses",
    icon: "📚",
    title: "دوره‌ها",
    desc: "مشاهده و مدیریت دوره‌های آموزشی",
    color: "bg-emerald-600",
  },
  {
    href: "/dashboard/learning",
    icon: "🎓",
    title: "یادگیری من",
    desc: "پیشرفت و ادامه یادگیری",
    color: "bg-sky-600",
  },
  {
    href: "/dashboard/certificates",
    icon: "🏆",
    title: "گواهی‌ها",
    desc: "مشاهده و اشتراک‌گذاری دستاوردها",
    color: "bg-violet-600",
  },
] as const;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, role } = session.user;

  return (
    <AppShell user={{ name: name ?? "", role }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">داشبورد</h1>
        <p className="mt-1 text-sm text-gray-600">
          خوش آمدی، {name} — نقش: {ROLE_LABEL[role] ?? role}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-md text-lg text-white ${c.color}`}
            >
              {c.icon}
            </div>
            <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-emerald-700">
              {c.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
