import { auth } from "@/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 *
 * Returns the caller's session. M4.2 (2026-07-15) added an IP-keyed rate
 * limit so an unauthenticated attacker cannot hammer this endpoint to
 * probe session validity. Buckets: 60 req burst, 1 req/s sustained. Authjs
 * internals (`/api/auth/*` catch-all) are exempted from middleware and rely
 * on their own handling, but this thin session route is ours to guard.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const limiter = rateLimit({
    key: `session:${ipKey(request)}`,
    capacity: 60,
    refillPerSec: 1,
  });
  if (!limiter.ok) return limiter.response;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      tenantId: session.user.tenantId,
    },
  });
}
