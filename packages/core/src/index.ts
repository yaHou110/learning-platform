/**
 * `@hawza/core` — public entry point.
 *
 * Plugins and `apps/web` should import from sub-paths (`@hawza/core/db`,
 * `@hawza/core/auth`, `@hawza/core/plugins`, `@hawza/core/api`) for clarity.
 * This barrel re-exports the same things for convenience.
 */
export * from "./db/index.js";
export * from "./auth/index.js";
export * from "./plugins/index.js";
export * from "./api/index.js";
