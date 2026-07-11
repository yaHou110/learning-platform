import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@hawza/core/plugins";

describe("@hawza/plugin-learning manifest", () => {
  it("validates", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations", () => {
    expect(manifest.migrations).toEqual([]);
  });
});
