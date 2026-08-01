/**
 * SPRINT-002 — pure business rules for Catalog & Learning.
 *
 * These are the decision functions that do not touch the DB, extracted so
 * the visibility / completion model is unit-testable without a database.
 * The DB flows in `catalog` / `learning` call the same helpers, so pinning
 * them here pins the behavior the routes depend on.
 */
import { describe, expect, it } from "vitest";
import { isCourseVisible, normalizeTitle } from "../src/api/catalog.js";
import { isCourseCompleted } from "../src/api/learning.js";

describe("catalog.isCourseVisible", () => {
  it("shows published courses to everyone", () => {
    expect(isCourseVisible({ status: "published", deletedAt: null }, false)).toBe(true);
    expect(isCourseVisible({ status: "published", deletedAt: null }, true)).toBe(true);
  });

  it("hides draft/archived from non-admin callers", () => {
    expect(isCourseVisible({ status: "draft", deletedAt: null }, false)).toBe(false);
    expect(isCourseVisible({ status: "archived", deletedAt: null }, false)).toBe(false);
  });

  it("shows draft/archived only when includeNonPublished is set (admins)", () => {
    expect(isCourseVisible({ status: "draft", deletedAt: null }, true)).toBe(true);
    expect(isCourseVisible({ status: "archived", deletedAt: null }, true)).toBe(true);
  });

  it("never shows soft-deleted rows, even to admins", () => {
    expect(isCourseVisible({ status: "published", deletedAt: new Date() }, true)).toBe(false);
    expect(isCourseVisible({ status: "draft", deletedAt: new Date() }, true)).toBe(false);
  });
});

describe("catalog.normalizeTitle", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeTitle("  فقه   مقدماتی  ")).toBe("فقه مقدماتی");
    expect(normalizeTitle("  A  B\tC ")).toBe("A B C");
  });

  it("rejects empty / whitespace-only titles", () => {
    expect(() => normalizeTitle("")).toThrow(/empty/);
    expect(() => normalizeTitle("   ")).toThrow(/empty/);
  });
});

describe("learning.isCourseCompleted", () => {
  it("is false when the course has no lessons (nothing to complete)", () => {
    expect(isCourseCompleted(0, 0)).toBe(false);
    expect(isCourseCompleted(0, 5)).toBe(false);
  });

  it("is true only when every lesson is completed", () => {
    expect(isCourseCompleted(5, 5)).toBe(true);
    expect(isCourseCompleted(5, 4)).toBe(false);
    expect(isCourseCompleted(5, 0)).toBe(false);
  });
});
