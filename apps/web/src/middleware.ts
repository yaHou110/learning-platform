import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isApiAuthPage = pathname.startsWith("/api/auth");
  const isHealthPage = pathname === "/api/health";
  const isReadyPage = pathname === "/api/ready";
  const isMetricsPage = pathname === "/api/metrics";
  const isCertificatesPage =
    pathname === "/api/certificates" || pathname === "/api/certificates/verify";
  const isSecurityTxt = pathname === "/.well-known/security.txt";
  const isLoginApiPage = pathname === "/api/login";

  // Public/unauth surfaces bypass the auth gate.
  const isPublic =
    isApiAuthPage ||
    isHealthPage ||
    isReadyPage ||
    isMetricsPage ||
    isCertificatesPage ||
    isSecurityTxt ||
    isLoginApiPage;

  // --- Security headers (S3 hardening) ---
    // NOTE: We deliberately set CSP WITHOUT a nonce here. Next.js 15 embeds its
    // own per-SSR inline <script>/<style> (the `self.__next_f` RSC serialization
    // payload and next/font styles). A middleware-generated nonce does NOT match
    // the nonce Next baked into the HTML, so a nonce-bearing CSP blocks those
    // inline scripts → React never hydrates → blank page + login never runs.
    // Relaxing script-src/style-src to 'unsafe-inline' (with all other directives
    // strict: default-src 'self', no inline handlers/scripts from arbitrary
    // origins) is the reliable way to keep the server-rendered app working.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    const securityHeaders: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": csp,
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };

  let response: NextResponse;

  if (isPublic) {
    response = NextResponse.next();
  } else if (isAuthPage) {
    response = token
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  } else if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};