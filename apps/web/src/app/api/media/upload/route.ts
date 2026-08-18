import { media, MediaStorageUnavailableError } from "@learning-platform/core/api";
import { requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation";
import { routeEnvelope } from "@/lib/api-route";
import { z } from "zod";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE = "/api/media/upload";

const ADMIN_ROLES = ["super_admin", "center_admin"] as const;

// Cap uploads at 1 GiB in v1 (video/audio lessons). Raise with the storage
// plan if larger assets become normal.
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

const RequestUploadSchema = z
  .object({
    mimeType: z.string().min(1).max(200),
    sizeBytes: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
    ext: z.string().max(20).optional(),
  })
  .strict();

/**
 * POST /api/media/upload — reserve a media_assets row and get a presigned PUT
 * URL (admin only). The client uploads the bytes straight to object storage;
 * the app never streams media through itself. Storage unconfigured/unreachable
 * answers 503 so admins see a clear reason instead of a generic 500.
 */
export async function POST(request: NextRequest) {
  const env = routeEnvelope(request, ROUTE);
  try {
    const gate = await requireRole(ADMIN_ROLES);
    if (!gate.ok)
      return env.respond(
        { error: gate.response.status === 401 ? "Unauthorized" : "Forbidden", requestId: env.requestId },
        gate.response.status
      );

    const limiter = rateLimit({ key: `media-upload:${gate.user.id}`, capacity: 10, refillPerSec: 1 / 10 });
    if (!limiter.ok)
      return env.respond({ error: "Too many requests", requestId: env.requestId }, 429, {
        tenantId: gate.user.tenantId,
        userId: gate.user.id,
      });

    const body = await parseBody(request, RequestUploadSchema);
    if (!body.ok)
      return env.respond({ error: "Invalid request body", issues: body.issues }, 400, {
        tenantId: gate.user.tenantId,
        userId: gate.user.id,
      });

    const result = await media.requestUpload(gate.user.tenantId, gate.user.id, body.data);
    return env.respond(result, 201, { tenantId: gate.user.tenantId, userId: gate.user.id });
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
