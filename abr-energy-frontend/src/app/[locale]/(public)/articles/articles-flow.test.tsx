import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticlesPage from './page';
import ArticleDetailPage from './[slug]/page';
import type { Article } from '@/types';

const MOCK_ARTICLES = [
  {
    id: 'a-1',
    title: 'راهنمای جامع محاسبه نیروگاه خورشیدی',
    slug: 'solar-calculation-guide',
    short_description: 'نحوه محاسبه توان، تعداد پنل و اینورتر برای مصارف خانگی و صنعتی',
    content: '<p>متن کامل راهنمای جامع محاسبات خورشیدی</p>',
    category_title: 'آموزش و مقالات فنی',
    author_name: 'مهندس رضایی',
    publish_date: '2026-09-15',
    status: 'published',
  },
  {
    id: 'a-2',
    title: 'مقاله پیش‌نویس خصوصی',
    slug: 'draft-article',
    short_description: 'این مقاله نباید در بخش عمومی باشد',
    status: 'draft',
  },
];

let mockQueryData: Article | null = null;
let mockIsLoading = false;
let mockIsError = false;
let mockError: unknown = null;
let mockSlug: string | undefined = 'solar-calculation-guide';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useSpring: (v: unknown) => v,
    motion: {
      div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
      p: ({ children, ...props }: Record<string, unknown>) => <p {...props}>{children as React.ReactNode}</p>,
      h1: ({ children, ...props }: Record<string, unknown>) => <h1 {...props}>{children as React.ReactNode}</h1>,
      span: ({ children, ...props }: Record<string, unknown>) => <span {...props}>{children as React.ReactNode}</span>,
    },
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'article') {
      return {
        data: mockQueryData,
        isLoading: mockIsLoading,
        isError: mockIsError,
        error: mockError,
        refetch: vi.fn(),
      };
    }
    if (queryKey[0] === 'articles' && queryKey[1] === 'related') {
      return {
        data: { results: [] },
        isLoading: false,
        isError: false,
      };
    }
    return { data: undefined, isLoading: false, isError: false };
  },
}));

vi.mock('@/hooks/use-api', () => ({
  useArticles: () => ({
    data: MOCK_ARTICLES,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: mockSlug }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => `/fa/articles/${mockSlug || ''}`,
}));

vi.mock('@/components/home/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'articles.title': 'مقالات و آموزش‌ها',
        'articles.subtitle': 'تازه‌ترین دستاوردهای صنعت خورشیدی و مقالات مهندسی',
        'articles.article_not_found': 'مقاله مورد نظر یافت نشد',
        'articles.article_gone_hint': 'ممکن است این مقاله حذف شده یا هنوز منتشر نشده باشد.',
        'articles.back_to_articles': 'بازگشت به مقالات',
        'common.back_home': 'صفحه اصلی',
        'common.error': 'خطایی رخ داد',
        'common.rate_limit_title': 'محدودیت درخواست',
        'common.rate_limit_hint': 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
        'admin.failed_load_articles': 'بارگیری مقالات ناموفق بود',
        'products.retry': 'تلاش مجدد',
        'articles.table_of_contents': 'فهرست مطالب',
        'articles.share': 'اشتراک‌گذاری',
        'articles.related': 'مقالات مرتبط',
      };
      return dict[key] || key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

describe('Phase 12.20 — Articles Flow', () => {
  beforeEach(() => {
    mockQueryData = null;
    mockIsLoading = false;
    mockIsError = false;
    mockError = null;
    mockSlug = 'solar-calculation-guide';
  });

  it('renders articles listing with published articles and honest metadata', () => {
    render(<ArticlesPage />);

    expect(screen.getByText('راهنمای جامع محاسبه نیروگاه خورشیدی')).toBeInTheDocument();
    expect(screen.queryByText('مقاله پیش‌نویس خصوصی')).not.toBeInTheDocument();

    // Check author name
    expect(screen.getByText('مهندس رضایی')).toBeInTheDocument();

    // Check detail link
    const links = screen.getAllByRole('link');
    const guideLink = links.find((l) => l.getAttribute('href') === '/articles/solar-calculation-guide');
    expect(guideLink).toBeDefined();
  });

  it('renders article detail page with breadcrumbs, author, TOC, and rich text', () => {
    mockQueryData = {
      id: 'a-1',
      title: 'راهنمای جامع محاسبه نیروگاه خورشیدی',
      slug: 'solar-calculation-guide',
      short_description: 'توضیحات کوتاه',
      content: '<h2>مبانی محاسبات</h2><p>متن بخش مبانی محاسبات فنی</p><h2>انتخاب اینورتر</h2><p>روش انتخاب اینورتر مناسب</p>',
      author_name: 'مهندس رضایی',
      publish_date: '2026-09-15',
      category_title: 'آموزش فنی',
      status: 'published',
    } as Article;

    render(<ArticleDetailPage />);

    // Breadcrumbs check
    expect(screen.getByText('صفحه اصلی')).toBeInTheDocument();
    expect(screen.getAllByText('مقالات و آموزش‌ها').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('راهنمای جامع محاسبه نیروگاه خورشیدی').length).toBeGreaterThanOrEqual(1);

    // Author check
    expect(screen.getByText('مهندس رضایی')).toBeInTheDocument();

    // Table of contents check (extracted from h2)
    expect(screen.getByText('فهرست مطالب')).toBeInTheDocument();
    expect(screen.getAllByText('مبانی محاسبات').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('انتخاب اینورتر').length).toBeGreaterThanOrEqual(1);

    // Content check
    expect(screen.getByText(/متن بخش مبانی محاسبات فنی/)).toBeInTheDocument();
  });

  it('renders honest NotFoundState when article returns 404', () => {
    mockIsError = true;
    mockError = { response: { status: 404 } };
    mockQueryData = null;

    render(<ArticleDetailPage />);

    expect(screen.getByText('مقاله مورد نظر یافت نشد')).toBeInTheDocument();
    expect(screen.getByText('بازگشت به مقالات')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) when article fetch is throttled with 429', () => {
    mockIsError = true;
    mockError = { response: { status: 429 } };
    mockQueryData = null;

    render(<ArticleDetailPage />);

    expect(screen.queryByText('مقاله مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('محدودیت درخواست')).toBeInTheDocument();
    expect(screen.getByText('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders ErrorState (not 404) on server error 500', () => {
    mockIsError = true;
    mockError = { response: { status: 500 } };
    mockQueryData = null;

    render(<ArticleDetailPage />);

    expect(screen.queryByText('مقاله مورد نظر یافت نشد')).not.toBeInTheDocument();
    expect(screen.getByText('خطایی رخ داد')).toBeInTheDocument();
    expect(screen.getByText('تلاش مجدد')).toBeInTheDocument();
  });

  it('renders NotFoundState when slug is invalid', () => {
    mockSlug = '';

    render(<ArticleDetailPage />);

    expect(screen.getByText('مقاله مورد نظر یافت نشد')).toBeInTheDocument();
  });
});
