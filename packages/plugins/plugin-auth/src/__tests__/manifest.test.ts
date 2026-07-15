import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@learning-platform/core/plugins";

describe("@learning-platform/plugin-auth manifest", () => {
  it("validates against PluginManifestSchema", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });

  it("declares no DDL migrations (DDL is owned by core)", () => {
    expect(manifest.migrations).toEqual([]);
  });

  it("declares the expected events", () => {
    const names = manifest.domainEvents.map((e: { name: string }) => e.name);
    expect(names).toContain("auth.login");
    expect(names).toContain("auth.login_failed");
  });
});
