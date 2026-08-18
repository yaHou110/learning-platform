import type { MetadataRoute } from "next";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getMeta } from "@/lib/i18n/config";

/**
 * Web App Manifest for the PWA.
 *
 * Served at /manifest.webmanifest by the App Router. Follows the active
 * locale (cookie): localized name/description plus correct `dir`/`lang`,
 * brand colors from the design tokens.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const meta = getMeta(locale);

  return {
    name: dict.brand.title,
    short_name: dict.brand.name,
    description: dict.brand.description,
    dir: meta.dir,
    lang: meta.htmlLang,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#047857",
    categories: ["education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
