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
  // Shallow readiness (M5) — load balancer / reverse proxy scrapes this.
  const isReadyPage = request.nextUrl.pathname === "/api/ready";
  // Metrics (M5) — gated by bearer token inside the route handler itself.
  // Middleware must not short-circuit it; the route does the auth check so a
  // forgotten token returns 401, not a silent redirect.
  const isMetricsPage = request.nextUrl.pathname === "/api/metrics";
  // RFC 9116 security.txt — public; must not require auth.
  const isSecurityTxt =
    request.nextUrl.pathname === "/.well-known/security.txt";

  if (
    isApiAuthPage ||
    isHealthPage ||
    isReadyPage ||
    isMetricsPage ||
    isSecurityTxt
  ) {
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