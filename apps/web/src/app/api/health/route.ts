import { NextResponse } from "next/server";
import { health } from "@learning-platform/core/api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await health.check();
    return NextResponse.json(
      {
        status: result.db ? "ok" : "degraded",
        db: result.db,
        timestamp: new Date().toISOString(),
      },
      { status: result.db ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: false,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
