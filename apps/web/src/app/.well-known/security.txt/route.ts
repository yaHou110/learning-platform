import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * GET /.well-known/security.txt  (RFC 9116)
 *
 * M4.2 (2026-07-15): standardized vulnerability-reporting contact point per
 * RFC 9116. Served as a route handler (no `apps/web/public/` dir exists in v1)
 * so the content is versioned with the codebase and the Content-Type is exact.
 *
 * Update the `Expires` field so it stays less than a year out.
 */
export function GET(): NextResponse {
  const body = [
    "Contact: mailto:security@example.com",
    "Expires: 2027-07-15T00:00:00.000Z",
    "Preferred-Languages: fa, en",
    "Canonical: /.well-known/security.txt",
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // RFC 9116: SHOULD be served over HTTPS; until TLS lands (M6) this is
      // served as-is. No-cache keeps a stale snapshot from surviving a fail.
      "Cache-Control": "no-store",
    },
  });
}
