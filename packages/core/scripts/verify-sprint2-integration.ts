/**
 * SPRINT-002 integration verification — real Postgres, no mocks.
 *
 * Exercises the Catalog + Learning bounded contexts end-to-end against a
 * real database (local Docker `lp-postgres`, or any DATABASE_URL):
 *
 *   1. admin creates a course (draft) and two lessons
 *   2. student visibility: draft hidden from students, published visible
 *   3. publish → students see it
 *   4. create a student, enroll → active
 *   5. record progress: lesson 1 started → still active
 *   6. lesson 2 completed → enrollment flips to completed (course done)
 *   7. re-enroll → idempotent (same enrollment row)
 *   8. admin enrolls in a draft course (allowNonPublished) → OK
 *
 * Prints PASS/FAIL per step and exits non-zero on any failure.
 *
 * Usage:
 *   DATABASE_URL=postgres://learning_platform:learning_platform@localhost:5432/learning_platform \
 *   pnpm --filter @learning-platform/core exec tsx --tsconfig tsconfig.scripts.json \
 *     scripts/verify-sprint2-integration.ts
 */
import { loadEnvOnce } from "./load-env.js";
import { catalog, identity, learning } from "../src/api/index.js";
import { getDb, pool } from "../src/db/client.js";
import { and, eq } from "drizzle-orm";
import * as schema from "../src/db/schema/index.js";

loadEnvOnce();

const T = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
};

async function main(): Promise<void> {
  const db = getDb();

  // Fresh marker so re-runs do not collide.
  const suffix = Date.now().toString(36);
  const tenant = await db
    .insert(schema.tenants)
    .values({ slug: `s2-${suffix}`, name: `SPRINT-002 ${suffix}` })
    .returning()
    .then((r) => r[0]);

  const admin = await identity.createUser({
    tenantId: tenant.id,
    email: `admin-${suffix}@lp.local`,
    displayName: "S2 Admin",
    role: "center_admin",
    password: "changeme-verify",
  });
  const student = await identity.createUser({
    tenantId: tenant.id,
    email: `student-${suffix}@lp.local`,
    displayName: "S2 Student",
    role: "student",
    password: "changeme-verify",
  });

  // 1. Create course (draft) + two lessons.
  const course = await catalog.createCourse(tenant.id, admin.id, {
    title: "دوره آزمون یکپارچهسازی",
    description: "created by verify-sprint2-integration",
  });
  T("createCourse returns draft", course.status === "draft", course.status);

  const lesson1 = await catalog.createLesson(tenant.id, {
    courseId: course.id,
    title: "درس ۱",
    contentType: "video",
    durationSeconds: 600,
  });
  const lesson2 = await catalog.createLesson(tenant.id, {
    courseId: course.id,
    title: "درس ۲",
  });
  T("createLesson auto-orders", lesson1.orderIndex === 0 && lesson2.orderIndex === 1,
    `orderIndex=${lesson1.orderIndex},${lesson2.orderIndex}`);

  // 2. Student visibility: draft hidden, published visible.
  const draftAsStudent = await catalog.getCourse(tenant.id, course.id);
  T("draft hidden from student", draftAsStudent === null);

  const published = await catalog.publishCourse(tenant.id, course.id);
  T("publishCourse flips to published", published?.status === "published", published?.status);

  const publishedAsStudent = await catalog.getCourse(tenant.id, course.id);
  T("published visible to student", publishedAsStudent !== null);

  const adminList = await catalog.listCourses(tenant.id, { includeNonPublished: true });
  T("admin lists draft+published", adminList.some((c) => c.id === course.id));

  const studentList = await catalog.listCourses(tenant.id);
  T("student lists published only", studentList.some((c) => c.id === course.id) && studentList.every((c) => c.status === "published"));

  const lessons = await catalog.listLessons(tenant.id, course.id);
  T("listLessons returns both in order", lessons.length === 2 && lessons[0].id === lesson1.id);

  // 4. Enroll + progress.
  const enrollment = await learning.enroll(tenant.id, student.id, course.id);
  T("enroll returns active", enrollment?.status === "active", enrollment?.status);

  const dup = await learning.enroll(tenant.id, student.id, course.id);
  T("re-enroll is idempotent", dup?.id === enrollment?.id);

  const p0 = await learning.recordProgress(tenant.id, student.id, lesson1.id, {
    status: "started",
    lastPositionSeconds: 120,
  });
  T("progress row carries position", p0?.progress.lastPositionSeconds === 120, String(p0?.progress.lastPositionSeconds));
  T("started keeps enrollment active", p0?.enrollment.status === "active", p0?.enrollment.status);

  const p1 = await learning.recordProgress(tenant.id, student.id, lesson1.id, {
    status: "completed",
  });
  T("first lesson completed keeps enrollment active", p1?.enrollment.status === "active", p1?.enrollment.status);

  const p2 = await learning.recordProgress(tenant.id, student.id, lesson2.id, {
    status: "completed",
  });
  T("last lesson completes enrollment", p2?.enrollment.status === "completed", p2?.enrollment.status);
  T("completion stamps completedAt", p2?.enrollment.completedAt !== null);

  // Progress listing for UI.
  const progressRows = await learning.listProgress(tenant.id, enrollment!.id);
  T("listProgress returns both rows", progressRows.length === 2, String(progressRows.length));
  T("listProgress marks lesson2 completed", progressRows.some((r) => r.lessonId === lesson2.id && r.status === "completed"));

  const own = await learning.listEnrollments(tenant.id, { userId: student.id });
  T("listEnrollments(userId) returns own", own.some((e) => e.id === enrollment?.id));

  // 8. Admin can enroll in a draft course.
  const draft2 = await catalog.createCourse(tenant.id, admin.id, { title: "دوره پیشنویس" });
  const adminEnroll = await learning.enroll(tenant.id, admin.id, draft2.id, {
    allowNonPublished: true,
  });
  T("admin enrolls in draft (allowNonPublished)", adminEnroll?.status === "active", adminEnroll?.status);

  const studentEnrollDraft = await learning.enroll(tenant.id, student.id, draft2.id);
  T("student cannot enroll in draft", studentEnrollDraft === null);

  // Tenant isolation: another tenant cannot see this course.
  const otherTenant = await db
    .insert(schema.tenants)
    .values({ slug: `s2-other-${suffix}`, name: `Other ${suffix}` })
    .returning()
    .then((r) => r[0]);
  const crossTenant = await catalog.getCourse(otherTenant.id, course.id, {
    includeNonPublished: true,
  });
  T("cross-tenant isolation holds", crossTenant === null);

  const badLesson = await catalog.getLesson(otherTenant.id, lesson1.id, {
    includeNonPublished: true,
  });
  T("cross-tenant lesson hidden", badLesson === null);

  // Cleanup test tenant rows (leave seed tenant alone).
  await db.delete(schema.lessonProgress).where(eq(schema.lessonProgress.tenantId, tenant.id));
  await db.delete(schema.enrollments).where(and(eq(schema.enrollments.tenantId, tenant.id)));
  await db.delete(schema.lessons).where(and(eq(schema.lessons.tenantId, tenant.id)));
  await db.delete(schema.courses).where(and(eq(schema.courses.tenantId, tenant.id)));
  await db.delete(schema.users).where(and(eq(schema.users.tenantId, tenant.id)));
  await db.delete(schema.tenants).where(eq(schema.tenants.id, tenant.id));
  await db.delete(schema.tenants).where(eq(schema.tenants.id, otherTenant.id));

  console.log(process.exitCode ? "\nINTEGRATION FAILED" : "\nINTEGRATION PASSED");
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool().end();
  });
