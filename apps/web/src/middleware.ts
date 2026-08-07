import { NextResponse } from "next/server";
import type { NextRequest } = "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Allow all requests through for testing
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
