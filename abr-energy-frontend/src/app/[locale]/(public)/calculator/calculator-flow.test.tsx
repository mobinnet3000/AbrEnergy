import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalculatorPage from './page';
import axiosInstance from '@/api/axios';
import faLocale from '../../../../../locales/fa.json';

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
    post: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa/calculator',
}));

describe('Phase 12.22 — Off-Grid Solar Calculator Flow & Canonical Template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calculator page within InternalPageShell and canonical container-page header', () => {
    const { container } = render(<CalculatorPage />);

    // Shell check
    const shell = container.querySelector('.internal-page-shell');
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveClass('site-header-offset');

    // Canonical header section with container-page alignment
    const headerSection = container.querySelector('section.relative.overflow-hidden');
    expect(headerSection).toBeInTheDocument();
    const headerContainer = headerSection?.querySelector('.container-page.relative.z-10');
    expect(headerContainer).toBeInTheDocument();

    // Single H1 with font-heading
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('محاسبه‌گر نیروگاه خورشیدی آفگرید');
    expect(h1).toHaveClass('font-heading');

    // BreadcrumbTrail check
    const breadcrumbNav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'بازگشت به خانه' })).toHaveAttribute('href', '/');
    const leafCrumb = screen.getByText('محاسبه‌گر نیروگاه خورشیدی آفگرید', { selector: 'span[aria-current="page"]' });
    expect(leafCrumb).toBeInTheDocument();
  });

  it('displays input parameter fields and calculates system sizing upon submission', async () => {
    const mockCalcResult = {
      panel_capacity: 5.5,
      panel_count: 10,
      battery_capacity: 400.0,
      inverter_power: 5.0,
      estimated_cost: 250000000,
      roi_years: 4.2,
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: mockCalcResult },
    });

    render(<CalculatorPage />);

    expect(screen.getByText('پارامترهای ورودی')).toBeInTheDocument();
    expect(screen.getByText('مصرف روزانه (کیلووات ساعت)')).toBeInTheDocument();
    expect(screen.getByText('تابش خورشیدی (کیلووات ساعت/متر مربع/روز)')).toBeInTheDocument();

    const calculateButton = screen.getByRole('button', { name: /محاسبه/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/calculator/off-grid/',
        expect.objectContaining({
          daily_consumption: 30,
          city: 'Tehran',
          irradiation: 5,
          battery_type: 'lithium',
          system_type: 'off_grid',
        })
      );
    });

    // Results rendered
    expect(await screen.findByText('نتایج سیستم خورشیدی')).toBeInTheDocument();
    expect(screen.getByText('تعداد پنل‌های مورد نیاز')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('ظرفیت پنل (کیلووات)')).toBeInTheDocument();
    expect(screen.getByText('5.5')).toBeInTheDocument();
    expect(screen.getByText('400.0')).toBeInTheDocument();
    expect(screen.getByText('درخواست مشاوره')).toBeInTheDocument();
  });

  it('renders placeholder hint before any calculation is executed', () => {
    render(<CalculatorPage />);
    expect(screen.getByText('پارامترها را وارد کنید')).toBeInTheDocument();
  });
});
