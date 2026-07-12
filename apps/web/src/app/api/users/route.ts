import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { identity } from "@hawza/core/api";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  try {
    const users = await identity.listUsers(tenantId);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
