import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/forgot-password");
  const isApiAuthPage = pathname.startsWith("/api/auth");
  const isHealthPage = pathname === "/api/health";
  const isReadyPage = pathname === "/api/ready";
  const isMetricsPage = pathname === "/api/metrics";
  const isCertificatesPage =
    pathname === "/api/certificates" || pathname === "/api/certificates/verify";
  const isSecurityTxt = pathname === "/.well-known/security.txt";

  const isPublic =
    isApiAuthPage ||
    isHealthPage ||
    isReadyPage ||
    isMetricsPage ||
    isCertificatesPage ||
    isSecurityTxt;

  // Presence check only — never decrypt in Edge.
  const sessionCookie =
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("authjs.session-token");
  const hasSession = Boolean(sessionCookie);

  // --- Security headers (S3 hardening) ---
  // In dev mode, allow unsafe-eval for Next.js HMR/React Refresh.
  // Note: we check hostname instead of process.env.NODE_ENV because NODE_ENV
  // is unavailable in Edge runtime middleware.
  const isDev = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  // Object-storage origins (ADR-0010): signed media URLs are served straight
  // from the S3 endpoint (MinIO), so the browser must be allowed to load
  // media (<video>/<audio>/<iframe>) and to PUT uploads straight to storage.
  // Next.js inlines process.env.* referenced in middleware at build time; in
  // dev the dev server's env is visible, so setting S3_ENDPOINT in .env works.
  const mediaOrigins: string[] = [];
  const storageEndpoint = process.env.S3_ENDPOINT ?? "";
  if (storageEndpoint) {
    try {
      mediaOrigins.push(new URL(storageEndpoint).origin);
    } catch {
      // Malformed S3_ENDPOINT — CSP stays conservative; media may not load.
    }
  }
  if (isDev) {
    // Dev default (docker-compose.yml MinIO on :9000) even when .env is not
    // set yet, so the dev lane never silently blocks media.
    mediaOrigins.push("http://127.0.0.1:9000", "http://localhost:9000");
  }
  const uniqueOrigins = [...new Set(mediaOrigins)];
  const mediaSrc = ["'self'", ...uniqueOrigins].join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `media-src ${mediaSrc}`,
    `frame-src ${mediaSrc}`,
    `connect-src 'self' ${uniqueOrigins.join(" ")}`,
    "font-src 'self' fonts.gstatic.com",
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
    if (hasSession) {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // Let the login page render regardless; the form + auth() handle state.
      response = NextResponse.next();
    }
  } else if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the complete in-app destination, including its query string,
    // so a successful login can return to the exact protected view.
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    response = NextResponse.redirect(loginUrl);
  } else {
    // Cookie present — pass through; page/route validates with auth() (Node).
    response = NextResponse.next();
  }

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Static assets and PWA plumbing must stay public (no auth redirect) or
  // they break: _next/static, _next/image, favicon.ico, image files,
  // the web-app manifest (fetched by the browser on every visit) and the
  // service worker (fetched during registration, before any session exists).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:png|jpe?g|webp|avif|svg|ico|gif)$).*)",
  ],
};
