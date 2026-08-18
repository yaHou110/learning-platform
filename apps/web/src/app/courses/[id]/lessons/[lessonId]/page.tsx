import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import {
  catalog,
  learning,
  media,
  type CONTENT_TYPES,
} from "@learning-platform/core/api";
import AppShell from "@/components/AppShell";
import type { Role } from "@learning-platform/core/db/schema";
import { fmt, getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly Role[] = ["super_admin", "center_admin"];
type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * /courses/[id]/lessons/[lessonId] — lesson view.
 *
 * v1 has no object-storage playback (ADR-0010 proposed), so the content
 * area renders a placeholder keyed on contentType + contentRef. Enrolled
 * students can mark the lesson as viewed, which records progress through
 * the Learning bounded context; completing the last lesson flips the
 * enrollment to completed.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { id: courseId, lessonId } = await params;
  const { tenantId, id: userId, role } = session.user;
  const isAdmin = ADMIN_ROLES.includes(role);

  const course = await catalog.getCourse(tenantId, courseId, { includeNonPublished: isAdmin });
  if (!course) notFound();
  const lesson = await catalog.getLesson(tenantId, lessonId, { includeNonPublished: isAdmin });
  if (!lesson || lesson.courseId !== courseId) notFound();

  const myEnrollments = await learning.listEnrollments(tenantId, { userId });
  const enrollment = myEnrollments.find((e) => e.courseId === courseId) ?? null;
  const done =
    enrollment !== null &&
    (await learning.listProgress(tenantId, enrollment.id)).some(
      (p) => p.lessonId === lessonId && p.status === "completed"
    );

  // Short-lived signed URL for the lesson's media — only for enrolled students
  // and admins (the content-protection choke point; the URL expires in
  // minutes). Silently degrade to the placeholder when storage is down or the
  // key is malformed, so one bad lesson never takes down the page.
  let mediaUrl: string | null = null;
  if (lesson.contentRef && (isAdmin || enrollment)) {
    try {
      const signed = await media.signedReadUrl(tenantId, lesson.contentRef);
      mediaUrl = signed?.url ?? null;
    } catch {
      mediaUrl = null;
    }
  }

  async function markViewedAction(): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.user) redirect("/login");
    await learning.recordProgress(s.user.tenantId, s.user.id, lessonId, {
      status: "completed",
    });
    revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
    revalidatePath(`/courses/${courseId}`);
  }

  const contentTypeLabel =
    dict.common.contentType[lesson.contentType as ContentType] ?? lesson.contentType;

  return (
    <AppShell user={{ name: session.user.name, role }}>
      <Link
        href={`/courses/${courseId}`}
        className="text-sm text-emerald-700 hover:underline"
      >
        <span className="inline-block rtl:rotate-180">←</span>{" "}
        {dict.lesson.backToCourse}
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {fmt(dict.lesson.titleLine, {
                type: contentTypeLabel,
                lesson: dict.common.lesson,
                n: lesson.orderIndex + 1,
              })}
            </div>
            <h1 className="mt-1 text-xl font-bold">{lesson.title}</h1>
          </div>
          {done ? (
            <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
              ✓ {dict.lesson.viewed}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          {mediaUrl && lesson.contentType === "video" ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-800">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions are not available for arbitrary user-uploaded media in v1 */}
              <video
                controls
                preload="metadata"
                className="mx-auto max-h-[70vh] w-full"
                src={mediaUrl}
              />
            </div>
          ) : mediaUrl && lesson.contentType === "audio" ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions are not available for arbitrary user-uploaded media in v1 */}
              <audio controls preload="metadata" className="w-full" src={mediaUrl} />
            </div>
          ) : mediaUrl && (lesson.contentType === "pdf" || lesson.contentType === "text") ? (
            <iframe
              src={mediaUrl}
              title={lesson.title}
              className="h-[70vh] w-full rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {lesson.contentType === "video" ? (
                <>
                  <div className="mb-2 text-3xl">🎬</div>
                  {dict.lesson.videoPlaceholder}
                  {lesson.contentRef ? (
                    <div className="mt-2 text-xs">
                      {fmt(dict.lesson.contentRef, { ref: lesson.contentRef })}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="mb-2 text-3xl">{lesson.contentType === "pdf" ? "📄" : "📖"}</div>
                  {dict.lesson.contentPlaceholder}
                  {lesson.contentRef ? (
                    <div className="mt-2 text-xs">
                      {fmt(dict.lesson.contentRef, { ref: lesson.contentRef })}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
          {mediaUrl ? (
            <div className="mt-3 text-right">
              <a
                href={mediaUrl}
                download
                className="inline-block text-sm text-emerald-700 hover:underline"
              >
                ⬇ {dict.lesson.download}
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {enrollment ? (
            done ? (
              <p className="text-sm text-emerald-700">{dict.lesson.viewedNote}</p>
            ) : (
              <form action={markViewedAction}>
                <button
                  type="submit"
                  className="rounded bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
                >
                  {dict.lesson.markViewed}
                </button>
              </form>
            )
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {dict.lesson.enrollPromptBefore}{" "}
              <Link href={`/courses/${courseId}`} className="text-emerald-700 underline">
                {dict.lesson.enrollPromptLink}
              </Link>{" "}
              {dict.lesson.enrollPromptAfter}
            </p>
          )}
          {lesson.durationSeconds ? (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {fmt(dict.lesson.duration, {
                n: Math.round(lesson.durationSeconds / 60),
              })}
            </span>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
