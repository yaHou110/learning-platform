import { catalog, COURSE_STATUSES } from "@learning-platform/core/api";
import { requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody, parseQuery } from "@/lib/validation";
import { routeEnvelope } from "@/lib/api-route";
import { z } from "zod";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE = "/api/courses";

const ALL_ROLES = ["super_admin", "center_admin", "teacher", "student"] as const;
const ADMIN_ROLES = ["super_admin", "center_admin"] as const;

const CoursesQuerySchema = z
  .object({
    status: z.enum(COURSE_STATUSES).optional(),
  })
  .strict();

const CreateCourseSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(4000).optional(),
    status: z.enum(COURSE_STATUSES).optional(),
  })
  .strict();

/**
 * GET /api/courses — list courses in the caller's tenant.
 * Students/teachers see published only; admins see draft + archived too
 * (the catalog-management view). Optional `?status=` filter narrows either.
 *
 * POST /api/courses — create a course (admin only, permission course.write).
 */
export async function GET(request: NextRequest) {
  const env = routeEnvelope(request, ROUTE);
  try {
    const gate = await requireRole(ALL_ROLES);
    if (!gate.ok) return env.respond({ error: "Unauthorized", requestId: env.requestId }, gate.response.status);

    const q = parseQuery(request, CoursesQuerySchema);
    if (!q.ok) return env.respond({ error: "Invalid query parameters", issues: q.issues }, 400, { tenantId: gate.user.tenantId, userId: gate.user.id });

    const isAdmin = ADMIN_ROLES.includes(gate.user.role as (typeof ADMIN_ROLES)[number]);
    const courses = await catalog.listCourses(gate.user.tenantId, {
      includeNonPublished: isAdmin,
      status: q.data.status,
    });
    return env.respond(courses, 200, { tenantId: gate.user.tenantId, userId: gate.user.id });
  } catch (err) {
    return env.capture(err);
  }
}

export async function POST(request: NextRequest) {
  const env = routeEnvelope(request, ROUTE);
  try {
    const gate = await requireRole(ADMIN_ROLES);
    if (!gate.ok) return env.respond({ error: gate.response.status === 401 ? "Unauthorized" : "Forbidden", requestId: env.requestId }, gate.response.status);

    const limiter = rateLimit({ key: `courses:${gate.user.id}`, capacity: 10, refillPerSec: 1 });
    if (!limiter.ok) return env.respond({ error: "Too many requests", requestId: env.requestId }, 429, { tenantId: gate.user.tenantId, userId: gate.user.id });

    const body = await parseBody(request, CreateCourseSchema);
    if (!body.ok) return env.respond({ error: "Invalid request body", issues: body.issues }, 400, { tenantId: gate.user.tenantId, userId: gate.user.id });

    const course = await catalog.createCourse(gate.user.tenantId, gate.user.id, body.data);
    return env.respond(course, 201, { tenantId: gate.user.tenantId, userId: gate.user.id });
  } catch (err) {
    return env.capture(err);
  }
}
