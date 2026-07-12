import { auth } from "@/auth";
import { identity } from "@hawza/core/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await identity.listUsers(session.user.tenantId);
  return NextResponse.json(users);
}