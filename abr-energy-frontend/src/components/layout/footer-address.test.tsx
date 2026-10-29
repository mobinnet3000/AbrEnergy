import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';
import { LocaleContext } from '@/i18n/locale-context';
import type { Locale } from '@/i18n/config';

vi.mock('@/hooks/use-api', () => ({
  useSiteSettings: () => ({
    data: {
      company_name: 'ابر انرژی',
      company_name_en: 'AbarEnergy',
      company_name_ar: 'أبر إنيرجي',
      email: 'info@abarenergy.ir',
      phone_number: '+98 21 8888 7777',
      address: 'تهران، خیابان آزادی، پلاک ۱۰۰',
      address_en: 'No. 100, Azadi St., Tehran, Iran',
      address_ar: 'طهران، شارع الحرية، رقم ۱۰۰',
      city: 'تهران',
      city_en: 'Tehran',
      city_ar: 'طهران',
      province: 'تهران',
      province_en: 'Tehran',
      province_ar: 'طهران',
      postal_code: '14588-99999',
      map_url: 'https://maps.google.com/?q=35.6892,51.3890',
      footer_text: 'پیشرو در ارائه راهکارهای نیروگاه خورشیدی',
    },
  }),
}));

vi.mock('@/components/layout/brand-logo', () => ({
  BrandLogo: () => <div data-testid="brand-logo">AbarEnergy Logo</div>,
}));

vi.mock('@/components/home/ScrollReveal', () => ({
  ScrollReveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

function renderFooterWithLocale(locale: Locale = 'fa') {
  return render(
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: vi.fn(),
        t: (k: string) => k,
        dir: locale === 'en' ? 'ltr' : 'rtl',
        isRTL: locale !== 'en',
      }}
    >
      <Footer />
    </LocaleContext.Provider>
  );
}

describe('Footer Structured Address & Contact Card (Phase 12.29)', () => {
  it('renders Persian address, postal code, and map link in FA locale', () => {
    renderFooterWithLocale('fa');
    expect(screen.getByTestId('footer-address-card')).toBeInTheDocument();
    expect(screen.getByText('تهران، خیابان آزادی، پلاک ۱۰۰')).toBeInTheDocument();
    expect(screen.getByText('14588-99999')).toBeInTheDocument();
    const mapLink = screen.getByTestId('footer-map-link');
    expect(mapLink).toHaveAttribute('href', 'https://maps.google.com/?q=35.6892,51.3890');
    expect(mapLink).toHaveAttribute('target', '_blank');
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders English address and labels in EN locale', () => {
    renderFooterWithLocale('en');
    expect(screen.getByText('No. 100, Azadi St., Tehran, Iran')).toBeInTheDocument();
    expect(screen.getByText(/Postal Code:/)).toBeInTheDocument();
    expect(screen.getByText('View on map')).toBeInTheDocument();
  });

  it('renders Arabic address and labels in AR locale', () => {
    renderFooterWithLocale('ar');
    expect(screen.getByText('طهران، شارع الحرية، رقم ۱۰۰')).toBeInTheDocument();
    expect(screen.getByText(/الرمز البريدي:/)).toBeInTheDocument();
    expect(screen.getByText('عرض على الخريطة')).toBeInTheDocument();
  });
});
