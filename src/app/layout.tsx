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
      {/* الخطوط العربية تُحمَّل مرة واحدة من globals.css (Cairo + Tajawal)،
          فلا نكرّرها هنا بـ <link> كما كان يحدث سابقًا. */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
