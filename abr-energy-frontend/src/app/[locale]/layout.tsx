import { Providers } from "@/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LocaleProvider } from "@/i18n";
import type { Locale } from "@/i18n";
import { ScrollProgress } from "@/components/home";
import { PageTransition } from "@/components/shared/page-transition";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = 'fa' } = await params;

  return (
    <Providers>
      <LocaleProvider locale={locale as Locale}>
        <ScrollProgress />
        <Header />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </LocaleProvider>
    </Providers>
  );
}
