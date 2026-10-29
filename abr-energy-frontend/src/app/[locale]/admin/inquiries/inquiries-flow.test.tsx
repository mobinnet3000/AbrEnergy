import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminInquiriesPage from './page';
import InquiryDetailPage from './[id]/page';
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

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'inq-1', locale: 'fa' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa/admin/inquiries',
}));

const MOCK_INQUIRIES = [
  {
    id: 'inq-1',
    name: 'شرکت پترو صنعت',
    phone: '02188776655',
    email: 'info@petro.com',
    city: 'عسلویه',
    project_type: 'on_grid',
    estimated_capacity: '250.00',
    message: 'استعلام احداث نیروگاه متصل به شبکه ۲۵۰ کیلووات',
    status: 'new',
    admin_note: '',
    created_at: '2026-10-24T09:00:00Z',
  },
  {
    id: 'inq-2',
    name: 'باغ ویلای دماوند',
    phone: '09129998877',
    email: '',
    city: 'دماوند',
    project_type: 'off_grid',
    estimated_capacity: '15.00',
    message: 'نیاز به سیستم برق خورشیدی منفصل از شبکه به همراه باتری',
    status: 'quoted',
    admin_note: 'پیش‌فاکتور ارسال گردید',
    created_at: '2026-10-25T14:30:00Z',
  },
];

const updateInquiryMock = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useAdminInquiries: (params?: Record<string, string>) => {
    let results = MOCK_INQUIRIES;
    if (params?.status && params.status !== 'all') {
      results = results.filter((i) => i.status === params.status);
    }
    if (params?.project_type && params.project_type !== 'all') {
      results = results.filter((i) => i.project_type === params.project_type);
    }
    if (params?.search) {
      results = results.filter((i) => i.name.includes(params.search) || i.city.includes(params.search));
    }
    return {
      data: { count: results.length, results },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useAdminInquiry: (id: string) => {
    const inq = MOCK_INQUIRIES.find((i) => i.id === id);
    return {
      data: inq,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useUpdateAdminInquiry: () => ({
    mutate: updateInquiryMock,
    isPending: false,
  }),
}));

describe('Admin Inquiries Flow (Phase 12.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project inquiries with truthful capacity, Persian project type, and status badges', () => {
    render(<AdminInquiriesPage />);

    expect(screen.getAllByText('استعلام پروژه').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('شرکت پترو صنعت')).toBeInTheDocument();
    expect(screen.getByText('باغ ویلای دماوند')).toBeInTheDocument();
    expect(screen.getByText('عسلویه')).toBeInTheDocument();
    expect(screen.getByText('دماوند')).toBeInTheDocument();
    expect(screen.getByText('متصل به شبکه')).toBeInTheDocument();
    expect(screen.getByText('منفصل از شبکه')).toBeInTheDocument();
    expect(screen.getByText('250.00 kW')).toBeInTheDocument();
    expect(screen.getByText('15.00 kW')).toBeInTheDocument();
  });

  it('filters inquiries by search query', () => {
    render(<AdminInquiriesPage />);

    const searchInput = screen.getByPlaceholderText('جستجو...');
    fireEvent.change(searchInput, { target: { value: 'پترو' } });

    expect(screen.getByText('شرکت پترو صنعت')).toBeInTheDocument();
  });

  it('renders inquiry detail view with customer message and admin notes editor', async () => {
    render(<InquiryDetailPage />);

    expect(await screen.findByText('شرکت پترو صنعت')).toBeInTheDocument();
    expect(screen.getByText('عسلویه')).toBeInTheDocument();
    expect(screen.getByText('250.00 kW')).toBeInTheDocument();
    expect(screen.getByText('استعلام احداث نیروگاه متصل به شبکه ۲۵۰ کیلووات')).toBeInTheDocument();

    const noteTextarea = screen.getByPlaceholderText('یادداشت داخلی مدیریت');
    fireEvent.change(noteTextarea, { target: { value: 'با مدیر فنی هماهنگ شد' } });

    const saveButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    fireEvent.click(saveButton);

    expect(updateInquiryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'inq-1',
        data: expect.objectContaining({
          admin_note: 'با مدیر فنی هماهنگ شد',
        }),
      }),
      expect.any(Object)
    );
  });
});
