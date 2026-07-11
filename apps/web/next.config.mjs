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
  reactStrictMode: true,
};

export default nextConfig;
