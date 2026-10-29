import type { Metadata } from "next";
import "./globals.css";
import { buildIconsMetadata, fetchSiteConfig } from '@/lib/site-metadata';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

// Phase 12.11 — metadata is generated so the admin-uploaded favicon (if any)
// is advertised to the browser. When no favicon is configured, no icons are
// emitted and the `src/app/favicon.ico` file convention stays the fallback.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteConfig();
  const icons = buildIconsMetadata(settings);
  return {
    // Phase 5.2: env-driven base so relative OpenGraph image URLs resolve to
    // absolute ones. No production domain is hardcoded (localhost fallback).
    metadataBase: new URL(siteUrl()),
    title: "AbarEnergy | Professional Solar Energy Solutions",
    description: "AbarEnergy provides professional solar energy solutions including design, engineering, EPC services.",
    ...(icons ? { icons } : {}),
  };
}

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
