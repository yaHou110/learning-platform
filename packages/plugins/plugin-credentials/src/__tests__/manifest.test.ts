import { describe, expect, it } from "vitest";
import { manifest } from "../index.js";
import { PluginManifestSchema } from "@learning-platform/core/plugins";

describe("@learning-platform/plugin-credentials manifest", () => {
  it("validates", () => {
    expect(() => PluginManifestSchema.parse(manifest)).not.toThrow();
  });
  it("declares no DDL migrations", () => {
    expect(manifest.migrations).toEqual([]);
  });
  it("consumes course.completed", () => {
    expect(manifest.domainEvents.find((e: { name: string }) => e.name === "course.completed")?.direction).toBe(
      "consume"
    );
  });
});
