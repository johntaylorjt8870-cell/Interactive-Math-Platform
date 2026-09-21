import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة الرياضيات — الصف الثامن",
  description: "منصة تعليمية تفاعلية لمنهاج الرياضيات للصف الثامن الإعدادي في سوريا — الجبر والهندسة",
  keywords: "رياضيات, صف ثامن, سوريا, جبر, هندسة, تعليم تفاعلي",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
