import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "پلتفرم یادگیری خانواده حوزوی",
  description: "سیستم مدیریت یادگیری برای مراکز حوزوی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Vazirmatn] antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}