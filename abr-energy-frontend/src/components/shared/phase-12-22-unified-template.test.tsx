import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InternalPageHeader } from './internal-page-header';
import AboutPage from '@/app/[locale]/(public)/about/page';
import ContactPage from '@/app/[locale]/(public)/contact/page';
import CalculatorPage from '@/app/[locale]/(public)/calculator/page';
import faLocale from '../../../locales/fa.json';

function getNestedTranslation(obj: unknown, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => getNestedTranslation(faLocale, key),
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        about_us: 'ابر انرژی یک شرکت پیشرو در زمینه انرژی خورشیدی است.',
        phone_number: '021-88887777',
        email: 'info@abarenergy.ir',
        address: 'تهران، خیابان آزادی',
      },
    }),
    post: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({
      data: {
        about_us: 'ابر انرژی یک شرکت پیشرو در زمینه انرژی خورشیدی است.',
        phone_number: '021-88887777',
        email: 'info@abarenergy.ir',
        address: 'تهران، خیابان آزادی',
      },
      isLoading: false,
    }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa',
}));

describe('Phase 12.22 — Unified Internal Public Template Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('InternalPageHeader supports contain prop to wrap inside container-page', () => {
    const { container: uncontained } = render(
      <InternalPageHeader title="تست عنوان ساده" />
    );
    expect(uncontained.querySelector('.container-page')).toBeNull();

    const { container: contained } = render(
      <InternalPageHeader title="تست عنوان کانتینردار" contain />
    );
    const containerDiv = contained.querySelector('.container-page.relative.z-10');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv?.querySelector('h1')).toHaveTextContent('تست عنوان کانتینردار');
  });

  it('AboutPage adheres to the canonical shell, container-page header, and single H1', () => {
    const { container } = render(<AboutPage />);

    expect(container.querySelector('.internal-page-shell')).toBeInTheDocument();
    const headerContainer = container.querySelector('section.relative.overflow-hidden .container-page.relative.z-10');
    expect(headerContainer).toBeInTheDocument();

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent('مهندسی گذار انرژی');

    const breadcrumbs = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(breadcrumbs).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'بازگشت به خانه' })).toHaveAttribute('href', '/');
    expect(screen.getByText('درباره ما', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
  });

  it('ContactPage adheres to the canonical shell, container-page header, and single H1', () => {
    const { container } = render(<ContactPage />);

    expect(container.querySelector('.internal-page-shell')).toBeInTheDocument();
    const headerContainer = container.querySelector('section.relative.overflow-hidden .container-page.relative.z-10');
    expect(headerContainer).toBeInTheDocument();

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent('تماس با ما');

    const breadcrumbs = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(breadcrumbs).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'بازگشت به خانه' })).toHaveAttribute('href', '/');
    expect(screen.getByText('تماس با ما', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
  });

  it('CalculatorPage adheres to the canonical shell, container-page header, and single H1', () => {
    const { container } = render(<CalculatorPage />);

    expect(container.querySelector('.internal-page-shell')).toBeInTheDocument();
    const headerContainer = container.querySelector('section.relative.overflow-hidden .container-page.relative.z-10');
    expect(headerContainer).toBeInTheDocument();

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent('محاسبه‌گر نیروگاه خورشیدی آفگرید');

    const breadcrumbs = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(breadcrumbs).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'بازگشت به خانه' })).toHaveAttribute('href', '/');
    expect(screen.getByText('محاسبه‌گر نیروگاه خورشیدی آفگرید', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
  });
});
