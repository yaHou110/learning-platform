import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "@/app/globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "پلتفرم یادگیری خانواده حوزوی",
  description: "سامانه یادگیری چندمرکزی، خودمیزبان، اوپن‌سورس برای خانواده‌های حوزوی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={`${vazirmatn.className} antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
