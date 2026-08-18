"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

/**
 * `beforeinstallprompt` is a Chromium-only event; TypeScript's DOM lib
 * does not include it, so declare the minimal shape we consume.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rooyesh-install-dismissed";

/**
 * Pure decision logic (unit-tested without a DOM): show the banner only on
 * mobile browsers, when the app is not already installed, and when the user
 * has not dismissed it before.
 */
export function shouldShowInstallBanner({
  standalone,
  mobile,
  dismissed,
}: {
  standalone: boolean;
  mobile: boolean;
  dismissed: boolean;
}): boolean {
  return !standalone && mobile && !dismissed;
}

/**
 * InstallBanner — a dismissible bottom banner for phone browsers telling
 * users they can install the app. Offers up to three paths:
 *   1. Cafe Bazaar listing   (env CAFE_BAZAAR_URL)
 *   2. Direct APK download   (env APK_DIRECT_URL)
 *   3. In-browser install    (beforeinstallprompt → native install dialog)
 * On iOS (no beforeinstallprompt) it shows an "Add to Home Screen" hint.
 *
 * The banner appears a few seconds after load so it never fights first
 * paint, and only once per device (dismissal is persisted in localStorage).
 */
export default function PwaInstallBanner({
  dict,
  bazaarUrl,
  apkUrl,
}: {
  dict: Dictionary["pwaInstall"];
  bazaarUrl?: string | undefined;
  apkUrl?: string | undefined;
}): JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // private mode — treat as not dismissed
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const mobile =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    // Dev-only escape hatch: ?install=1 previews the banner on desktop.
    const forceShow =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).has("install");

    if (!forceShow && !shouldShowInstallBanner({ standalone, mobile, dismissed })) {
      return;
    }

    const onPrompt = (e: Event): void => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Wait a beat so the banner never competes with first-paint resources.
    const timer = window.setTimeout(() => setVisible(true), 4000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  function dismiss(): void {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // private mode — ignore
    }
  }

  async function installFromBrowser(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") dismiss();
  }

  if (!visible) return null;

  const hasExternal = Boolean(bazaarUrl) || Boolean(apkUrl);

  return (
    <div
      role="dialog"
      aria-label={dict.title}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50"
    >
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl shadow-gray-900/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c-4.2 0-7.5 2.9-8.1 6.8a13 13 0 0016.2 0C19.5 5.9 16.2 3 12 3z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3V1.8" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.2V20a1 1 0 001 1h13a1 1 0 001-1v-9.8"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.8 21v-3a2.2 2.2 0 014.4 0v3"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {dict.title}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {dict.subtitle}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {bazaarUrl ? (
              <a
                href={bazaarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                {dict.bazaar}
              </a>
            ) : null}
            {apkUrl ? (
              <a
                href={apkUrl}
                download
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {dict.directApk}
              </a>
            ) : null}
            {deferred ? (
              <button
                type="button"
                onClick={() => void installFromBrowser()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              >
                {dict.browser}
              </button>
            ) : null}
            {isIOS && !deferred && !hasExternal ? (
              <span className="text-[11px] leading-4 text-gray-400 dark:text-gray-500">
                {dict.iosHint}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={dict.dismiss}
          title={dict.dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
