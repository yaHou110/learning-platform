import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@learning-platform/core/plugins";

describe("@learning-platform/plugin-catalog manifest", () => {
  it("validates against PluginManifestSchema", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations (DDL is owned by core)", () => {
    expect(manifest.migrations).toEqual([]);
  });
});
