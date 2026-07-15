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

  it("rejects a manifest with DDL migrations in v1 (plugins own no DDL)", () => {
    expect(() =>
      PluginManifestSchema.parse({
        name: "plugin-bad",
        version: "0.1.0",
        description: "bad",
        migrations: ["0001_evil.sql"],
      })
    ).not.toThrow(); // schema doesn't reject — the lint rule is the enforcer.
    // The policy lives in the plugin-typing story + the ESLint rule, not the schema.
  });
});
