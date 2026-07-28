import { describe, expect, it } from "vitest";
import { createPluginRegistry, PluginManifestSchema } from "../src/plugins/registry.js";

describe("plugin registry", () => {
  it("registers and retrieves a manifest", () => {
    const reg = createPluginRegistry();
    const manifest = {
      name: "plugin-auth",
      version: "0.1.0",
      description: "Identity & Access",
      domainEvents: [{ name: "auth.login", direction: "emit" }],
      permissions: [{ key: "auth.login", description: "Sign in" }],
      apiRoutes: [{ method: "POST", path: "/api/auth/login" }],
      metadataSchemas: [],
      migrations: [],
    };
    reg.register(manifest);
    expect(reg.get("plugin-auth")?.name).toBe("plugin-auth");
    expect(reg.list()).toHaveLength(1);
  });

  it("rejects duplicate names", () => {
    const reg = createPluginRegistry();
    const manifest = PluginManifestSchema.parse({
      name: "plugin-x",
      version: "0.1.0",
      description: "x",
    });
    reg.register(manifest);
    expect(() => reg.register(manifest)).toThrow(/already registered/);
  });

  it("enforces migrations: [] (DDL is owned by core, schema is the enforcer)", () => {
    // The schema now rejects non-empty migrations (max(0)). The previous
    // "policy lives in the lint rule" design never materialized — no lint rule
    // ever inspected the migrations array — so enforcement moved into the
    // schema. This test pins the corrected behavior.
    expect(() =>
      PluginManifestSchema.parse({
        name: "plugin-bad",
        version: "0.1.0",
        description: "bad",
        migrations: ["0001_evil.sql"],
      })
    ).toThrow(/migrations/);
  });

  it("accepts a domain event with a non-empty name", () => {
    // EventRefSchema.name is loose (z.string().min(1)); the EventNames SSOT
    // constraint is enforced at the composition root — see
    // apps/web/tests/contracts-coverage.test.ts — to avoid importing
    // @learning-platform/contracts source into core's rootDir-checked program.
    expect(() =>
      PluginManifestSchema.parse({
        name: "plugin-ok",
        version: "0.1.0",
        description: "ok",
        domainEvents: [{ name: "user.invited", direction: "emit" }],
      })
    ).not.toThrow();
  });
});

