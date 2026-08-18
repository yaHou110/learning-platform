/**
 * Server-side i18n helpers.
 *
 * The active locale lives in a `locale` cookie (see `LanguageSwitcher`),
 * read here and used to set <html lang/dir>, metadata, and dictionaries.
 * Client components receive the dictionary from their server parents as a
 * prop — the RSC data flow keeps translations renderable without a client
 * runtime.
 */
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getMeta,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "./config";
import { ar, en, fa, type Dictionary } from "./dictionaries";

const DICTIONARIES: Record<Locale, Dictionary> = { fa, en, ar };

export type { Dictionary, Locale };

/** Resolve the active locale from the cookie (defaults to Persian). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Replace `{placeholders}` in a dictionary template with values. */
export function fmt(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/** Locale-aware date formatting (Jalali for fa, Gregorian for en/ar). */
export function formatDate(
  locale: Locale,
  date: Date,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }
): string {
  return new Intl.DateTimeFormat(getMeta(locale).intl, opts).format(date);
}
