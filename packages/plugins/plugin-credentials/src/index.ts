/**
 * @learning-platform/plugin-credentials — Credentials Plugin (certificate issuance & verification).
 *
 * This plugin owns the *registration surface* (manifest + permissions + API routes).
 * The actual `certificates` table and the Drizzle client live in `@learning-platform/core`.
 *
 * The plugin MUST NOT import `drizzle-orm` or `pg` — the ESLint rule in `.eslintrc.cjs` enforces this.
 */
import type { PluginManifest } from "@learning-platform/core/plugins";

export const manifest: PluginManifest = {
  name: "@learning-platform/plugin-credentials",
  version: "0.1.0",
  description: "Credentials: certificate issuance & verification",
  domainEvents: [
    { name: "course.completed", direction: "consume" }
  ],
  permissions: [],
  apiRoutes: [
    { method: "POST", path: "/api/certificates" },
    { method: "GET", path: "/api/certificates/verify" }
  ],
  metadataSchemas: [],
  /** DDL is owned by core. v1 plugins must declare `migrations: []`. */
  migrations: [],
};

export default manifest;