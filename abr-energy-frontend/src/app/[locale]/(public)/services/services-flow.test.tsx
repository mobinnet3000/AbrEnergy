import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServicesPage from './page';
import ServiceDetailPage from './[slug]/page';
import type { Service } from '@/types';

const MOCK_SERVICES = [
  {
    id: 's-1',
    title: 'نیروگاه خورشیدی منفصل از شبکه',
    slug: 'off-grid-solar',
    short_description: 'طراحی و اجرای سیستم‌های مستقل خورشیدی با باتری',
    status: 'active',
    features: ['طراحی اختصاصی', 'باتری لیتیومی', 'پایش هوشمند'],
  },
  {
    id: 's-2',
    title: 'نیروگاه خورشیدی متصل به شبکه',
    slug: 'on-grid-solar',
    short_description: 'تزریق برق به شبکه سراسری با درآمد تضمینی',
    status: 'active',
    features: ['اینورترهای راندمان بالا', 'قرارداد ۲۰ ساله ساتبا'],
  },
  {
    id: 's-3',
    title: 'خدمت غیرفعال نمونه',
    slug: 'inactive-service',
    short_description: 'این خدمت نباید نمایش داده شود',
    status: 'inactive',
  },
];

let mockQueryData: Service | null = null;
let mockIsLoading = false;
let mockIsError = false;
let mockError: unknown = null;
let mockSlug: string | undefined = 'off-grid-solar';

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'service') {
      return {
        data: mockQueryData,
        isLoading: mockIsLoading,
        isError: mockIsError,
        error: mockError,
        refetch: vi.fn(),
      };
    }
    return { data: undefined, isLoading: false, isError: false };
  },
}));

vi.mock('@/hooks/use-api', () => ({
  useServices: () => ({
    data: MOCK_SERVICES,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: mockSlug }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => `/fa/services/${mockSlug || ''}`,
}));

vi.mock('@/components/home/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'services.title': 'خدمات ما',
        'home.services_title': 'خدمات ما',
        'services.subtitle': 'ارائه راهکارهای جامع و مهندسی در حوزه انرژی خورشیدی',
        'services.details': 'مشاهده جزییات خدمت',
        'services.service_not_found': 'خدمت مورد نظر یافت نشد',
        'services.service_gone_hint': 'ممکن است این خدمت حذف شده یا آدرس آن تغییر کرده باشد.',
        'services.back_to_services': 'بازگشت به لیست خدمات',
        'common.back_home': 'صفحه اصلی',
        'services.step_consultation': 'مشاوره و ارزیابی',
        'services.step_consultation_desc': 'بررسی تخصصی نیازها و تحلیل فنی سایت پروژه',
        'services.step_design': 'طراحی مهندسی',
        'services.step_design_desc': 'مدل‌سازی سه‌بعدی و شبیه‌سازی دقیق تولید انرژی',
        'services.step_implementation': 'اجرا و راه‌اندازی',
        'services.step_implementation_desc': 'نصب تجهیزات بر اساس استانداردهای بین‌المللی',
        'services.step_optimization': 'بهینه‌سازی و پایش',
        'services.step_optimization_desc': 'پایش مستمر عملکرد و نگهداری دوره‌ای',
        'services.features_title': 'ویژگی‌های کلیدی',
        'services.process_title': 'مراحل انجام پروژه',
        'services.tech_title': 'مزایای فنی و اقتصادی',
        'services.cta_title': 'آماده آغاز پروژه خورشیدی خود هستید؟',
        'services.cta_desc': 'برای دریافت مشاوره تخصصی و برآورد فنی با مهندسان ما تماس بگیرید.',
        'common.contact_us': 'تماس با ما',
        'common.error': 'خطایی رخ داد',
        'common.rate_limit_title': 'محدودیت درخواست',
        'common.rate_limit_hint': 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
        'admin.failed_load_services': 'بارگیری خدمات ناموفق بود',
        'products.retry': 'تلاش مجدد',
      };
      return dict[key] || key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

describe('Phase 12.20 — Services Flow', () => {
  beforeEach(() => {
    mockQueryData = null;
    mockIsLoading = false;
    mockIsError = false;
    mockError = null;
    mockSlug = 'off-grid-solar';
  });

  it('renders services listing with published active services only', () => {
    render(<ServicesPage />);

    expect(screen.getByText('نیروگاه خورشیدی منفصل از شبکه')).toBeInTheDocument();
    expect(screen.getByText('نیروگاه خورشیدی متصل به شبکه')).toBeInTheDocument();
    expect(screen.queryByText('خدمت غیرفعال نمونه')).not.toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const offGridLink = links.find((l) => l.getAttribute('href') === '/services/off-grid-solar');
    expect(offGridLink).toBeDefined();
  });

  it('renders service detail page with breadcrumbs, features, and rich text', () => {
    mockQueryData = {
      id: 's-1',
      title: 'نیروگاه خورشیدی منفصل از شبکه',
      slug: 'off-grid-solar',
      short_description: 'توضیحات کوتاه',
      description: '<p>توضیحات کامل و <strong>جامع</strong> پروژه خورشیدی</p>',
      features: ['طراحی اختصاصی', 'باتری لیتیومی'],
      status: 'active',
    } as Service;

    render(<ServiceDetailPage />);

    // Breadcrumbs check
    expect(screen.getByText('صفحه اصلی')).toBeInTheDocument();
    expect(screen.getByText('خدمات ما')).toBeInTheDocument();
    expect(screen.getAllByText('نیروگاه خورشیدی منفصل از شبکه').length).toBeGreaterThanOrEqual(1);

    // Content check
    expect(screen.getByText('طراحی اختصاصی')).toBeInTheDocument();
    expect(screen.getByText('باتری لیتیومی')).toBeInTheDocument();
    expect(screen.getByText(/توضیحات کامل و/)).toBeInTheDocument();
  });

  it('renders honest NotFoundState when service returns 404', () => {
    mockIsError = true;
    mockError = { response: { status: 404 } };
    mockQueryData = null;

    render(<ServiceDetailPage />);

    expect(screen.getByText('خدمت مورد نظر یافت نشد')).toBeInTheDocument();
    expect(screen.getByText('بازگشت به لیست خدمات')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) when service fetch is throttled with 429', () => {
    mockIsError = true;
    mockError = { response: { status: 429 } };
    mockQueryData = null;

    render(<ServiceDetailPage />);

    expect(screen.queryByText('خدمت مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('محدودیت درخواست')).toBeInTheDocument();
    expect(screen.getByText('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) on server error 500', () => {
    mockIsError = true;
    mockError = { response: { status: 500 } };
    mockQueryData = null;

    render(<ServiceDetailPage />);

    expect(screen.queryByText('خدمت مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('خطایی رخ داد')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders NotFoundState when slug is invalid', () => {
    mockSlug = '';

    render(<ServiceDetailPage />);

    expect(screen.getByText('خدمت مورد نظر یافت نشد')).toBeInTheDocument();
  });
});
