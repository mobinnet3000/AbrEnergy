import type { Metadata } from "next";
import "./globals.css";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export const metadata: Metadata = {
  // Phase 5.2: env-driven base so relative OpenGraph image URLs resolve to
  // absolute ones. No production domain is hardcoded (localhost fallback).
  metadataBase: new URL(siteUrl()),
  title: "AbrEnergy | Professional Solar Energy Solutions",
  description: "AbrEnergy provides professional solar energy solutions including design, engineering, EPC services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var locale = localStorage.getItem('locale') || 'fa';
                var dirs = { fa: 'rtl', ar: 'rtl', en: 'ltr' };
                document.documentElement.lang = locale;
                document.documentElement.dir = dirs[locale] || 'rtl';
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
