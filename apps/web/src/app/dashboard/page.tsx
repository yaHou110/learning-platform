import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { catalog, identity, learning } from "@learning-platform/core/api";
import AppShell from "@/components/AppShell";
import type { Role } from "@learning-platform/core/db/schema";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];

/**
 * /dashboard — role-aware dashboard.
 * Admins: tenant-level stats (courses, lessons, students, enrollments).
 * Students/teachers: their own enrollments with per-course progress.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId, id: userId, role } = session.user;
  const isAdmin = ADMIN_ROLES.includes(role);

  if (isAdmin) {
    const courses = await catalog.listCourses(tenantId, { includeNonPublished: true });
    const lessonsByCourse = await Promise.all(
      courses.map(async (c) => ({
        course: c,
        lessons: await catalog.listLessons(tenantId, c.id, { includeNonPublished: true }),
      }))
    );
    const enrollments = await learning.listEnrollments(tenantId);
    const users = await identity.listUsers(tenantId);
    const students = users.filter((u) => u.role === "student");
    const activeEnrollments = enrollments.filter((e) => e.status === "active");
    const completedEnrollments = enrollments.filter((e) => e.status === "completed");
    const totalLessons = lessonsByCourse.reduce((n, x) => n + x.lessons.length, 0);

    return (
      <AppShell user={{ name: session.user.name, role }}>
        <h1 className="mb-1 text-2xl font-bold">داشبورد مدیریت</h1>
        <p className="mb-6 text-sm text-gray-600">آمار کلی مرکز شما ({tenantId.slice(0, 8)}…)</p>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "دوره‌ها", value: courses.length, sub: `${courses.filter((c) => c.status === "published").length} منتشرشده` },
            { label: "درس‌ها", value: totalLessons, sub: "جمع درس‌های دوره‌ها" },
            { label: "طلبه‌ها", value: students.length, sub: `${users.length} کاربر کل` },
            { label: "ثبت‌نام‌ها", value: enrollments.length, sub: `${activeEnrollments.length} فعال · ${completedEnrollments.length} تکمیل` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="mt-1 text-2xl font-bold text-emerald-800">{s.value}</div>
              <div className="mt-1 text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold">دوره‌ها</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-right text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">عنوان</th>
                <th className="px-4 py-2">وضعیت</th>
                <th className="px-4 py-2">درس‌ها</th>
                <th className="px-4 py-2">ثبت‌نام‌ها</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lessonsByCourse.map(({ course, lessons }) => {
                const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
                return (
                  <tr key={course.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{course.title}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          course.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : course.status === "draft"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{lessons.length}</td>
                    <td className="px-4 py-2">
                      {courseEnrollments.length}
                      <span className="text-xs text-gray-400">
                        {" "}
                        ({courseEnrollments.filter((e) => e.status === "completed").length} تکمیل)
                      </span>
                    </td>
                    <td className="px-4 py-2 text-left">
                      <Link
                        href={`/admin/courses/${course.id}/lessons`}
                        className="text-xs text-emerald-700 hover:underline"
                      >
                        مدیریت
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AppShell>
    );
  }

  // Student/teacher view: my enrollments with progress.
  const enrollments = await learning.listEnrollments(tenantId, { userId });
  const rows = await Promise.all(
    enrollments.map(async (e) => {
      const course = await catalog.getCourse(tenantId, e.courseId, { includeNonPublished: isAdmin });
      if (!course) return null;
      const lessons = await catalog.listLessons(tenantId, course.id);
      const progress = await learning.listProgress(tenantId, e.id);
      const done = new Set(
        progress.filter((p) => p.status === "completed").map((p) => p.lessonId)
      );
      const completed = lessons.filter((l) => done.has(l.id)).length;
      const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
      return { course, e, completed, total: lessons.length, pct };
    })
  );
  const visible = rows.filter((r) => r !== null) as NonNullable<typeof rows[number]>[];

  return (
    <AppShell user={{ name: session.user.name, role }}>
      <h1 className="mb-1 text-2xl font-bold">پیشرفت من</h1>
      <p className="mb-6 text-sm text-gray-600">دوره‌هایی که در آن‌ها ثبت‌نام کرده‌اید.</p>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          هنوز در دوره‌ای ثبت‌نام نکرده‌اید.{" "}
          <Link href="/courses" className="text-emerald-700 underline">
            مشاهده دوره‌ها
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(({ course, e, completed, total, pct }) => (
            <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/courses/${course.id}`} className="font-bold hover:text-emerald-700">
                    {course.title}
                  </Link>
                  <div className="mt-1 text-xs text-gray-400">
                    {e.status === "completed"
                      ? "تکمیل شده 🎉"
                      : `ثبت‌نام: ${new Date(e.enrolledAt).toLocaleDateString("fa-IR")}`}
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-800">{pct}٪</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {completed} از {total} درس مشاهده شده —{" "}
                <Link href={`/courses/${course.id}`} className="text-emerald-700 hover:underline">
                  ادامه یادگیری
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
