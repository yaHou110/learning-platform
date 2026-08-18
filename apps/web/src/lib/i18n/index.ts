/**
 * Server-side i18n helpers.
 *
 * The active locale lives in a `locale` cookie (see `LanguageSwitcher`),
 * read here and used to set <html lang/dir>, metadata, and dictionaries.
 *
 * IMPORTANT: this module imports `next/headers` and is therefore SERVER-ONLY.
 * Client components must import the pure helpers (`fmt`, `getDictionary`,
 * `formatDate`, `Dictionary`) from `@/lib/i18n/dictionaries`, which has no
 * server-only imports — importing the barrel here from a "use client" file
 * breaks the production build (next/headers is not allowed in client bundles).
 */
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";
import type { Locale } from "./config";

export {
  getDictionary,
  fmt,
  formatDate,
} from "./dictionaries";
export type { Dictionary } from "./dictionaries";
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  getMeta,
  isLocale,
} from "./config";
export type { Locale, LocaleMeta } from "./config";

/** Resolve the active locale from the cookie (defaults to Persian). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}
