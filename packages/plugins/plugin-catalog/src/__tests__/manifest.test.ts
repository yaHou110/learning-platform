import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@hawza/core/plugins";

describe("@hawza/plugin-catalog manifest", () => {
  it("validates against PluginManifestSchema", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations (DDL is owned by core)", () => {
    expect(manifest.migrations).toEqual([]);
  });
});
