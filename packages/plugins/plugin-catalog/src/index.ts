/**
 * `@learning-platform/plugin-catalog` — Catalog & Content bounded context.
 *
 * The actual `courses` / `lessons` / `media` tables will live in `@learning-platform/core`
 * (added in a later session). This plugin declares the manifest, permissions,
 * and API routes.
 */
import type { PluginManifest } from "@learning-platform/core/plugins";

export const manifest: PluginManifest = {
  name: "@learning-platform/plugin-catalog",
  version: "0.1.0",
  description: "Catalog & Content: courses, lessons, media assets.",
  domainEvents: [
    { name: "course.published", direction: "emit" },
    { name: "course.archived", direction: "emit" },
    { name: "lesson.created", direction: "emit" },
    { name: "lesson.updated", direction: "emit" },
    { name: "media.uploaded", direction: "emit" },
  ],
  permissions: [
    { key: "course.read", description: "View published courses and lessons." },
    { key: "course.write", description: "Create, edit, publish, archive courses and lessons." },
    { key: "media.upload", description: "Upload lesson media (video/audio/pdf/text)." },
  ],
  apiRoutes: [
    { method: "GET", path: "/api/courses" },
    { method: "POST", path: "/api/courses" },
    { method: "GET", path: "/api/courses/:id" },
    { method: "PATCH", path: "/api/courses/:id" },
    { method: "POST", path: "/api/courses/:id/publish" },
    { method: "GET", path: "/api/courses/:id/lessons" },
    { method: "GET", path: "/api/lessons/:id" },
    { method: "POST", path: "/api/lessons" },
    { method: "POST", path: "/api/media/upload" },
    { method: "GET", path: "/api/media/url" },
  ],
  metadataSchemas: [],
  migrations: [],
};

export default manifest;
