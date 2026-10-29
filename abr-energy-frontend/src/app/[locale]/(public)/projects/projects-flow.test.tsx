import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectsPage from './page';
import ProjectDetailPage from './[slug]/page';
import type { Project, ProjectDetail } from '@/types';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-1',
    title: 'نیروگاه خورشیدی ۵ مگاوات اصفهان',
    slug: 'isfahan-5mw',
    project_type: 'on_grid',
    status: 'completed',
    capacity: 5000,
    location: 'اصفهان، شهرک صنعتی مورچه‌خورت',
    cover_image: 'http://localhost:8000/media/projects/isfahan.jpg',
    is_featured: true,
    completion_percentage: 100,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p-2',
    title: 'سیستم هیبرید خورشیدی معدن چادرملو',
    slug: 'chadormalu-hybrid',
    project_type: 'hybrid',
    status: 'in_progress',
    capacity: 1200,
    location: 'یزد',
    cover_image: '',
    is_featured: false,
    completion_percentage: 60,
    created_at: '2026-03-01T00:00:00Z',
  },
];

let mockQueryData: ProjectDetail | null = null;
let mockIsLoading = false;
let mockIsError = false;
let mockError: unknown = null;
let mockSlug: string | undefined = 'isfahan-5mw';

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'project') {
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
  useProjects: () => ({
    data: MOCK_PROJECTS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: mockSlug }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => `/fa/projects/${mockSlug || ''}`,
}));

vi.mock('@/components/home/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'projects.title': 'پروژه‌ها',
        'home.projects_title': 'پروژه‌ها',
        'projects.subtitle': 'نمونه‌ای از پروژه‌های شاخص اجراشده توسط ابر انرژی',
        'projects.project_not_found': 'پروژه مورد نظر یافت نشد',
        'projects.project_gone_hint': 'ممکن است این پروژه حذف شده یا آدرس آن تغییر کرده باشد.',
        'projects.back_to_projects': 'بازگشت به لیست پروژه‌ها',
        'common.back_home': 'صفحه اصلی',
        'projects.capacity': 'ظرفیت',
        'projects.location': 'محل اجرا',
        'projects.client': 'کارفرما',
        'projects.date': 'تاریخ اجرا',
        'projects.status': 'وضعیت پروژه',
        'projects.type': 'نوع پروژه',
        'projects.technical_details': 'جزییات فنی و مهندسی',
        'projects.metrics': 'شاخص‌های پروژه',
        'projects.gallery_label': 'گالری تصاویر پروژه',
        'projects.photos': 'تصاویر پروژه',
        'projects.cta_title': 'به اجرای پروژه مشابه می‌اندیشید؟',
        'projects.cta_desc': 'مشاوران ما آماده ارائه امکان‌سنجی اولیه و برآورد ظرفیت پروژه شما هستند.',
        'projects.cta_action': 'درخواست مشاوره',
        'common.error': 'خطایی رخ داد',
        'common.rate_limit_title': 'محدودیت درخواست',
        'common.rate_limit_hint': 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
        'admin.failed_load_projects': 'بارگیری پروژه‌ها ناموفق بود',
        'products.retry': 'تلاش مجدد',
      };
      return dict[key] || key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

describe('Phase 12.20 — Projects Flow', () => {
  beforeEach(() => {
    mockQueryData = null;
    mockIsLoading = false;
    mockIsError = false;
    mockError = null;
    mockSlug = 'isfahan-5mw';
  });

  it('renders projects listing with localized status, type badges, and real metrics', () => {
    render(<ProjectsPage />);

    expect(screen.getByText('نیروگاه خورشیدی ۵ مگاوات اصفهان')).toBeInTheDocument();
    expect(screen.getByText('سیستم هیبرید خورشیدی معدن چادرملو')).toBeInTheDocument();

    // Check localized type badges
    expect(screen.getByText('متصل به شبکه')).toBeInTheDocument();
    expect(screen.getByText('هیبرید')).toBeInTheDocument();

    // Check localized status badges
    expect(screen.getByText('تکمیل شده')).toBeInTheDocument();
    expect(screen.getByText('در حال اجرا')).toBeInTheDocument();

    // Check capacity metric
    expect(screen.getByText(/5000\s*kW/)).toBeInTheDocument();

    // Check detail links
    const links = screen.getAllByRole('link');
    const isfahanLink = links.find((l) => l.getAttribute('href') === '/projects/isfahan-5mw');
    expect(isfahanLink).toBeDefined();
  });

  it('renders project detail page with breadcrumbs and real metrics only', () => {
    mockQueryData = {
      id: 'p-1',
      title: 'نیروگاه خورشیدی ۵ مگاوات اصفهان',
      slug: 'isfahan-5mw',
      description: '<p>شرح مهندسی اجرای این پروژه عظیم</p>',
      project_type: 'on_grid',
      status: 'completed',
      capacity: 5000,
      location: 'اصفهان',
      images: [
        { id: 'img-1', image_url: 'http://localhost:8000/media/projects/cover.jpg', alt_text: 'کاور', is_cover: true, order: 0 },
        { id: 'img-2', image_url: 'http://localhost:8000/media/projects/gallery1.jpg', alt_text: 'پنل‌ها', is_cover: false, order: 1 },
      ],
    } as ProjectDetail;

    render(<ProjectDetailPage />);

    // Breadcrumbs check
    expect(screen.getByText('صفحه اصلی')).toBeInTheDocument();
    expect(screen.getAllByText('پروژه‌ها').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('نیروگاه خورشیدی ۵ مگاوات اصفهان').length).toBeGreaterThanOrEqual(1);

    // Metrics check
    expect(screen.getAllByText(/5000\s*kW/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('اصفهان').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/شرح مهندسی اجرای این پروژه عظیم/)).toBeInTheDocument();

    // Gallery photo check
    expect(screen.getByAltText('پنل‌ها')).toBeInTheDocument();
  });

  it('renders honest NotFoundState when project returns 404', () => {
    mockIsError = true;
    mockError = { response: { status: 404 } };
    mockQueryData = null;

    render(<ProjectDetailPage />);

    expect(screen.getByText('پروژه مورد نظر یافت نشد')).toBeInTheDocument();
    expect(screen.getByText('بازگشت به لیست پروژه‌ها')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) when project fetch is throttled with 429', () => {
    mockIsError = true;
    mockError = { response: { status: 429 } };
    mockQueryData = null;

    render(<ProjectDetailPage />);

    expect(screen.queryByText('پروژه مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('محدودیت درخواست')).toBeInTheDocument();
    expect(screen.getByText('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) on server error 500', () => {
    mockIsError = true;
    mockError = { response: { status: 500 } };
    mockQueryData = null;

    render(<ProjectDetailPage />);

    expect(screen.queryByText('پروژه مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('خطایی رخ داد')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders NotFoundState when slug is invalid', () => {
    mockSlug = '';

    render(<ProjectDetailPage />);

    expect(screen.getByText('پروژه مورد نظر یافت نشد')).toBeInTheDocument();
  });
});
