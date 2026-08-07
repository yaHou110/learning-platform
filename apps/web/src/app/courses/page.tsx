import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { catalog, type Course } from "@learning-platform/core/api";
import AppShell from "@/components/AppShell";
import type { Role } from "@learning-platform/core/db/schema";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];

const STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی",
};

function CourseCard({ course, isAdmin }: { course: Course; isAdmin: boolean }): JSX.Element {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition hover:border-emerald-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{course.title}</h3>
        {isAdmin && course.status !== "published" ? (
          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            {STATUS_LABEL[course.status] ?? course.status}
          </span>
        ) : null}
      </div>
      {course.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{course.description}</p>
      ) : null}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {course.status === "published" ? "دوره فعال — مشاهده و ثبت‌نام" : "در حال آماده‌سازی"}
      </div>
    </Link>
  );
}

/**
 * /courses — catalog browse. Students/teachers see published courses;
 * admins additionally see drafts (management view).
 */
export default async function CoursesPage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId, role } = session.user;
  const isAdmin = ADMIN_ROLES.includes(role);
  const courses = await catalog.listCourses(tenantId, { includeNonPublished: isAdmin });

  return (
    <AppShell user={{ name: session.user.name, role }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دوره‌های آموزشی</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
            {isAdmin
              ? "نمای مدیریتی — همه وضعیت‌ها (پیش‌نویس، منتشرشده، بایگانی)."
              : "دوره‌های منتشرشده مرکز شما."}
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/admin/courses"
            className="rounded bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-800"
          >
            مدیریت دوره‌ها
          </Link>
        ) : null}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 dark:border-gray-600 p-10 text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {isAdmin
            ? "هنوز دوره‌ای نساخته‌اید. از «مدیریت دوره‌ها» شروع کنید."
            : "هنوز دوره‌ای منتشر نشده است."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
