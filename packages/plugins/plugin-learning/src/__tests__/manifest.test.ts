import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@learning-platform/core/plugins";

describe("@learning-platform/plugin-learning manifest", () => {
  it("validates", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations", () => {
    expect(manifest.migrations).toEqual([]);
  });
});
