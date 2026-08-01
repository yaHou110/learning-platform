/**
 * Learning & Progress — bounded context schema.
 *
 * See `docs/02-architecture/BOUNDED_CONTEXTS.md` → Learning & Progress.
 * See `docs/02-architecture/DATA_MODEL.md` → Plugin tables → core_progress.
 *
 * Tables: enrollments, lesson_progress.
 * All tenant-scoped (tenant_id + composite index).
 */
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { tenants, users } from "./identity";
import { courses, lessons } from "./catalog";

/** A user enrolled in a course. */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    tenantUserCourseUnique: uniqueIndex("enrollments_tenant_user_course_unique").on(
      t.tenantId,
      t.userId,
      t.courseId
    ),
    statusCheck: check(
      "enrollments_status_check",
      sql`${t.status} in ('active','completed','dropped')`
    ),
  })
);

/** Per-lesson progress tracking. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("started"),
    lastPositionSeconds: integer("last_position_seconds"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    enrollmentLessonUnique: uniqueIndex("lesson_progress_enrollment_lesson_unique").on(
      t.enrollmentId,
      t.lessonId
    ),
    statusCheck: check(
      "lesson_progress_status_check",
      sql`${t.status} in ('started','completed')`
    ),
  })
);

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
