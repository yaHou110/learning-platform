/**
 * `@hawza/plugin-learning` — Learning & Progress bounded context.
 */
import type { PluginManifest } from "@hawza/core/plugins";

export const manifest: PluginManifest = {
  name: "@hawza/plugin-learning",
  version: "0.1.0",
  description: "Learning & Progress: enrollment, lesson progress, learning paths.",
  domainEvents: [
    { name: "enrollment.created", direction: "emit" },
    { name: "enrollment.completed", direction: "emit" },
    { name: "lesson.progress.updated", direction: "emit" },
    { name: "course.completed", direction: "emit" },
    { name: "path.updated", direction: "emit" },
  ],
  permissions: [
    { key: "enrollment.read", description: "View own enrollments and progress." },
    { key: "enrollment.write", description: "Enroll, unenroll, and record lesson progress." },
    { key: "path.read", description: "View the per-level learning path." },
  ],
  apiRoutes: [
    { method: "GET", path: "/api/enrollments" },
    { method: "POST", path: "/api/enrollments" },
    { method: "POST", path: "/api/lessons/:id/progress" },
    { method: "GET", path: "/api/paths" },
  ],
  metadataSchemas: [],
  migrations: [],
};

export default manifest;
