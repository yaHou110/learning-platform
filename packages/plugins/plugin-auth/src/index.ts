/**
 * `@learning-platform/plugin-auth` — Identity & Access bounded context.
 *
 * This plugin owns the *registration surface* (manifest + permissions + API
 * routes). The actual `users`/`tenants` tables and the Drizzle client live in
 * `@learning-platform/core` (see `packages/core/src/db/schema/identity.ts`).
 *
 * The plugin MUST NOT import `drizzle-orm` or `pg` — the ESLint rule in
 * `.eslintrc.cjs` enforces this.
 */
import type { PluginManifest } from "@learning-platform/core/plugins";

export const manifest: PluginManifest = {
  name: "@learning-platform/plugin-auth",
  version: "0.1.0",
  description: "Identity & Access: tenants, users, roles, sessions.",
  domainEvents: [
    { name: "tenant.created", direction: "emit" },
    { name: "user.invited", direction: "emit" },
    { name: "user.role_changed", direction: "emit" },
    { name: "user.deactivated", direction: "emit" },
    { name: "auth.login", direction: "emit" },
    { name: "auth.login_failed", direction: "emit" },
  ],
  permissions: [
    { key: "auth.login", description: "Sign in to a tenant." },
    { key: "auth.logout", description: "Sign out." },
    { key: "user.read", description: "List and view users in the current tenant." },
    { key: "user.write", description: "Create, update, deactivate users in the current tenant." },
  ],
  apiRoutes: [
    { method: "POST", path: "/api/auth/login" },
    { method: "POST", path: "/api/auth/logout" },
    { method: "GET", path: "/api/auth/session" },
    { method: "GET", path: "/api/users" },
  ],
  metadataSchemas: [],
  /** DDL is owned by core. v1 plugins must declare `migrations: []`. */
  migrations: [],
};

export default manifest;
