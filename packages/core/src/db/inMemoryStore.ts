import bcrypt from "bcryptjs";
import type { Role } from "./schema/index.js";
import type { Course, Lesson, CourseStatus, ContentType } from "../api/catalog.js";
import type { Enrollment, LessonProgress, ProgressStatus, EnrollmentStatus } from "../api/learning.js";
import type { UserPublic } from "../api/index.js";
import type { Certificate } from "../api/credentials.js";

// Pre-computed bcrypt hash for password "changeme" at cost 10:
const DEMO_PASSWORD_HASH = bcrypt.hashSync("changeme", 10);

export interface MemoryTenant {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
}

export interface MemoryUser {
  id: string;
  tenantId: string;
  email: string;
  nationalId: string;
  phone: string;
  displayName: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  deactivatedAt: Date | null;
}

export class InMemoryStore {
  tenants: MemoryTenant[] = [
    {
      id: "tenant-1001",
      slug: "1001",
      name: "مرکز فرهنگی تربیتی رویش",
      createdAt: new Date(),
    },
  ];

  users: MemoryUser[] = [
    {
      id: "user-admin",
      tenantId: "tenant-1001",
      email: "admin@lp.local",
      nationalId: "1234567891",
      phone: "09123456789",
      displayName: "Super Admin",
      role: "super_admin",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
      createdAt: new Date(),
      deactivatedAt: null,
    },
  ];

