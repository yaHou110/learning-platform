/**
 * `@learning-platform/plugin-localization` — Localization (cross-cutting).
 *
 * Stateless: Persian-first formatting, Shamsi (Jalali) dates, RTL helpers,
 * translation lookup. Owns no tenant data, no DB tables, no API routes of
 * its own — but it does declare the helper surface the other plugins use.
 */
import type { PluginManifest } from "@learning-platform/core/plugins";

export const manifest: PluginManifest = {
  name: "@learning-platform/plugin-localization",
  version: "0.1.0",
  description:
    "Localization (cross-cutting): Persian-first formatting, Shamsi dates, RTL helpers, translation lookup.",
  domainEvents: [],
  permissions: [],
  apiRoutes: [],
  metadataSchemas: [],
  migrations: [],
};

export default manifest;
