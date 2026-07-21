import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderPrometheus } from "@learning-platform/core/observability";

export const dynamic = "force-dynamic";

/**
 * Prometheus-format metrics endpoint (M5).
 *
 * Access control: v1 is a single self-hosted dedicated VPS (ADR-0007). The
 * metrics endpoint is meant for an internal scrape target behind the reverse
 * proxy (M6), not the public internet. We gate on a shared bearer token
 * (`METRICS_TOKEN`); when that env var is set, callers must send it as
 * `Authorization: Bearer <token>`. When it is unset, the endpoint refuses in
 * production (no accidental public metrics) and allows in development.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const expectedToken = process.env.METRICS_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (expectedToken) {
    const auth = request.headers.get("authorization") ?? "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (provided !== expectedToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (isProd) {
    // No token configured in prod → refuse rather than expose metrics.
    return NextResponse.json({ error: "metrics disabled" }, { status: 503 });
  }

  return new NextResponse(renderPrometheus(), {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
