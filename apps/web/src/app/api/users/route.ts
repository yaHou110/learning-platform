import { identity } from "@learning-platform/core/api";
import { requireRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { parseQuery } from "@/lib/validation";
import { z } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/users
 *
 * Lists users in the caller's tenant. M4-0 (Session 015) tightened this
 * route in two ways:
 *
 *   1. The Drizzle projection in `identity.listUsers` is explicit and does
 *      NOT select `passwordHash`. The `UserPublic` return type also does
 *      not include `passwordHash`. Defense in depth: SQL, the type system,
 *      and the JSON serializer all agree.
 *
 *   2. The route is gated by `requireRole(["center_admin", "super_admin"])`.
 *      A `student` or `teacher` (or any caller without a session) gets 401
 *      or 403, not a list of users.
 *
 * M4.2 (2026-07-15) added:
 *   3. Per-admin rate limiting (30 req / sustained 1 req/s) keyed by user id.
 *   4. Defensive query-string validation against `UsersQuerySchema`. The
 *      schema currently allows only an optional no-op so future pagination
 *      params get validated "for free" instead of reaching the DB raw.
 *
 * See `evidence/M4-security/M4-0-authz-data-leak.md` and
 * `evidence/M4-security/M4-2-hardening.md` for the full DoR / DoD.
 */

// Pagination will land when the Catalog/UI tasks arrive post-M7. Until then
// we validate the query defensively: anything callers send is rejected unless
// it matches this (deliberately strict) shape. Extend here, never bypass.
const UsersQuerySchema = z
  .object({
    // Reserved for future pagination. Accepted only as a no-op today so the
    // route does not silently start trusting unvalidated params later.
  })
  .strict();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const gate = await requireRole(["center_admin", "super_admin"] as const);
  if (!gate.ok) return gate.response;

  const limiter = rateLimit({
    key: `users:${gate.user.id}`,
    capacity: 30,
    refillPerSec: 1,
  });
  if (!limiter.ok) return limiter.response;

  const q = parseQuery(request, UsersQuerySchema);
  if (!q.ok) return q.response;

  const users = await identity.listUsers(gate.user.tenantId);
  return NextResponse.json(users);
}
