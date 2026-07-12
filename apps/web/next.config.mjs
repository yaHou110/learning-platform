/** @type {import('next').NextConfig} */
const nextConfig = {
  // Internal workspace packages need transpilation under App Router.
  transpilePackages: [
    "@hawza/core",
    "@hawza/contracts",
    "@hawza/plugin-auth",
    "@hawza/plugin-catalog",
    "@hawza/plugin-learning",
    "@hawza/plugin-credentials",
    "@hawza/plugin-localization",
  ],
  // Native Node modules used by workspace packages must NOT be bundled
  // by webpack — they are required at runtime. `@hawza/core` uses `bcrypt`
  // (native) for password hashing; the alternative `bcryptjs` (pure JS) is
  // also present in `apps/web` for Auth.js adapters that need it.
  serverExternalPackages: ["bcrypt"],
  reactStrictMode: true,
  // TypeScript NodeNext convention: source uses `.js` extensions that
  // resolve to `.ts` files. Webpack must alias this for Next.js to
  // bundle workspace packages that follow that pattern (e.g. @hawza/core).
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
