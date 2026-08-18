/**
 * Governance: every locale dictionary must cover exactly the same keys as
 * the Persian (default) one — a missing or extra key would either break a
 * translated page or silently ship an untranslated string.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  isLocale,
  type Locale,
} from "../src/lib/i18n/config";
import { ar, en, fa } from "../src/lib/i18n/dictionaries";
import { fmt } from "../src/lib/i18n";

/** Collect every leaf path of a nested dictionary, e.g. "courses.enroll". */
function leafPaths(node: unknown, prefix = ""): string[] {
  if (node === null || typeof node !== "object") return [prefix];
  const out: string[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.push(...leafPaths(value, path));
  }
  return out;
}

describe("i18n config", () => {
  it("exposes a valid default locale with complete metadata", () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
    for (const locale of LOCALES) {
      const meta = LOCALE_META[locale];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.htmlLang.length).toBeGreaterThan(0);
      expect(["rtl", "ltr"]).toContain(meta.dir);
      expect(meta.intl.length).toBeGreaterThan(0);
      expect(meta.brand.length).toBeGreaterThan(0);
    }
  });

  it("isLocale accepts only supported codes", () => {
    for (const locale of LOCALES) expect(isLocale(locale)).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("FA")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("every locale has the same leaf keys as the default", () => {
    const faKeys = leafPaths(fa).sort();
    expect(faKeys.length).toBeGreaterThan(50); // sanity: the scan found strings
    for (const locale of LOCALES.filter((l) => l !== "fa") as Locale[]) {
      const dict = locale === "en" ? en : ar;
      expect(leafPaths(dict).sort()).toEqual(faKeys);
    }
  });

  it("no dictionary leaf is an empty string (all translated)", () => {
    // login.verse.translation is intentionally empty in ar: the verse is
    // already Arabic script, so the gloss is hidden rather than duplicated.
    const intentionallyEmpty = new Set(["login.verse.translation"]);
    for (const [locale, dict] of [
      ["en", en],
      ["ar", ar],
    ] as const) {
      for (const path of leafPaths(dict)) {
        if (intentionallyEmpty.has(path)) continue;
        const value = path.split(".").reduce<any>((o, k) => o[k], dict);
        expect(value, `${locale}.${path}`).not.toBe("");
      }
    }
  });
});

describe("fmt interpolation", () => {
  it("substitutes placeholders", () => {
    expect(fmt("Hello {name}", { name: "Ali" })).toBe("Hello Ali");
    expect(fmt("{a} of {b}", { a: 2, b: 5 })).toBe("2 of 5");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(fmt("Hello {missing}", {})).toBe("Hello {missing}");
  });
});
