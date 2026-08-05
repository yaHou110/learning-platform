import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest): Promise<NextResponse> {
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
    // Certificate endpoints — public verification surface.
    const isCertificatesPage =
      request.nextUrl.pathname === "/api/certificates" ||
      request.nextUrl.pathname === "/api/certificates/verify";
    // RFC 9116 security.txt — public; must not require auth.
    const isSecurityTxt =
      request.nextUrl.pathname === "/.well-known/security.txt";

    // --- Per-request CSP nonce (S3 security hardening) ---
    // Generate a 128-bit nonce using Web Crypto API (Edge Runtime compatible,
    // unlike Node's `crypto.randomBytes`). We inject it into the CSP style-src
    // so inline <style> injected by React Server Components (next/font,
    // Tailwind) loads without a blanket 'unsafe-inline'. script-src stays
    // 'self' + nonce (no inline scripts beyond what Next controls). CSP3
    // browsers prefer the nonce and effectively downgrade 'unsafe-inline' to
    // a no-op for nonce-bearing responses.
    const nonceBytes = new Uint8Array(16);
    crypto.getRandomValues(nonceBytes);
    const nonce = btoa(String.fromCharCode(...nonceBytes));
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'nonce-${nonce}'",
      "style-src 'self' 'unsafe-inline' 'nonce-${nonce}'",
      "img-src 'self' data:",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ]
      .join("; ")
      .replace(/\$\{nonce\}/g, nonce);

    const securityHeaders: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": csp,
      // HSTS — only meaningful over TLS; Vercel serves HTTPS by default.
      // Safe to set unconditionally now that production is on Vercel (HTTPS).
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };

    let response: NextResponse;

    if (
      isApiAuthPage ||
      isHealthPage ||
      isReadyPage ||
      isMetricsPage ||
      isCertificatesPage ||
      isSecurityTxt
    ) {
    response = NextResponse.next();
  } else if (isAuthPage) {
    if (token) {
      response = NextResponse.redirect(new URL("/", request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  // Attach CSP + security headers to every middleware-handled response.
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};