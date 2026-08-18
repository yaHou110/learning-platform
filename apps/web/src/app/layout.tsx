import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getMeta } from "@/lib/i18n/config";
import "@/app/globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-vazirmatn",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.brand.title,
    description: dict.brand.description,
    // iOS home-screen metadata (web app manifest covers Android/Chrome).
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: dict.brand.name,
    },
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
};

/**
 * Inline script that runs before hydration to set the `dark` class from
 * localStorage or OS preference — prevents a flash of the wrong theme.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  // Locale comes from a cookie (set by LanguageSwitcher), so the correct
  // lang/dir/font are applied server-side before first paint.
  const locale = await getLocale();
  const meta = getMeta(locale);

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${
          locale === "en" ? inter.className : vazirmatn.className
        } antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100`}
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
