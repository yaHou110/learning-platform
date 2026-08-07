import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { catalog, learning } from "@learning-platform/core/api";
import type { Role } from "@learning-platform/core/db/schema";
import AppShell from "@/components/AppShell";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];

/** Format a date in the Jalali (Persian) calendar. Node ships full ICU,
 * so the native formatter is exact — no hand-rolled conversion to drift. */
function formatJalali(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface CourseStat {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  status: "active" | "completed";
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, role, tenantId, id: userId } = session.user;
  const isAdmin = ADMIN_ROLES.includes(role);

  // ── Gather dashboard data (safe fallbacks when DB is degraded) ──
  let courses = [] as Awaited<ReturnType<typeof catalog.listCourses>>;
  let enrollments = [] as Awaited<ReturnType<typeof learning.listEnrollments>>;
  let stats: CourseStat[] = [];
  const courseLessonCount = new Map<string, number>();

  try {
    courses = await catalog.listCourses(tenantId);
    enrollments = await learning.listEnrollments(tenantId, isAdmin ? {} : { userId });

    // Lesson counts for every visible course (for the catalog section).
    await Promise.all(
      courses.map(async (c) => {
        courseLessonCount.set(c.id, (await catalog.listLessons(tenantId, c.id)).length);
      })
    );

    // Per-enrollment lesson progress.
    stats = await Promise.all(
      enrollments.map(async (e) => {
        const [lessons, progress] = await Promise.all([
          catalog.listLessons(tenantId, e.courseId),
          learning.listProgress(tenantId, e.id),
        ]);
        let completedLessons = progress.filter((p) => p.status === "completed").length;
        const course = courses.find((c) => c.id === e.courseId);
        const isCompleted = e.status === "completed";
        // If the enrollment is completed, all lessons were finished by definition
        // (the API only flips status after the last lesson completes). The
        // progress rows may be sparse in seeded/demo data, so normalize.
        if (isCompleted && lessons.length > 0 && completedLessons < lessons.length) {
          completedLessons = lessons.length;
        }
        return {
          courseId: e.courseId,
          courseTitle: course?.title ?? "دوره",
          totalLessons: lessons.length,
          completedLessons,
          status: isCompleted ? "completed" : "active",
        };
      })
    );
  } catch {
    // DB unreachable in a degraded deploy — render empty dashboard rather than crash.
  }

  const activeCount = stats.filter((s) => s.status === "active").length;
  const completedCount = stats.filter((s) => s.status === "completed").length;
  const totalLessons = stats.reduce((sum, s) => sum + s.totalLessons, 0);
  const doneLessons = stats.reduce((sum, s) => sum + s.completedLessons, 0);
  const progressPercent =
    totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <AppShell user={{ name: name ?? "", role }}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-700">{formatJalali(new Date())}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              سلام، {name} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {isAdmin
                ? "نمای کلی مرکز شما — آمار، پیشرفت و دسترسی سریع."
                : "به فضای یادگیری خود خوش آمدید."}
            </p>
          </div>
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md"
          >
            <Icon.BookOpen className="h-4 w-4" />
            مرور دوره‌ها
            <Icon.ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/courses"
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-emerald-500 to-emerald-700" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">دوره‌های فعال</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{activeCount}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Icon.BookOpen className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 transition-colors group-hover:text-emerald-600">
            در حال یادگیری
          </div>
        </Link>

        <Link
          href="/dashboard/learning"
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-sky-500 to-sky-700" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">تکمیل‌شده</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{completedCount}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
              <Icon.CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 transition-colors group-hover:text-sky-600">
            دوره‌های تمام‌شده
          </div>
        </Link>

        <Link
          href="/dashboard/learning"
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-500 to-violet-700" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">درس‌های گذرانده</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{doneLessons}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Icon.GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 transition-colors group-hover:text-violet-600">
            از {totalLessons} درس
          </div>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-amber-500 to-amber-600" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">پیشرفت کلی</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">٪{progressPercent}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Icon.ChartBar className="h-6 w-6" />
            </div>
          </div>
          {/* Mini progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-400 to-amber-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Learning progress + quick actions ───────────────────── */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* Enrollments / progress */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
              <Icon.GraduationCap className="h-5 w-5 text-emerald-700" />
              {isAdmin ? "پیشرفت ثبت‌نام‌ها" : "ادامه یادگیری"}
            </h2>
            <Link
              href="/dashboard/learning"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              مشاهده همه
            </Link>
          </div>

          {stats.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-10 text-center">
              <Icon.Sparkles className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-semibold text-gray-700">
                {isAdmin ? "هنوز ثبت‌نامی وجود ندارد" : "هنوز در دوره‌ای ثبت‌نام نکرده‌اید"}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {isAdmin
                  ? "دانش‌آموزان با ثبت‌نام در دوره‌ها، پیشرفت آن‌ها اینجا نمایش داده می‌شود."
                  : "از کاتالوگ دوره‌ها یک دوره انتخاب کنید و یادگیری را شروع کنید."}
              </p>
              <Link
                href="/courses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Icon.BookOpen className="h-4 w-4" />
                مرور دوره‌ها
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.map((s) => {
                const pct =
                  s.totalLessons > 0
                    ? Math.round((s.completedLessons / s.totalLessons) * 100)
                    : 0;
                return (
                  <Link
                    key={s.courseId}
                    href={`/courses/${s.courseId}`}
                    className="group block rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-800">
                          {s.courseTitle}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          {s.completedLessons} از {s.totalLessons} درس
                          {s.status === "completed" ? " — تکمیل شده 🎉" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-32">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                s.status === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-l from-emerald-400 to-emerald-600"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-1 text-left text-[11px] font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            ٪{pct}
                          </div>
                        </div>
                        {s.status === "completed" ? (
                          <Icon.CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Icon.ArrowLeft className="h-4 w-4 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-emerald-600" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <aside>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <Icon.Sparkles className="h-5 w-5 text-emerald-700" />
            دسترسی سریع
          </h2>
          <div className="space-y-3">
            <Link
              href="/courses"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Icon.BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">کاتالوگ دوره‌ها</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">مشاهده و ثبت‌نام</div>
              </div>
              <Icon.ArrowLeft className="h-4 w-4 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-emerald-600" />
            </Link>

            <Link
              href="/dashboard/learning"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                <Icon.Play className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">یادگیری من</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">ادامه دوره‌ها</div>
              </div>
              <Icon.ArrowLeft className="h-4 w-4 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-sky-600" />
            </Link>

            <Link
              href="/dashboard/certificates"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                <Icon.Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">گواهی‌ها</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">دستاوردهای شما</div>
              </div>
              <Icon.ArrowLeft className="h-4 w-4 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-violet-600" />
            </Link>

            {isAdmin ? (
              <Link
                href="/admin/courses"
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Icon.Cog className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">مدیریت دوره‌ها</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">ایجاد و انتشار</div>
                </div>
                <Icon.ArrowLeft className="h-4 w-4 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-amber-600" />
              </Link>
            ) : null}
          </div>
        </aside>
      </div>

      {/* ── Available courses ───────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <Icon.BookOpen className="h-5 w-5 text-emerald-700" />
            دوره‌های موجود
          </h2>
          <Link
            href="/courses"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            مشاهده همه
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-8 text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            هنوز دوره‌ای منتشر نشده است.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => {
              const stat = stats.find((s) => s.courseId === course.id);
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-400">
                    <Icon.BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-800">
                    {course.title}
                  </h3>
                  {course.description ? (
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {course.description}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>
                      {courseLessonCount.get(course.id) ?? 0} درس
                      {stat?.status === "completed" ? " · تکمیل شده" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                      مشاهده
                      <Icon.ArrowLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
