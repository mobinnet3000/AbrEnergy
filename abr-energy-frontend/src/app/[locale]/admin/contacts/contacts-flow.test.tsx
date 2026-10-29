import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminContactsPage from './page';
import ContactDetailPage from './[id]/page';
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
  useParams: () => ({ id: 'c-1', locale: 'fa' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa/admin/contacts',
}));

const MOCK_CONTACTS = [
  {
    id: 'c-1',
    full_name: 'رضا کمالی',
    email: 'reza@kamali.ir',
    phone: '09121112233',
    subject: 'مشاوره خرید پنل',
    message: 'سلام، نیاز به مشاوره برای خرید پنل خورشیدی ۵۵۰ وات دارم.',
    request_type: 'consultation',
    status: 'pending',
    admin_note: '',
    created_at: '2026-10-25T10:00:00Z',
  },
  {
    id: 'c-2',
    full_name: 'سارا حسینی',
    email: 'sara@test.com',
    phone: '09132223344',
    subject: 'طراحی نیروگاه سوله',
    message: 'درخواست طراحی سیستم خورشیدی ۱۰۰ کیلوواتی سوله صنعتی.',
    request_type: 'design_request',
    status: 'in_review',
    admin_note: 'پیش‌طرح توسط مهندسی تهیه شد.',
    created_at: '2026-10-26T12:00:00Z',
  },
];

const updateContactMock = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useAdminContacts: (params?: Record<string, string>) => {
    let results = MOCK_CONTACTS;
    if (params?.status && params.status !== 'all') {
      results = results.filter((c) => c.status === params.status);
    }
    if (params?.request_type && params.request_type !== 'all') {
      results = results.filter((c) => c.request_type === params.request_type);
    }
    if (params?.search) {
      results = results.filter((c) => c.full_name.includes(params.search) || c.email.includes(params.search));
    }
    return {
      data: { count: results.length, results },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useAdminContact: (id: string) => {
    const contact = MOCK_CONTACTS.find((c) => c.id === id);
    return {
      data: contact,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useUpdateAdminContact: () => ({
    mutate: updateContactMock,
    isPending: false,
  }),
}));

describe('Admin Contacts Flow (Phase 12.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contacts list with Persian request-type and status badges', () => {
    render(<AdminContactsPage />);

    expect(screen.getAllByText('درخواست‌های تماس').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('رضا کمالی')).toBeInTheDocument();
    expect(screen.getByText('سارا حسینی')).toBeInTheDocument();
    expect(screen.getByText('درخواست مشاوره')).toBeInTheDocument();
    expect(screen.getByText('درخواست طراحی')).toBeInTheDocument();
    expect(screen.getByText('در انتظار بررسی')).toBeInTheDocument();
    expect(screen.getByText('در حال بررسی')).toBeInTheDocument();
  });

  it('filters contacts by search term', () => {
    render(<AdminContactsPage />);

    const searchInput = screen.getByPlaceholderText('جستجو...');
    fireEvent.change(searchInput, { target: { value: 'رضا' } });

    expect(screen.getByText('رضا کمالی')).toBeInTheDocument();
  });

  it('renders contact detail page and allows status & admin note updating', async () => {
    render(<ContactDetailPage />);

    expect(await screen.findByText('رضا کمالی')).toBeInTheDocument();
    expect(screen.getByText('سلام، نیاز به مشاوره برای خرید پنل خورشیدی ۵۵۰ وات دارم.')).toBeInTheDocument();
    expect(screen.getByText('09121112233')).toBeInTheDocument();
    expect(screen.getByText('reza@kamali.ir')).toBeInTheDocument();

    const noteTextarea = screen.getByPlaceholderText('یادداشت داخلی مدیریت');
    fireEvent.change(noteTextarea, { target: { value: 'تماس تلفنی اولیه برقرار شد' } });

    const saveButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    fireEvent.click(saveButton);

    expect(updateContactMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c-1',
        data: expect.objectContaining({
          admin_note: 'تماس تلفنی اولیه برقرار شد',
        }),
      }),
      expect.any(Object)
    );
  });
});
