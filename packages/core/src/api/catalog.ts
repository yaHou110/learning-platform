/**
 * Catalog & Content — bounded context API.
 *
 * See `docs/02-architecture/BOUNDED_CONTEXTS.md` → Catalog & Content and
 * `docs/02-architecture/DATA_MODEL.md` → core_courses / core_content.
 *
 * All queries are tenant-scoped at the application layer (ADR-0008): every
 * WHERE clause carries `tenant_id`, and every projection excludes soft-deleted
 * rows (`deleted_at IS NULL`) unless explicitly opted in. RLS policies on the
 * tables remain defense-in-depth for a future non-owner DB role
 * (ADR-0008 trigger #2 / `FORCE ROW LEVEL SECURITY`).
 *
 * Visibility model (v1):
 * - Students and teachers see only `published` courses/lessons.
 * - Center/super admins additionally see `draft` and `archived` rows
 *   (`includeNonPublished: true`) so they can manage the catalog.
 * - `archived` rows are never surfaced to non-admins even with the flag
 *   — the flag only widens to draft + archived, callers that want published
 *   only pass nothing.
 *
 * Input validation happens at the route layer (Zod). This module re-checks
 * only the invariants the DB itself would reject (empty title), so a future
 * caller cannot bypass route validation and produce a confusing constraint
 * error.
 */
import { and, asc, desc, eq, isNull, max } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const CONTENT_TYPES = ["video", "audio", "pdf", "text"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Course row shape as returned by this API (full row; no secret columns exist). */
export type Course = schema.Course;
export type Lesson = schema.Lesson;

/** True when a course row may be surfaced to the caller. */
export function isCourseVisible(
  course: { status: string; deletedAt: Date | null },
  includeNonPublished: boolean
): boolean {
  if (course.deletedAt) return false;
  if (course.status === "published") return true;
  return includeNonPublished;
}

/** Normalize free-text input: trim, collapse whitespace, reject empty. */
export function normalizeTitle(raw: string): string {
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.length === 0) throw new Error("title must not be empty");
  return t;
}

