import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { navigationConfig } from '@/config/navigation';
import { DesktopNav } from '@/components/layout/header-nav';
import { Footer } from '@/components/layout/footer';
import { CalculatorSection } from '@/components/home/CalculatorSection';
import { HomepageShowcase } from '@/components/home/HomepageShowcase';
import { ContactSection } from '@/components/home/ContactSection';

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let cur: unknown = fa;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return key;
        }
      }
      return typeof cur === 'string' ? cur : key;
    },
    locale: 'fa' as const,
    setLocale: () => {},
    dir: 'rtl' as const,
    isRTL: true,
  }),
  localeNames: { fa: 'FA', ar: 'AR', en: 'EN' },
  activeLocales: ['fa', 'ar', 'en'],
}));

const { CATEGORIES } = vi.hoisted(() => {
  const family = (id: string, title: string, children: { id: string; title: string }[] = []) => ({
    id,
    title,
    slug: id,
    parent: null,
    sort_order: 0,
    is_active: true,
    is_featured: false,
    children: children.map((c, i) => ({
      id: c.id,
      title: c.title,
      slug: c.id,
      parent: id,
      sort_order: i,
      is_active: true,
      is_featured: false,
    })),
  });
  return {
    CATEGORIES: [
      family('parent-solar', 'پکیج‌های خورشیدی', [
        { id: 'child-apartment', title: 'آپارتمان' },
        { id: 'child-villa', title: 'ویلا' },
      ]),
      family('parent-emergency', 'پکیج‌های برق اضطراری', [{ id: 'child-apartment-2', title: 'آپارتمان' }]),
      family('parent-structure', 'سازه خورشیدی', [{ id: 'child-flat', title: 'سقف مسطح' }]),
      family('parent-support', 'ساپورت مدولار تأسیساتی', [{ id: 'child-clamp', title: 'بست لوله' }]),
    ],
  };
});

vi.mock('@/hooks/use-api', () => ({
  useSiteSettings: () => ({ data: null }),
  usePublicProductCategories: () => ({ data: CATEGORIES }),
  useServices: () => ({ data: [] }),
  useProjects: () => ({ data: [] }),
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/fa' }));

function product() {
  return {
    id: 'p-1',
    title: 'پکیج خورشیدی',
    slug: 'pkg',
    short_description: 'توضیح',
    sku: 'SKU-1',
    category: 'parent-solar',
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: true,
    sort_order: 0,
    price: { state: 'contact_for_price', currency: 'IRR' },
    created_at: '',
    updated_at: '',
    published_at: null,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('Phase 12.10 — navigation hierarchy', () => {
  it('1. config exposes the employer menu with nested children', () => {
    expect(navigationConfig.map((n) => n.href)).toEqual([
      '/', '/products', '/services', '/projects', '/articles', '/gallery', '/downloads', '/calculator', '/contact',
    ]);
    expect(navigationConfig.find((n) => n.href === '/products')?.source).toBe('product-categories');
    expect(navigationConfig.find((n) => n.href === '/services')?.children).toHaveLength(7);
    expect(navigationConfig.find((n) => n.href === '/projects')?.children).toHaveLength(4);
    expect(navigationConfig.find((n) => n.href === '/downloads')?.children).toHaveLength(2);
  });

  it('2. product parent toggles its submenu from the live category API', () => {
    render(<DesktopNav isActive={() => false} />);
    const opener = screen.getAllByLabelText(fa.common.open_menu)[0];
    expect(opener.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(opener);
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('پکیج‌های خورشیدی')).toBeTruthy();
    expect(screen.getAllByText('آپارتمان').length).toBeGreaterThan(0);
    expect(screen.getByText('بست لوله')).toBeTruthy();
  });

  it('3. Escape closes an open submenu', () => {
    render(<DesktopNav isActive={() => false} />);
    const opener = screen.getAllByLabelText(fa.common.open_menu)[0];
    fireEvent.click(opener);
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(opener.parentElement as HTMLElement, { key: 'Escape' });
    expect(opener.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Phase 12.10 — light/dark theme integrity', () => {
  it('4. footer is light in light theme and dark in dark theme', () => {
    render(<Footer />);
    const footer = screen.getByTestId('site-footer');
    expect(footer.className).toContain('bg-neutral-100');
    expect(footer.className).toContain('dark:bg-black');
    expect(footer.className).not.toContain('bg-neutral-950');
  });

  it('5. calculator section adapts: light surface + dark override', () => {
    render(<CalculatorSection />);
    const el = screen.getByTestId('calculator-teaser');
    expect(el.className).toContain('dark:from-emerald-950');
    expect(el.className).toContain('from-emerald-50');
  });

  it('6. hero floating visual card carries a dark-theme surface', () => {
    render(
      <HomepageShowcase
        products={[product() as never]}
        visuals={[{ id: 'v-1', image_url: 'http://localhost:8000/media/v.png', alt: '', order: 0, enabled: true, link_url: '' } as never]}
      />,
    );
    const floating = screen.getByTestId('hero-floating-visual');
    const card = floating.querySelector('div');
    expect(card?.className).toContain('dark:bg-neutral-900');
  });

  it('7. contact CTA card has a dark surface in dark theme (no white leak)', () => {
    render(<ContactSection />);
    const panel = screen.getByTestId('contact-panel');
    const card = panel.querySelector('.rounded-3xl');
    expect(card?.className).toContain('bg-white');
    expect(card?.className).toContain('dark:bg-neutral-900');
  });
});
