/**
 * Catalog & Content — bounded context schema.
 *
 * See `docs/02-architecture/BOUNDED_CONTEXTS.md` → Catalog & Content.
 * See `docs/02-architecture/DATA_MODEL.md` → Plugin tables → core_courses.
 *
 * Tables: courses, lessons, media_assets.
 * All tenant-scoped (tenant_id + composite index) with soft-delete (deleted_at).
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { tenants, users } from "./identity";

/** A course belongs to a tenant. Status governs visibility. */
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    tenantIdx: index("courses_tenant_idx").on(t.tenantId),
    // Partial composite index for the most common catalog browse query:
    // "published courses for this tenant, excluding soft-deleted".
    // See docs/02-architecture/DATA_MODEL.md → Indexes (minimum).
    tenantStatusIdx: index("courses_tenant_status_idx")
      .on(t.tenantId, t.status)
      .where(sql`deleted_at IS NULL`),
    statusCheck: check(
      "courses_status_check",
      sql`${t.status} in ('draft','published','archived')`
    ),
  })
);

/** A lesson belongs to a course. content_type governs rendering. */
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    contentType: text("content_type").notNull().default("text"),
    contentRef: text("content_ref"),
    orderIndex: integer("order_index").notNull().default(0),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    tenantCourseIdx: index("lessons_tenant_course_idx").on(
      t.tenantId,
      t.courseId
    ),
    // Partial composite index for the lesson navigator: "all lessons of a
    // course in display order, excluding soft-deleted".
    // See docs/02-architecture/DATA_MODEL.md → Indexes (minimum).
    courseOrderIdx: index("lessons_course_order_idx")
      .on(t.courseId, t.orderIndex)
      .where(sql`deleted_at IS NULL`),
    contentTypeCheck: check(
      "lessons_content_type_check",
      sql`${t.contentType} in ('video','audio','pdf','text')`
    ),
  })
);

/** A media asset belongs to a tenant. Stored in object storage (MinIO/S3). */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksum: text("checksum"),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tenantIdx: index("media_assets_tenant_idx").on(t.tenantId),
    storageKeyUnique: uniqueIndex("media_assets_storage_key_unique").on(
      t.storageKey
    ),
  })
);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