  courses: Course[] = [
    {
      id: "course-demo",
      tenantId: "tenant-1001",
      title: "دوره مقدماتی فقه (دمو)",
      description: "دوره مقدماتی آشنایی با مباحث فقه، آماده‌شده برای اولین مرکز نمونه.",
      status: "published",
      createdBy: "user-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  lessons: Lesson[] = [
    {
      id: "lesson-1",
      tenantId: "tenant-1001",
      courseId: "course-demo",
      title: "درس ۱ — مقدمه و تاریخچه",
      contentType: "text",
      contentRef: null,
      orderIndex: 0,
      durationSeconds: 300,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: "lesson-2",
      tenantId: "tenant-1001",
      courseId: "course-demo",
      title: "درس ۲ — طهارت",
      contentType: "text",
      contentRef: null,
      orderIndex: 1,
      durationSeconds: 600,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: "lesson-3",
      tenantId: "tenant-1001",
      courseId: "course-demo",
      title: "درس ۳ — نماز",
      contentType: "text",
      contentRef: null,
      orderIndex: 2,
      durationSeconds: 900,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: "lesson-4",
      tenantId: "tenant-1001",
      courseId: "course-demo",
      title: "درس ۴ — روزه",
      contentType: "video",
      contentRef: null,
      orderIndex: 3,
      durationSeconds: 1200,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: "lesson-5",
      tenantId: "tenant-1001",
      courseId: "course-demo",
      title: "درس ۵ — خمس و زکات",
      contentType: "text",
      contentRef: null,
      orderIndex: 4,
      durationSeconds: 600,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  enrollments: Enrollment[] = [
    {
      id: "enroll-admin-demo",
      tenantId: "tenant-1001",
      userId: "user-admin",
      courseId: "course-demo",
      status: "completed",
      enrolledAt: new Date(Date.now() - 7 * 86400000),
      completedAt: new Date(),
    },
  ];

  progress: LessonProgress[] = [
    { id: "prog-1", tenantId: "tenant-1001", enrollmentId: "enroll-admin-demo", lessonId: "lesson-1", status: "completed", lastPositionSeconds: 300, startedAt: new Date(), completedAt: new Date() },
    { id: "prog-2", tenantId: "tenant-1001", enrollmentId: "enroll-admin-demo", lessonId: "lesson-2", status: "completed", lastPositionSeconds: 600, startedAt: new Date(), completedAt: new Date() },
    { id: "prog-3", tenantId: "tenant-1001", enrollmentId: "enroll-admin-demo", lessonId: "lesson-3", status: "completed", lastPositionSeconds: 900, startedAt: new Date(), completedAt: new Date() },
    { id: "prog-4", tenantId: "tenant-1001", enrollmentId: "enroll-admin-demo", lessonId: "lesson-4", status: "completed", lastPositionSeconds: 1200, startedAt: new Date(), completedAt: new Date() },
    { id: "prog-5", tenantId: "tenant-1001", enrollmentId: "enroll-admin-demo", lessonId: "lesson-5", status: "completed", lastPositionSeconds: 600, startedAt: new Date(), completedAt: new Date() },
  ];

  certificates: Certificate[] = [
    {
      id: "cert-demo-1001",
      tenantId: "tenant-1001",
      userId: "user-admin",
      courseId: "course-demo",
      enrollmentId: "enroll-admin-demo",
      issueDate: new Date(),
      expirationDate: null,
      certificateHash: "4f8a9b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
      signedPayload: {
        certificateId: "cert-demo-1001",
        userId: "user-admin",
        courseId: "course-demo",
        enrollmentId: "enroll-admin-demo",
      },
      status: "active",
    },
  ];

  findCertificateByEnrollment(enrollmentId: string): Certificate | undefined {
    return this.certificates.find((c) => c.enrollmentId === enrollmentId);
  }

  findCertificateByHash(hash: string): Certificate | undefined {
    return this.certificates.find((c) => c.certificateHash === hash);
  }

  findCertificateById(id: string): Certificate | undefined {
    return this.certificates.find((c) => c.id === id);
  }

  saveCertificate(cert: Certificate): Certificate {
    const existing = this.findCertificateByEnrollment(cert.enrollmentId);
    if (existing) return existing;
    this.certificates.push(cert);
    return cert;
  }

  // --- Auth & Identity ---
  findTenantBySlug(slug: string): MemoryTenant | undefined {
    return this.tenants.find((t) => t.slug === slug);
  }

  findUserByNationalId(tenantId: string, nationalId: string): MemoryUser | undefined {
    return this.users.find((u) => u.tenantId === tenantId && u.nationalId === nationalId);
  }

  findUserById(userId: string): MemoryUser | undefined {
    return this.users.find((u) => u.id === userId);
  }

  listUsers(tenantId: string): UserPublic[] {
    return this.users
      .filter((u) => u.tenantId === tenantId)
      .map(({ passwordHash: _, ...publicFields }) => ({ ...publicFields }));
  }

  createUser(user: Omit<MemoryUser, "id" | "createdAt" | "deactivatedAt">): MemoryUser {
    const newUser: MemoryUser = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date(),
      deactivatedAt: null,
    };
    this.users.push(newUser);
    return newUser;
  }

  // --- Catalog ---
  listCourses(
    tenantId: string,
    opts: { includeNonPublished?: boolean | undefined; status?: CourseStatus | undefined } = {}
  ): Course[] {
    return this.courses
      .filter((c) => {
        if (c.tenantId !== tenantId || c.deletedAt !== null) return false;
        if (opts.status) return c.status === opts.status;
        if (opts.includeNonPublished) return true;
        return c.status === "published";
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getCourse(
    tenantId: string,
    courseId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Course | null {
    const c = this.courses.find(
      (c) => c.tenantId === tenantId && c.id === courseId && c.deletedAt === null
    );
    if (!c) return null;
    if (c.status === "published" || opts.includeNonPublished) return c;
    return null;
  }

  createCourse(
    tenantId: string,
    createdBy: string,
    input: { title: string; description?: string | undefined; status?: CourseStatus | undefined }
  ): Course {
    const newCourse: Course = {
      id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "draft",
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.courses.unshift(newCourse);
    return newCourse;
  }

  updateCourse(
    tenantId: string,
    courseId: string,
    input: { title?: string | undefined; description?: string | null | undefined; status?: CourseStatus | undefined }
  ): Course | null {
    const c = this.getCourse(tenantId, courseId, { includeNonPublished: true });
    if (!c) return null;
    if (input.title !== undefined) c.title = input.title;
    if (input.description !== undefined) c.description = input.description;
    if (input.status !== undefined) c.status = input.status;
    c.updatedAt = new Date();
    return c;
  }

  publishCourse(tenantId: string, courseId: string): Course | null {
    return this.updateCourse(tenantId, courseId, { status: "published" });
  }

  listLessons(
    tenantId: string,
    courseId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Lesson[] {
    const course = this.getCourse(tenantId, courseId, opts);
    if (!course) return [];
    return this.lessons
      .filter((l) => l.tenantId === tenantId && l.courseId === courseId && l.deletedAt === null)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getLesson(
    tenantId: string,
    lessonId: string,
    opts: { includeNonPublished?: boolean | undefined } = {}
  ): Lesson | null {
    const lesson = this.lessons.find(
      (l) => l.tenantId === tenantId && l.id === lessonId && l.deletedAt === null
    );
    if (!lesson) return null;
    const course = this.getCourse(tenantId, lesson.courseId, opts);
    if (!course) return null;
    return lesson;
  }

  createLesson(
    tenantId: string,
    input: {
      courseId: string;
      title: string;
      contentType?: ContentType | undefined;
      contentRef?: string | undefined;
      orderIndex?: number | undefined;
      durationSeconds?: number | undefined;
    }
  ): Lesson | null {
    const course = this.getCourse(tenantId, input.courseId, { includeNonPublished: true });
    if (!course) return null;
    const courseLessons = this.listLessons(tenantId, input.courseId, { includeNonPublished: true });
    const orderIndex = input.orderIndex ?? (courseLessons.length > 0 ? Math.max(...courseLessons.map((l) => l.orderIndex)) + 1 : 0);
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      courseId: input.courseId,
      title: input.title,
      contentType: input.contentType ?? "text",
      contentRef: input.contentRef ?? null,
      orderIndex,
      durationSeconds: input.durationSeconds ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.lessons.push(newLesson);
    return newLesson;
  }

  // --- Learning & Progress ---
  listEnrollments(
    tenantId: string,
    opts: { userId?: string | undefined; status?: EnrollmentStatus | undefined } = {}
  ): Enrollment[] {
    return this.enrollments
      .filter((e) => {
        if (e.tenantId !== tenantId) return false;
        if (opts.userId && e.userId !== opts.userId) return false;
        if (opts.status && e.status !== opts.status) return false;
        return true;
      })
      .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
  }

  findEnrollment(tenantId: string, userId: string, courseId: string): Enrollment | null {
    return (
      this.enrollments.find(
        (e) => e.tenantId === tenantId && e.userId === userId && e.courseId === courseId
      ) ?? null
    );
  }

  findActiveEnrollment(tenantId: string, userId: string, courseId: string): Enrollment | null {
    return (
      this.enrollments.find(
        (e) =>
          e.tenantId === tenantId &&
          e.userId === userId &&
          e.courseId === courseId &&
          e.status === "active"
      ) ?? null
    );
  }

  enroll(
    tenantId: string,
    userId: string,
    courseId: string,
    opts: { allowNonPublished?: boolean | undefined } = {}
  ): Enrollment | null {
    const course = this.getCourse(tenantId, courseId, {
      includeNonPublished: opts.allowNonPublished,
    });
    if (!course) return null;
    const existing = this.findEnrollment(tenantId, userId, courseId);
    if (existing) return existing;
    const newEnrollment: Enrollment = {
      id: `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      userId,
      courseId,
      status: "active",
      enrolledAt: new Date(),
      completedAt: null,
    };
    this.enrollments.push(newEnrollment);
    return newEnrollment;
  }

  recordProgress(
    tenantId: string,
    userId: string,
    lessonId: string,
    input: { status: ProgressStatus; lastPositionSeconds?: number | undefined }
  ): { progress: LessonProgress; enrollment: Enrollment } | null {
    const lesson = this.getLesson(tenantId, lessonId);
    if (!lesson) return null;
    const enrollment = this.findActiveEnrollment(tenantId, userId, lesson.courseId);
    if (!enrollment) return null;

    const now = new Date();
    let existingProg = this.progress.find(
      (p) => p.enrollmentId === enrollment.id && p.lessonId === lessonId
    );

    if (existingProg) {
      existingProg.status = input.status;
      if (input.lastPositionSeconds !== undefined) {
        existingProg.lastPositionSeconds = input.lastPositionSeconds;
      }
      if (input.status === "completed") {
        existingProg.completedAt = now;
      }
    } else {
      existingProg = {
        id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId,
        enrollmentId: enrollment.id,
        lessonId,
        status: input.status,
        lastPositionSeconds: input.lastPositionSeconds ?? null,
        startedAt: now,
        completedAt: input.status === "completed" ? now : null,
      };
      this.progress.push(existingProg);
    }

    // Check completion
    const courseLessons = this.listLessons(tenantId, lesson.courseId);
    const completedProgress = this.progress.filter(
      (p) => p.enrollmentId === enrollment.id && p.status === "completed"
    );
    if (courseLessons.length > 0 && completedProgress.length >= courseLessons.length) {
      enrollment.status = "completed";
      enrollment.completedAt = now;
    }

    return { progress: existingProg, enrollment };
  }

  listProgress(tenantId: string, enrollmentId: string): LessonProgress[] {
    return this.progress.filter(
      (p) => p.tenantId === tenantId && p.enrollmentId === enrollmentId
    );
  }

  countLessons(tenantId: string, courseId: string): number {
    return this.listLessons(tenantId, courseId).length;
  }

  countCompleted(tenantId: string, enrollmentId: string): number {
    return this.progress.filter(
      (p) => p.tenantId === tenantId && p.enrollmentId === enrollmentId && p.status === "completed"
    ).length;
  }
}

// Global singleton instance
export const memoryStore = new InMemoryStore();
