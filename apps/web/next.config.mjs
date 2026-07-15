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
  // Hide the X-Powered-By header (security best practice).
  poweredByHeader: false,
  // Security headers applied to all routes.
  async headers() {
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
