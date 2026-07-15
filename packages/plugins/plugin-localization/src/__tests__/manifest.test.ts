import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@learning-platform/core/plugins";

describe("@learning-platform/plugin-localization manifest", () => {
  it("validates", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations", () => {
    expect(manifest.migrations).toEqual([]);
  });
  it("is stateless — no API routes, no events, no permissions", () => {
    expect(manifest.apiRoutes).toEqual([]);
    expect(manifest.domainEvents).toEqual([]);
    expect(manifest.permissions).toEqual([]);
  });
});
