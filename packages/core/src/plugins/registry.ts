/**
 * Plugin manifest contract (typed via Zod) + a small registry.
 *
 * This is the *compile-time* plugin model from ADR-0006:
 *  - Every plugin exports a `manifest` object (or factory) at module top-level.
 *  - `apps/web` imports each manifest and registers it with `createPluginRegistry()`.
 *  - There is no runtime loader, no marketplace, no third-party plugins in v1.
 *
 * Plugins may NOT declare DDL migrations in v1. DDL is owned by `@hawza/core`.
 * Plugins contribute only `jsonb` Zod schemas (via `metadataSchemas`) and event
 * payload types.
 */
import { z } from "zod";

/** What a plugin needs from the RBAC system. */
export const PermissionSchema = z.object({
  key: z.string().min(1),
  description: z.string().min(1),
});
export type Permission = z.infer<typeof PermissionSchema>;

/** A domain-event the plugin emits or consumes (loose binding, typed at the API). */
export const EventRefSchema = z.object({
  name: z.string().min(1),
  direction: z.enum(["emit", "consume"]),
});
export type EventRef = z.infer<typeof EventRefSchema>;

/** API route paths the plugin owns. Validated against the central API contract later. */
export const ApiRouteSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().regex(/^\/api\//, "API routes must start with /api/"),
});
export type ApiRoute = z.infer<typeof ApiRouteSchema>;

/** Zod schemas for plugin-defined `jsonb` columns. Validated at the application boundary. */
export const MetadataSchema = z.object({
  /** Stable key — must match a column on a core-owned table, e.g. `course.metadata`. */
  key: z.string().min(1),
  schema: z.instanceof(z.ZodType),
});
export type MetadataSchemaEntry = z.infer<typeof MetadataSchema>;

export const PluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  description: z.string().min(1),
  domainEvents: z.array(EventRefSchema).default([]),
  permissions: z.array(PermissionSchema).default([]),
  apiRoutes: z.array(ApiRouteSchema).default([]),
  metadataSchemas: z.array(MetadataSchema).default([]),
  /** DDL is owned by core. v1 plugins MUST declare `migrations: []`. */
  migrations: z.array(z.string()).default([]),
});
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export class PluginRegistry {
  private readonly plugins = new Map<string, PluginManifest>();

  register(manifest: PluginManifest): this {
    const parsed = PluginManifestSchema.parse(manifest);
    if (this.plugins.has(parsed.name)) {
      throw new Error(`Plugin "${parsed.name}" is already registered.`);
    }
    this.plugins.set(parsed.name, parsed);
    return this;
  }

  get(name: string): PluginManifest | undefined {
    return this.plugins.get(name);
  }

  list(): PluginManifest[] {
    return [...this.plugins.values()];
  }
}

export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}
