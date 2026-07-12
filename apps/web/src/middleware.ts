import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuthPage = request.nextUrl.pathname.startsWith("/api/auth");
  const isHealthPage = request.nextUrl.pathname === "/api/health";

  if (isApiAuthPage || isHealthPage) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};