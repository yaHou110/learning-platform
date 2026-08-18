"use client";

import { useCallback } from "react";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_META,
  type Locale,
} from "@/lib/i18n/config";

/**
 * LanguageSwitcher — sets the `locale` cookie and reloads so the server
 * re-renders with the new <html lang/dir> and dictionary. A reload (rather
 * than client-side state) keeps every server component in sync.
 */
export default function LanguageSwitcher({
  current,
  label = "Language",
}: {
  current: Locale;
  label?: string;
}): JSX.Element {
  const change = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as Locale;
      if (value === current) return;
      document.cookie = `${LOCALE_COOKIE}=${value};path=/;max-age=31536000;samesite=lax`;
      window.location.reload();
    },
    [current]
  );

  return (
    <select
      value={current}
      onChange={change}
      aria-label={label}
      title={label}
      className="h-9 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-300 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-700 dark:hover:text-gray-100"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_META[l].label}
        </option>
      ))}
    </select>
  );
}
