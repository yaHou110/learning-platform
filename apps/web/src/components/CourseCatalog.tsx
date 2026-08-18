"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";
import { fmt, type Dictionary } from "@/lib/i18n/dictionaries";

/** One course as the catalog page prepares it for the client. */
export interface CatalogCourse {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  lessonCount: number;
  enrollment: {
    status: "active" | "completed" | "dropped";
    completedLessons: number;
    pct: number;
  } | null;
}

export type EnrollAction = (courseId: string) => Promise<void>;

const STATUS_BADGE: Record<
  CatalogCourse["status"],
  { badge: string; strip: string }
> = {
  published: {
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400",
    strip: "from-emerald-500 to-emerald-700",
  },
  draft: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400",
    strip: "from-amber-400 to-amber-600",
  },
  archived: {
    badge:
      "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    strip: "from-gray-400 to-gray-600",
  },
};

/** Submit button with React 19's useFormStatus pending state. */
function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}): JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function EnrollForm({
  course,
  enrollAction,
  dict,
}: {
  course: CatalogCourse;
  enrollAction: EnrollAction;
  dict: Dictionary;
}): JSX.Element {
  return (
    <form action={enrollAction.bind(null, course.id)}>
      <SubmitButton pendingText={dict.courses.enrolling}>
        <Icon.Play className="h-4 w-4" />
        {dict.courses.enroll}
      </SubmitButton>
    </form>
  );
}

