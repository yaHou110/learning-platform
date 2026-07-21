/** @type {import('next').NextConfig} */
const nextConfig = {
  // Internal workspace packages need transpilation under App Router.
  transpilePackages: [
    "@learning-platform/core",
    "@learning-platform/contracts",
    "@learning-platform/plugin-auth",
    "@learning-platform/plugin-catalog",
    "@learning-platform/plugin-learning",
    "@learning-platform/plugin-credentials",
    "@learning-platform/plugin-localization",
  ],
  // Native Node modules used by workspace packages must NOT be bundled
  // by webpack — they are required at runtime.
  // Note: `bcrypt` was replaced by `bcryptjs` (pure JS) in M1. Kept
  // empty for future native modules if needed.
  serverExternalPackages: [],
  reactStrictMode: true,
  // Produce a standalone output for Docker (M6 deployment).
  output: "standalone",
  // Hide the X-Powered-By header (security best practice).
  poweredByHeader: false,
  // Security headers applied to all routes.
  // M4.2 (2026-07-15): added Content-Security-Policy. v1 ships a strict,
  // static CSP tuned for the vanilla Next.js App Router app:
  //   - default-src 'self'                 -> deny by default
  //   - script-src 'self'                  -> no inline scripts beyond what
  //                                            Next injects (RSC payload,
  //                                            HMR in dev) — see caveat below
  //   - style-src 'self' 'unsafe-inline'    -> Next + Tailwind generate
  //                                            inline style attrs/hashes;
  //                                            removing 'unsafe-inline'
  //                                            breaks layout (nonces parked)
  //   - img-src 'self' data:               -> data: for inlined UI assets
  //   - font-src 'self' fonts.gstatic.com  -> Vazirmatn via next/font serves
  //                                            css from self, glyphs from
  //                                            fonts.gstatic.com
  //   - connect-src 'self'                 -> no cross-origin fetch / XHR
  //   - frame-ancestors 'none'             -> clickjacking (redundant with
  //                                            X-Frame-Options: DENY)
  //   - base-uri 'self' object-src 'none' form-action 'self'
  // Dev-only note: Next dev injects eval/inline for HMR; the headers() hook
  // adds these in prod builds too, so dev HMR is unaffected (headers() takes
  // effect at request time and dev tolerates a stricter policy while serving
  // its own chunks, which are 'self'). If a dev-page console error surfaces,
  // the fix is a per-request nonce, parked for v1.
  // HSTS (Strict-Transport-Security) is deliberately NOT set here yet — it
  // must only be sent over TLS, and v1 dev/preview is plain HTTP. Enable at
  // M6 behind the reverse proxy once TLS is live. See evidence/M4-2-hardening.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  // TypeScript NodeNext convention: source uses `.js` extensions that
  // resolve to `.ts` files. Webpack must alias this for Next.js to
  // bundle workspace packages that follow that pattern (e.g. @learning-platform/core).
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
