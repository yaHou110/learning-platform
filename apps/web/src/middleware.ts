import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — does a LIGHTWEIGHT session PRESENCE check only.
 *
 * WHY NOT getToken()/jwt decryption here: next-auth v5 beta.31 (via jose)
 * decrypts the JWE session cookie using CompressionStream/DecompressionStream,
 * which are NOT available in the Edge runtime (see the build warning:
 * "A Node.js API is used (CompressionStream ...) which is not supported in
 * the Edge Runtime"). The Node runtime (route handlers / pages via `auth()`)
 * decrypts the cookie fine — verified: POST /api/auth/callback/credentials
 * returns 302 + session cookie, and GET /api/auth/session with that cookie
 * returns the user, while GET /dashboard still 307'd to /login. So real
 * authentication/authorization stays in `auth()` (Node) inside every page and
 * route handler; this middleware only avoids round-tripping anonymous users.
 *
 * All protected pages already call `auth()` and redirect to /login themselves,
 * so an expired/invalid cookie cannot reach protected content.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
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
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("authjs.session-token");
  const hasSession = Boolean(sessionCookie);

  // --- Security headers (S3 hardening) ---
  // NOTE: deliberately NO nonce here. Next.js 15 embeds its own per-SSR inline
  // <script>/<style> (the `self.__next_f` RSC payload and next/font styles). A
  // middleware-generated nonce does NOT match the nonce Next baked into the
  // HTML, so a nonce-bearing CSP blocks those inline scripts -> React never
  // hydrates -> blank page. Relaxing script-src/style-src to 'unsafe-inline'
  // (all other directives strict) keeps the server-rendered app working.
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
    // Let the login page render regardless; the form + auth() handle state.
    response = NextResponse.next();
  } else if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
