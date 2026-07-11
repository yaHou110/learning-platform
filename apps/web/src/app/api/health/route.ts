import { NextResponse } from "next/server";
import { health } from "@hawza/core/api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const result = await health.check();
  const status = result.db ? 200 : 503;
  return NextResponse.json(
    {
      status: result.db ? "ok" : "degraded",
      db: result.db ? "ok" : "fail",
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
