/**
 * Plugin manifest contract (typed via Zod) + a small registry.
 *
 * This is the *compile-time* plugin model from ADR-0006:
 *  - Every plugin exports a `manifest` object (or factory) at module top-level.
 *  - `apps/web` imports each manifest and registers it with `createPluginRegistry()`.
 *  - There is no runtime loader, no marketplace, no third-party plugins in v1.
 *
 * Plugins may NOT declare DDL migrations in v1. DDL is owned by `@learning-platform/core`.
 * Plugins contribute only `jsonb` Zod schemas (via `metadataSchemas`) and event
 * payload types.
 *
 * The `migrations: []` rule is enforced HERE in the schema (`max(0)`), not left to
 * a never-materialized ESLint rule: a plugin that declares DDL fails
 * `PluginManifestSchema.parse()`. The previous "policy lives in lint" design was
 * aspirational — no such lint rule ever existed (verified: the 5 plugin eslintrc
 * files only restrict `drizzle-orm`/`pg` imports), so the registry test that pinned
 * the non-enforcing behavior is now flipped to assert rejection.
 *
 * `domainEvents[].name` is intentionally a loose `z.string().min(1)` here (NOT a
 * `z.enum` of the contracts `EventNames`): pulling `@learning-platform/contracts`
 * source into `core`'s program trips TS6059 (core builds with `rootDir: "src"` +
 * `declaration`, and contracts ships `main` → source). The single-source-of-truth
 * enforcement that a `z.enum` would give is instead realized at the composition
 * root — `apps/web/tests/contracts-coverage.test.ts` imports both
 * `getPluginRegistry()` and `EventNames` and fails on any drift — so contracts is a
 * real enforcement layer (CI-gated) without crossing the build boundary the wrong
 * way.
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
  /** DDL is owned by core. v1 plugins MUST declare `migrations: []` — enforced. */
  migrations: z.array(z.string()).max(0).default([]),
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
