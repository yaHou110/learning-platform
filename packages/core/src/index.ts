/**
 * `@learning-platform/core` — public entry point.
 *
 * Plugins and `apps/web` should import from sub-paths (`@learning-platform/core/db`,
 * `@learning-platform/core/auth`, `@learning-platform/core/plugins`, `@learning-platform/core/api`) for clarity.
 * This barrel re-exports the same things for convenience.
 */
export * from "./db/index.js";
export * from "./auth/index.js";
export * from "./plugins/index.js";
export * from "./api/index.js";
