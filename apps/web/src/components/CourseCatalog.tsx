"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";
import { fmt, type Dictionary } from "@/lib/i18n/dictionaries";

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

const COURSE_IMAGES: Record<string, string> = {
  "course-demo": "/images/course_cover_fiqh_1790957819642.jpg",
  "course-fiqh-101": "/images/course_cover_fiqh_1790957819642.jpg",
  "course-ethics-201": "/images/course_cover_ethics_1790957831132.jpg",
};
const DEFAULT_IMAGE = "/images/dashboard_hero_learning_1790957806674.jpg";

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
      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
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
  const enr = course.enrollment;
  const completed = enr?.status === "completed";
  const imageSrc = COURSE_IMAGES[course.id] ?? DEFAULT_IMAGE;

  let action: React.ReactNode;
  if (enr?.status === "dropped") {
    action = (
      <span className="text-xs font-medium text-slate-400">
        {dict.courses.dropped}
      </span>
    );
  } else if (enr) {
    action = completed ? (
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
      >
        <Icon.CheckCircle className="h-4 w-4" />
        {dict.courses.completedLabel}
      </Link>
    ) : (
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-800 hover:shadow-md"
      >
        <Icon.Play className="h-4 w-4" />
        {dict.courses.continueLearning}
      </Link>
    );
  } else if (course.status !== "published" && isAdmin) {
    action = (
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Icon.Cog className="h-4 w-4" />
        {dict.courses.manageCourse}
      </Link>
    );
  } else if (course.status === "published") {
    action = (
      <form action={enrollAction.bind(null, course.id)}>
        <SubmitButton pendingText={dict.courses.enrolling}>
          <Icon.Play className="h-4 w-4" />
          {dict.courses.enroll}
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Visual Cover */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={imageSrc}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        
        <div className="absolute top-3 start-3">
          <span className="text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            {course.status === "published" ? "دوره فعال" : course.status === "draft" ? "پیش‌نویس" : "بایگانی شده"}
          </span>
        </div>

        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-xs text-white">
          <span className="font-semibold text-emerald-300">
            مرکز رویش
          </span>
          <span className="text-slate-300 text-[11px]">
            {fmt(dict.courses.lessonCount, { n: course.lessonCount })}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-400 line-clamp-2"
        >
          {course.title}
        </Link>

        {course.description ? (
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Progress Bar (if enrolled) */}
        {enr && course.lessonCount > 0 ? (
          <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {course.lessonCount > 0
              ? fmt(dict.courses.lessonCount, { n: course.lessonCount })
              : dict.courses.noLessons}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

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
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "همه دوره‌ها" },
    { id: "fiqh", label: "فقه و احکام" },
    { id: "ethics", label: "اخلاق و تربیت" },
    { id: "quran", label: "قرآن و معارف" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [courses, query]);

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>کاتالوگ آموزشی و فرهنگی مرکز</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {dict.courses.catalogTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAdmin ? dict.courses.adminSubtitle : dict.courses.studentSubtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400">
            <Icon.Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.courses.searchPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 ps-9 pe-9 text-xs text-slate-900 shadow-2xs outline-hidden transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 end-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <Icon.XMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Interactive Category Bar ──────────────────────────────── */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? "bg-emerald-700 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Courses Grid ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Icon.Search className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
            موردی یافت نشد
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            لطفاً عبارت دیگری را جست‌وجو نمایید.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
