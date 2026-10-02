import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_request: NextRequest): Promise<NextResponse> {

  const scriptSrc = "'self' 'unsafe-inline' 'unsafe-eval'";

  const mediaOrigins: string[] = [];
  const storageEndpoint = process.env.S3_ENDPOINT ?? "";
  if (storageEndpoint) {
    try {
      mediaOrigins.push(new URL(storageEndpoint).origin);
    } catch {
      // Malformed S3_ENDPOINT
    }
  }
  mediaOrigins.push("http://127.0.0.1:9000", "http://localhost:9000");
  const uniqueOrigins = [...new Set(mediaOrigins)];
  const mediaSrc = ["'self'", ...uniqueOrigins].join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `media-src ${mediaSrc} blob:`,
    `frame-src ${mediaSrc}`,
    `connect-src 'self' ws: wss: ${uniqueOrigins.join(" ")}`,
    "font-src 'self' fonts.gstatic.com data:",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  const securityHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:png|jpe?g|webp|avif|svg|ico|gif)$).*)",
  ],
};
