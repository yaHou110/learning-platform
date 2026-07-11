import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "پلتفرم یادگیری خانواده حوزوی",
  description: "Hawza Family Learning Platform — AI-native LMS for Islamic seminary families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
