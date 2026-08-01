/**
 * Learning & Progress — bounded context API.
 *
 * See `docs/02-architecture/BOUNDED_CONTEXTS.md` → Learning & Progress and
 * `docs/02-architecture/DATA_MODEL.md` → core_progress.
 *
 * Tenant scoping is application-layer (ADR-0008): every query carries
 * `tenant_id`. Enrollments are unique per (tenant, user, course) — the
 * migration's unique index backs the idempotent enroll().
 *
 * Progress model (v1):
 * - A lesson is tracked per enrollment (enrollment_id + lesson_id unique).
 * - Recording `completed` for the last remaining lesson flips the enrollment
 *   to `completed` and stamps `completed_at` (course completion).
 * - The pure `isCourseCompleted` helper is exported for tests; the DB flow
 *   re-checks with fresh counts so concurrent progress writes converge.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { catalog } from "./catalog.js";

const descCreatedAt = desc(schema.enrollments.enrolledAt);
const sqlCount = () => sql<number>`count(*)::int`;

export const ENROLLMENT_STATUSES = ["active", "completed", "dropped"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const PROGRESS_STATUSES = ["started", "completed"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export type Enrollment = schema.Enrollment;
export type LessonProgress = schema.LessonProgress;

/** Pure rule: a course is complete when it has lessons and all are completed. */
export function isCourseCompleted(
  totalLessons: number,
  completedLessons: number
): boolean {
  return totalLessons > 0 && completedLessons >= totalLessons;
}

export const learning = {
  /**
   * List enrollments. Without `userId` (admin callers) returns the whole
   * tenant's enrollments; with it (self-service) only that user's.
   */
  async listEnrollments(
    tenantId: string,
    opts: { userId?: string | undefined; status?: EnrollmentStatus | undefined } = {}
  ): Promise<Enrollment[]> {
    const db = getDb();
    const conditions = [eq(schema.enrollments.tenantId, tenantId)];
    if (opts.userId) conditions.push(eq(schema.enrollments.userId, opts.userId));
    if (opts.status) conditions.push(eq(schema.enrollments.status, opts.status));
    return db
      .select()
      .from(schema.enrollments)
      .where(and(...conditions))
      .orderBy(descCreatedAt);
  },

  /**
   * Enroll a user in a course. Idempotent: an existing enrollment (any
   * status) is returned unchanged — the (tenant, user, course) unique index
   * guarantees no duplicates even under a race. `allowNonPublished` lets
   * admins enroll in draft courses; students may only enroll in published
   * ones. Returns null when the course is not visible/enrollable.
   */
  async enroll(
    tenantId: string,
    userId: string,
    courseId: string,
    opts: { allowNonPublished?: boolean | undefined } = {}
  ): Promise<Enrollment | null> {
    const db = getDb();
    const course = await catalog.getCourse(tenantId, courseId, {
      includeNonPublished: opts.allowNonPublished ?? false,
    });
    if (!course) return null;

    const existing = await this.findEnrollment(tenantId, userId, courseId);
    if (existing) return existing;

    const [row] = await db
      .insert(schema.enrollments)
      .values({ tenantId, userId, courseId, status: "active" })
      .onConflictDoNothing({
        target: [
          schema.enrollments.tenantId,
          schema.enrollments.userId,
          schema.enrollments.courseId,
        ],
      })
      .returning();
    if (row) return row;

    // Lost the race to a concurrent enroll — return the winner.
    return this.findEnrollment(tenantId, userId, courseId);
  },

  async findEnrollment(
    tenantId: string,
    userId: string,
    courseId: string
  ): Promise<Enrollment | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.tenantId, tenantId),
          eq(schema.enrollments.userId, userId),
          eq(schema.enrollments.courseId, courseId)
        )
      )
      .limit(1);
    return row ?? null;
  },

  /** The caller's active enrollment for a course, if any. */
  async findActiveEnrollment(
    tenantId: string,
    userId: string,
    courseId: string
  ): Promise<Enrollment | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.tenantId, tenantId),
          eq(schema.enrollments.userId, userId),
          eq(schema.enrollments.courseId, courseId),
          eq(schema.enrollments.status, "active")
        )
      )
      .limit(1);
    return row ?? null;
  },

  /**
   * Record lesson progress for an enrolled user.
   *
   * Requires an ACTIVE enrollment for the lesson's course. Upserts the
   * (enrollment, lesson) row. When every non-deleted lesson of the course is
   * `completed`, the enrollment flips to `completed` with `completed_at`.
   *
   * Returns `{ progress, enrollment }` or null when the lesson is not
   * visible/enrolled.
   */
  async recordProgress(
    tenantId: string,
    userId: string,
    lessonId: string,
    input: {
      status: ProgressStatus;
      lastPositionSeconds?: number | undefined;
    }
  ): Promise<{ progress: LessonProgress; enrollment: Enrollment } | null> {
    const db = getDb();
    const lesson = await catalog.getLesson(tenantId, lessonId);
    if (!lesson) return null;

    const enrollment = await this.findActiveEnrollment(
      tenantId,
      userId,
      lesson.courseId
    );
    if (!enrollment) return null;

    const now = new Date();
    const completedAt = input.status === "completed" ? now : null;
    const patch = {
      status: input.status,
      ...(input.lastPositionSeconds !== undefined
        ? { lastPositionSeconds: input.lastPositionSeconds }
        : {}),
      ...(completedAt ? { completedAt } : {}),
    };

    const [progress] = await db
      .insert(schema.lessonProgress)
      .values({ tenantId, enrollmentId: enrollment.id, lessonId, ...patch })
      .onConflictDoUpdate({
        target: [
          schema.lessonProgress.enrollmentId,
          schema.lessonProgress.lessonId,
        ],
        set: {
          ...patch,
          ...(input.status === "started" && !completedAt
            ? { completedAt: null }
            : {}),
        },
      })
      .returning();
    if (!progress) throw new Error("recordProgress: no row returned");

    // Course-completion check: count lessons vs completed progress.
    const lessonCount = await this.countLessons(tenantId, lesson.courseId);
    const completedCount = await this.countCompleted(
      tenantId,
      enrollment.id
    );
    if (isCourseCompleted(lessonCount, completedCount)) {
      await db
        .update(schema.enrollments)
        .set({ status: "completed", completedAt: now })
        .where(eq(schema.enrollments.id, enrollment.id));
      enrollment.status = "completed";
      enrollment.completedAt = now;
    }

    return { progress, enrollment };
  },

  async countLessons(tenantId: string, courseId: string): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ count: sqlCount() })
      .from(schema.lessons)
      .where(
        and(
          eq(schema.lessons.tenantId, tenantId),
          eq(schema.lessons.courseId, courseId),
          isNull(schema.lessons.deletedAt)
        )
      );
    return Number(row?.count ?? 0);
  },

  async countCompleted(tenantId: string, enrollmentId: string): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ count: sqlCount() })
      .from(schema.lessonProgress)
      .where(
        and(
          eq(schema.lessonProgress.tenantId, tenantId),
          eq(schema.lessonProgress.enrollmentId, enrollmentId),
          eq(schema.lessonProgress.status, "completed")
        )
      );
    return Number(row?.count ?? 0);
  },
};
