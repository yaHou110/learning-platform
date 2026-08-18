/**
 * Locale configuration — Rooyesh ships in Persian (default), English, and
 * Arabic. The active locale is stored in a `locale` cookie and read
 * server-side in the root layout (no URL prefix, so URLs stay stable).
 */

export const LOCALES = ["fa", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fa";

export const LOCALE_COOKIE = "locale";

/** Is the value a supported locale code? (safe for cookie/query parsing) */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export interface LocaleMeta {
  /** Native name of the language, shown in the switcher. */
  label: string;
  /** ISO 639-1 code used on <html lang>. */
  htmlLang: string;
  /** Text direction. */
  dir: "rtl" | "ltr";
  /** Intl locale used for Date/Number formatting. */
  intl: string;
  /** Brand name in this language's script. */
  brand: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  fa: {
    label: "فارسی",
    htmlLang: "fa",
    dir: "rtl",
    intl: "fa-IR",
    brand: "رویش",
  },
  en: {
    label: "English",
    htmlLang: "en",
    dir: "ltr",
    intl: "en-US",
    brand: "Rooyesh",
  },
  ar: {
    label: "العربية",
    htmlLang: "ar",
    dir: "rtl",
    intl: "ar",
    brand: "رویش",
  },
};

export function getMeta(locale: Locale): LocaleMeta {
  return LOCALE_META[locale];
}
