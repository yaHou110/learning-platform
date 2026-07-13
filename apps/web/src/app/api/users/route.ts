import { identity } from "@hawza/core/api";
import { requireRole } from "@/lib/authz";
import { NextResponse } from "next/server";

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
 * See `evidence/M4-security/M4-0-authz-data-leak.md` for the full DoR / DoD.
 */
export async function GET(): Promise<NextResponse> {
  const gate = await requireRole(["center_admin", "super_admin"] as const);
  if (!gate.ok) return gate.response;

  const users = await identity.listUsers(gate.user.tenantId);
  return NextResponse.json(users);
}
