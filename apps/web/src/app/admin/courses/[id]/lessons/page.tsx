import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { catalog, CONTENT_TYPES } from "@learning-platform/core/api";
import AppShell from "@/components/AppShell";
import MediaUploader from "@/components/MediaUploader";
import { env } from "@/lib/env";
import type { Role } from "@learning-platform/core/db/schema";
import type { JSX } from "react";
import { fmt, getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];
type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * /admin/courses/[id]/lessons — lesson management for one course (admin):
 * list in display order, add lessons (contentType + optional contentRef),
 * and publish the course from here.
 */
export default async function AdminCourseLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ROLES.includes(session.user.role)) redirect("/courses");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { id: courseId } = await params;
  const { tenantId, role } = session.user;

  const course = await catalog.getCourse(tenantId, courseId, { includeNonPublished: true });
  if (!course) notFound();
  const lessons = await catalog.listLessons(tenantId, courseId, { includeNonPublished: true });

  async function createLessonAction(formData: FormData): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.user || !ADMIN_ROLES.includes(s.user.role)) redirect("/login");
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    const contentType = String(formData.get("contentType") ?? "text");
    const contentRef = String(formData.get("contentRef") ?? "").trim() || undefined;
    await catalog.createLesson(s.user.tenantId, {
      courseId,
      title,
      contentType: contentType as (typeof CONTENT_TYPES)[number],
      contentRef,
    });
    revalidatePath(`/admin/courses/${courseId}/lessons`);
    revalidatePath(`/courses/${courseId}`);
  }

  async function publishAction(): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.user || !ADMIN_ROLES.includes(s.user.role)) redirect("/login");
    await catalog.publishCourse(s.user.tenantId, courseId);
    revalidatePath(`/admin/courses/${courseId}/lessons`);
    revalidatePath(`/courses/${courseId}`);
  }

  return (
    <AppShell user={{ name: session.user.name, role }}>
      <Link
        href="/admin/courses"
        className="text-sm text-emerald-700 hover:underline"
      >
        <span className="inline-block rtl:rotate-180">←</span>{" "}
        {dict.adminLessons.backToManage}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {fmt(dict.adminLessons.statusLine, {
              n: lessons.length,
              status: course.status,
            })}
          </p>
        </div>
        {course.status === "draft" ? (
          <form action={publishAction}>
            <button
              type="submit"
              className="rounded bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
            >
              {dict.adminLessons.publishCourse}
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold">{dict.adminLessons.newLesson}</h2>
        <form action={createLessonAction} className="flex flex-col gap-3">
          <input
            name="title"
            required
            placeholder={dict.adminLessons.titlePlaceholder}
            className="rounded border border-gray-300 dark:border-gray-600 p-2 text-sm"
          />
          <div className="flex gap-3">
            <select
              name="contentType"
              defaultValue="text"
              className="rounded border border-gray-300 dark:border-gray-600 p-2 text-sm"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dict.common.contentType[t] ?? t}
                </option>
              ))}
            </select>
            <input
              name="contentRef"
              placeholder={dict.adminLessons.contentRefPlaceholder}
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
          >
            {dict.adminLessons.addLesson}
          </button>
        </form>

        {/* Media attachment (ADR-0010) — upload straight to object storage and
            copy the resulting key into the lesson's contentRef. */}
        <div className="mt-4">
          {env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY ? (
            <MediaUploader dict={dict} />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {dict.adminLessons.storageUnavailable}
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">{dict.adminLessons.lessonsHeader}</h2>
      <ol className="space-y-2">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-4 py-3 shadow-sm"
          >
            <span className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {lesson.orderIndex + 1}
              </span>
              <span>{lesson.title}</span>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {dict.common.contentType[lesson.contentType as ContentType] ?? lesson.contentType}
              {lesson.durationSeconds
                ? fmt(dict.adminLessons.duration, {
                    n: Math.round(lesson.durationSeconds / 60),
                  })
                : ""}
            </span>
          </li>
        ))}
        {lessons.length === 0 ? (
          <li className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {dict.adminLessons.noLessons}
          </li>
        ) : null}
      </ol>
    </AppShell>
  );
}
