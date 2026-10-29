import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({
    locale,
    path: '/calculator',
    titleKey: 'nav.calculator_offgrid',
    descriptionKey: 'calculator.subtitle',
  });
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
