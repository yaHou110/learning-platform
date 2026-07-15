/**
 * `@learning-platform/plugin-credentials` — Credentials bounded context.
 *
 * Issues and verifies completion certificates. Consumes `course.completed`.
 */
import type { PluginManifest } from "@learning-platform/core/plugins";

export const manifest: PluginManifest = {
  name: "@learning-platform/plugin-credentials",
  version: "0.1.0",
  description: "Credentials: issuing and verifying completion certificates.",
  domainEvents: [
    { name: "course.completed", direction: "consume" },
    { name: "certificate.issued", direction: "emit" },
    { name: "certificate.verified", direction: "emit" },
  ],
  permissions: [
    { key: "certificate.read", description: "View own issued certificates." },
    { key: "certificate.verify", description: "Public verification endpoint." },
  ],
  apiRoutes: [
    { method: "GET", path: "/api/certificates" },
    { method: "GET", path: "/api/certificates/verify/:code" },
  ],
  metadataSchemas: [
    // certificate template fields — defined by this plugin, validated at write time.
    // (A real Zod schema is wired in when the table lands.)
  ],
  migrations: [],
};

export default manifest;