export const catalog = {
  /**
   * List courses in the tenant, newest first. Soft-deleted rows are always
   * excluded; `includeNonPublished` widens the status filter to draft/archived
   * for admin callers.
   */
  async listCourses(
    tenantId: string,
    opts: { includeNonPublished?: boolean | undefined; status?: CourseStatus | undefined } = {}
  ): Promise<Course[]> {
    const db = getDb();
    const conditions = [
      eq(schema.courses.tenantId, tenantId),
      isNull(schema.courses.deletedAt),
    ];
    if (!opts.includeNonPublished && !opts.status) {
      conditions.push(eq(schema.courses.status, "published"));
    } else if (opts.status) {
      conditions.push(eq(schema.courses.status, opts.status));
    }
    return db
      .select()
      .from(schema.courses)
      .where(and(...conditions))
      .orderBy(desc(schema.courses.createdAt));
  },

  /** Get one course by id, tenant-scoped and soft-delete aware. */
  async getCourse(
    tenantId: string,
    courseId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Promise<Course | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.tenantId, tenantId),
          eq(schema.courses.id, courseId),
          isNull(schema.courses.deletedAt)
        )
      )
      .limit(1);
    if (!row) return null;
    if (!isCourseVisible(row, opts.includeNonPublished ?? false)) return null;
    return row;
  },

  /** Create a course (default status `draft`). `createdBy` is set by the route. */
  async createCourse(
    tenantId: string,
    createdBy: string,
    input: {
      title: string;
      description?: string | undefined;
      status?: CourseStatus | undefined;
    }
  ): Promise<Course> {
    const db = getDb();
    const [row] = await db
      .insert(schema.courses)
      .values({
        tenantId,
        title: normalizeTitle(input.title),
        description: input.description?.trim() || null,
        status: input.status ?? "draft",
        createdBy,
      })
      .returning();
    if (!row) throw new Error("createCourse: no row returned");
    return row;
  },

  /** Update a course's mutable fields. Returns null when not found/hidden. */
  async updateCourse(
    tenantId: string,
    courseId: string,
    input: {
      title?: string | undefined;
      description?: string | null | undefined;
      status?: CourseStatus | undefined;
    }
  ): Promise<Course | null> {
    const db = getDb();
    const existing = await this.getCourse(tenantId, courseId, {
      includeNonPublished: true,
    });
    if (!existing) return null;

    const [row] = await db
      .update(schema.courses)
      .set({
        ...(input.title !== undefined
          ? { title: normalizeTitle(input.title) }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.courses.tenantId, tenantId),
          eq(schema.courses.id, courseId)
        )
      )
      .returning();
    if (!row) throw new Error("updateCourse: no row returned");
    return row;
  },

  /**
   * Publish a course (draft → published). Idempotent: publishing an already
   * published course returns it unchanged. Archived courses can be re-published.
   */
  async publishCourse(tenantId: string, courseId: string): Promise<Course | null> {
    const db = getDb();
    const existing = await this.getCourse(tenantId, courseId, {
      includeNonPublished: true,
    });
    if (!existing) return null;

    const [row] = await db
      .update(schema.courses)
      .set({ status: "published", updatedAt: new Date() })
      .where(
        and(
          eq(schema.courses.tenantId, tenantId),
          eq(schema.courses.id, courseId)
        )
      )
      .returning();
    if (!row) throw new Error("publishCourse: no row returned");
    return row;
  },

  /** List a course's lessons in display order (order_index, then created). */
  async listLessons(
    tenantId: string,
    courseId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Promise<Lesson[]> {
    const db = getDb();
    const course = await this.getCourse(tenantId, courseId, opts);
    if (!course) return [];
    return db
      .select()
      .from(schema.lessons)
      .where(
        and(
          eq(schema.lessons.tenantId, tenantId),
          eq(schema.lessons.courseId, courseId),
          isNull(schema.lessons.deletedAt)
        )
      )
      .orderBy(asc(schema.lessons.orderIndex), asc(schema.lessons.createdAt));
  },

  /** Get one lesson by id; returns null when the owning course is hidden. */
  async getLesson(
    tenantId: string,
    lessonId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Promise<Lesson | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.lessons)
      .where(
        and(
          eq(schema.lessons.tenantId, tenantId),
          eq(schema.lessons.id, lessonId),
          isNull(schema.lessons.deletedAt)
        )
      )
      .limit(1);
    if (!row) return null;
    const course = await this.getCourse(tenantId, row.courseId, opts);
    if (!course) return null;
    return row;
  },

  /**
   * Create a lesson inside a course. `orderIndex` defaults to the next slot
   * (max order + 1) so append-order is natural without client coordination.
   * Returns null when the owning course does not exist in the tenant.
   */
  async createLesson(
    tenantId: string,
    input: {
      courseId: string;
      title: string;
      contentType?: ContentType | undefined;
      contentRef?: string | undefined;
      orderIndex?: number | undefined;
      durationSeconds?: number | undefined;
    }
  ): Promise<Lesson | null> {
    const db = getDb();
    const course = await this.getCourse(tenantId, input.courseId, {
      includeNonPublished: true,
    });
    if (!course) return null;

    let orderIndex = input.orderIndex;
    if (orderIndex === undefined) {
      const [agg] = await db
        .select({ maxOrder: max(schema.lessons.orderIndex) })
        .from(schema.lessons)
        .where(
          and(
            eq(schema.lessons.tenantId, tenantId),
            eq(schema.lessons.courseId, input.courseId)
          )
        );
      orderIndex = (agg?.maxOrder ?? -1) + 1;
    }

    const [row] = await db
      .insert(schema.lessons)
      .values({
        tenantId,
        courseId: input.courseId,
        title: normalizeTitle(input.title),
        contentType: input.contentType ?? "text",
        contentRef: input.contentRef?.trim() || null,
        orderIndex,
        durationSeconds: input.durationSeconds ?? null,
      })
      .returning();
    if (!row) throw new Error("createLesson: no row returned");
    return row;
  },
};
