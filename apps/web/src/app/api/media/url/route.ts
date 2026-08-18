import { catalog, learning, media, MediaStorageUnavailableError } from "@learning-platform/core/api";
import { requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { routeEnvelope } from "@/lib/api-route";
import { z } from "zod";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE = "/api/media/url";

const ALL_ROLES = ["super_admin", "center_admin", "teacher", "student"] as const;
const ADMIN_ROLES = ["super_admin", "center_admin"] as const;

const ParamsSchema = z.object({
  key: z.string().min(1).max(500),
  courseId: z.string().uuid(),
  expiresInSeconds: z.coerce.number().int().min(60).max(3600).optional(),
});

/**
 * GET /api/media/url?key=…&courseId=… — short-lived signed URL for a lesson's
 * media (enrolled students + admins only). This is the content-protection
 * choke point: the URL expires in minutes (default 15), so it cannot be saved
 * or shared. The lesson page generates its own URL server-side; this route
 * exists for client-side refresh / admin preview.
 */
export async function GET(request: NextRequest) {
  const env = routeEnvelope(request, ROUTE);
  try {
    const gate = await requireRole(ALL_ROLES);
    if (!gate.ok)
      return env.respond({ error: "Unauthorized", requestId: env.requestId }, gate.response.status);

    const parsed = ParamsSchema.safeParse({
      key: request.nextUrl.searchParams.get("key"),
      courseId: request.nextUrl.searchParams.get("courseId"),
      expiresInSeconds: request.nextUrl.searchParams.get("expiresInSeconds"),
    });
    if (!parsed.success)
      return env.respond({ error: "Invalid query parameters", requestId: env.requestId }, 400, {
        tenantId: gate.user.tenantId,
        userId: gate.user.id,
      });

    const isAdmin = ADMIN_ROLES.includes(gate.user.role as (typeof ADMIN_ROLES)[number]);

    // Non-admins must be enrolled in the course owning the media. The course
    // lookup is tenant-scoped, so a courseId from another tenant fails here.
    if (!isAdmin) {
      const course = await catalog.getCourse(gate.user.tenantId, parsed.data.courseId);
      if (!course)
        return env.respond({ error: "Not found", requestId: env.requestId }, 404, {
          tenantId: gate.user.tenantId,
          userId: gate.user.id,
        });
      const enrollments = await learning.listEnrollments(gate.user.tenantId, {
        userId: gate.user.id,
      });
      const enrolled = enrollments.some((e) => e.courseId === parsed.data.courseId);
      if (!enrolled)
        return env.respond({ error: "Forbidden", requestId: env.requestId }, 403, {
          tenantId: gate.user.tenantId,
          userId: gate.user.id,
        });
    }

    const limiter = rateLimit({ key: `media-url:${gate.user.id}`, capacity: 60, refillPerSec: 2 });
    if (!limiter.ok)
      return env.respond({ error: "Too many requests", requestId: env.requestId }, 429, {
        tenantId: gate.user.tenantId,
        userId: gate.user.id,
      });

    const signed = await media.signedReadUrl(gate.user.tenantId, parsed.data.key, {
      expiresInSeconds: parsed.data.expiresInSeconds,
    });
    if (!signed)
      return env.respond({ error: "Invalid media key", requestId: env.requestId }, 400, {
        tenantId: gate.user.tenantId,
        userId: gate.user.id,
      });

    return env.respond(signed, 200, { tenantId: gate.user.tenantId, userId: gate.user.id });
  } catch (err) {
    if (err instanceof MediaStorageUnavailableError) {
      return env.respond(
        { error: "Object storage is not configured or unreachable", requestId: env.requestId },
        503
      );
    }
    return env.capture(err);
  }
}
