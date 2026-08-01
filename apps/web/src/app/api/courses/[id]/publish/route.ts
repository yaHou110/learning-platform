import { catalog } from "@learning-platform/core/api";
import { requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { routeEnvelope } from "@/lib/api-route";
import { z } from "zod";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE = "/api/courses/:id/publish";

const ADMIN_ROLES = ["super_admin", "center_admin"] as const;

/**
 * POST /api/courses/:id/publish — publish a draft course (admin only).
 * Idempotent: publishing an already-published course is a no-op success.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const env = routeEnvelope(request, ROUTE);
  try {
    const { id } = await ctx.params;
    const courseId = z.string().uuid().safeParse(id).success ? id : null;
    if (!courseId) return env.respond({ error: "Invalid course id", requestId: env.requestId }, 400);

    const gate = await requireRole(ADMIN_ROLES);
    if (!gate.ok) return env.respond({ error: gate.response.status === 401 ? "Unauthorized" : "Forbidden", requestId: env.requestId }, gate.response.status);

    const limiter = rateLimit({ key: `courses:${gate.user.id}`, capacity: 10, refillPerSec: 1 });
    if (!limiter.ok) return env.respond({ error: "Too many requests", requestId: env.requestId }, 429, { tenantId: gate.user.tenantId, userId: gate.user.id });

    const course = await catalog.publishCourse(gate.user.tenantId, courseId);
    if (!course) return env.respond({ error: "Not found", requestId: env.requestId }, 404, { tenantId: gate.user.tenantId, userId: gate.user.id });

    return env.respond(course, 200, { tenantId: gate.user.tenantId, userId: gate.user.id });
  } catch (err) {
    return env.capture(err);
  }
}