function CourseCard({
  course,
  isAdmin,
  enrollAction,
  dict,
}: {
  course: CatalogCourse;
  isAdmin: boolean;
  enrollAction: EnrollAction;
  dict: Dictionary;
}): JSX.Element {
  const meta = STATUS_BADGE[course.status];
  const enr = course.enrollment;
  const completed = enr?.status === "completed";

  // Action area: enrollment state → manage (admin) → enroll button.
  let action: React.ReactNode;
  if (enr?.status === "dropped") {
    // Dropped courses stay dropped — enroll() returns the existing row
    // unchanged, so surface the state honestly instead of a fake continue.
    action = (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Icon.XMark className="h-4 w-4" />
        {dict.courses.dropped}
      </span>
    );
  } else if (enr) {
    action = completed ? (
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
      >
        <Icon.CheckCircle className="h-4 w-4" />
        {dict.courses.completedLabel}
      </Link>
    ) : (
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
      >
        <Icon.Play className="h-4 w-4" />
        {dict.courses.continueLearning}
      </Link>
    );
  } else if (course.status !== "published" && isAdmin) {
    action = (
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Icon.Cog className="h-4 w-4" />
        {dict.courses.manageCourse}
      </Link>
    );
  } else if (course.status === "published") {
    action = <EnrollForm course={course} enrollAction={enrollAction} dict={dict} />;
  }
  // Otherwise (non-published, non-admin) nothing to show — unreachable in
  // practice since students only ever receive published courses.

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700">
      {/* Status accent strip (decorative) */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${meta.strip}`}
      />

      {/*
        Stretched link — makes the whole card navigable without nesting
        anchors inside the action buttons (which would be invalid HTML).
        Content below uses pointer-events-none so clicks fall through to
        this link; interactive actions opt back in with pointer-events-auto.
      */}
      <Link
        href={`/courses/${course.id}`}
        aria-label={fmt(dict.courses.viewCourseAria, { title: course.title })}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-400">
            <Icon.BookOpen className="h-6 w-6" />
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
          >
            {course.status === "published" ? (
              <Icon.CheckCircle className="h-3 w-3" />
            ) : course.status === "draft" ? (
              <Icon.Clock className="h-3 w-3" />
            ) : (
              <Icon.Cog className="h-3 w-3" />
            )}
            {dict.common.status[course.status]}
          </span>
        </div>

        <h3 className="mt-4 line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-emerald-800 dark:text-gray-100 dark:group-hover:text-emerald-400">
          {course.title}
        </h3>

        {course.description ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {course.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Progress (enrolled courses with lessons) */}
        {enr && course.lessonCount > 0 ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>
                {fmt(dict.courses.lessonsProgress, {
                  completed: enr.completedLessons,
                  total: course.lessonCount,
                })}
              </span>
              <span className={completed ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                {fmt(dict.courses.percent, { n: enr.pct })}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all ${
                  completed
                    ? "bg-emerald-500"
                    : "bg-gradient-to-l from-emerald-400 to-emerald-600"
                }`}
                style={{ width: `${enr.pct}%` }}
              />
            </div>
          </div>
        ) : !enr ? (
          <div className="mt-4 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Icon.BookOpen className="h-3.5 w-3.5" />
            {fmt(dict.courses.lessonCount, { n: course.lessonCount })}
          </div>
        ) : null}

        {/* Action row — interactive elements sit above the stretched link */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {course.lessonCount > 0
              ? fmt(dict.courses.lessonCount, { n: course.lessonCount })
              : dict.courses.noLessons}
          </span>
          {action ? (
            <div className="pointer-events-auto relative">{action}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Status filter chips (admin only — students always see published). */
function FilterChips({
  counts,
  value,
  onChange,
  dict,
}: {
  counts: { all: number; published: number; draft: number; archived: number };
  value: "all" | CatalogCourse["status"];
  onChange: (v: "all" | CatalogCourse["status"]) => void;
  dict: Dictionary;
}): JSX.Element {
  const options: { key: "all" | CatalogCourse["status"]; label: string; n: number }[] = [
    { key: "all", label: dict.courses.filters.all, n: counts.all },
    { key: "published", label: dict.courses.filters.published, n: counts.published },
    { key: "draft", label: dict.courses.filters.draft, n: counts.draft },
    { key: "archived", label: dict.courses.filters.archived, n: counts.archived },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            value === o.key
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
          }`}
        >
          {o.label}
          <span
            className={`rounded-full px-1.5 text-[10px] leading-4 ${
              value === o.key
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {o.n}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Interactive course catalog: instant client-side search + status filter
 * over data fetched by the server page. Enrollment happens through a server
 * action passed down as a prop; revalidatePath re-renders the list.
 */
export default function CourseCatalog({
  courses,
  isAdmin,
  enrollAction,
  dict,
}: {
  courses: CatalogCourse[];
  isAdmin: boolean;
  enrollAction: EnrollAction;
  dict: Dictionary;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CatalogCourse["status"]>("all");

  const counts = useMemo(
    () => ({
      all: courses.length,
      published: courses.filter((c) => c.status === "published").length,
      draft: courses.filter((c) => c.status === "draft").length,
      archived: courses.filter((c) => c.status === "archived").length,
    }),
    [courses]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [courses, query, status]);

  const activeCount = courses.filter(
    (c) => c.enrollment?.status === "active"
  ).length;
  const completedCount = courses.filter(
    (c) => c.enrollment?.status === "completed"
  ).length;

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            {dict.courses.catalogTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? dict.courses.adminSubtitle : dict.courses.studentSubtitle}
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
            <Icon.BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            {fmt(dict.courses.count, { n: courses.length })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
            <Icon.Play className="h-3.5 w-3.5 text-sky-600" />
            {fmt(dict.courses.active, { n: activeCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
            <Icon.CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            {fmt(dict.courses.completed, { n: completedCount })}
          </span>
        </div>
      </div>

      {/* ── Search + filters ────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400">
            <Icon.Search className="h-5 w-5" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.courses.searchPlaceholder}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-10 pe-10 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 end-3 flex items-center text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={dict.courses.clearSearch}
            >
              <Icon.XMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isAdmin ? (
          <FilterChips counts={counts} value={status} onChange={setStatus} dict={dict} />
        ) : null}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <Icon.Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {courses.length === 0
              ? isAdmin
                ? dict.courses.empty.noCoursesAdmin
                : dict.courses.empty.noCoursesStudent
              : dict.courses.empty.notFound}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {courses.length === 0
              ? isAdmin
                ? dict.courses.empty.hintNoCoursesAdmin
                : dict.courses.empty.hintNoCoursesStudent
              : dict.courses.empty.hintNotFound}
          </p>
          {courses.length === 0 && isAdmin ? (
            <Link
              href="/admin/courses"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Icon.Cog className="h-4 w-4" />
              {dict.courses.empty.manageLink}
            </Link>
          ) : null}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isAdmin={isAdmin}
              enrollAction={enrollAction}
              dict={dict}
            />
          ))}
        </div>
      )}
    </div>
  );
}
