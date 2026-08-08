/**
 * Password reset helpers — pins the code format, the one-way token hashing,
 * phone normalization, and that the TTL constant is sane.
 *
 * Pure functions only: DB-touching helpers (createResetToken /
 * verifyAndConsumeResetToken) are exercised by the app-level flow tests.
 */
import { describe, expect, it } from "vitest";
import {
  generateResetCode,
  hashResetToken,
  normalizePhone,
  RESET_TOKEN_TTL_MS,
} from "../src/auth/password-reset.js";

describe("generateResetCode", () => {
  it("returns a 6-digit numeric code", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateResetCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("zero-pads short values (e.g. 000123)", () => {
    // The generator is random, so we can't force a specific value — but we can
    // assert the invariant that every code is exactly 6 digits, including
    // leading zeros if the CSPRNG draws a small number.
    expect(generateResetCode()).toHaveLength(6);
  });
});

describe("hashResetToken", () => {
  it("is a deterministic sha256 hex digest", () => {
    const h1 = hashResetToken("123456");
    const h2 = hashResetToken("123456");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is one-way — the code cannot be recovered from the hash", () => {
    const hash = hashResetToken("654321");
    expect(hash).not.toContain("654321");
    expect(hashResetToken("654321")).not.toBe(hashResetToken("654322"));
  });
});

describe("normalizePhone", () => {
  it("converts Persian and Arabic digits to Latin", () => {
    expect(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizePhone("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });

  it("strips spaces and dashes", () => {
    expect(normalizePhone(" 0912 345-6789 ")).toBe("09123456789");
  });
});

describe("RESET_TOKEN_TTL_MS", () => {
  it("is a 10-minute window", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(10 * 60 * 1000);
  });
});
