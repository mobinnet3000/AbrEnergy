import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminNotificationsPage from './page';
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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa/admin/notifications',
}));

const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    title: 'New Contact Request',
    message: 'New contact request from علی کریمی',
    notification_type: 'new_contact',
    link: '/admin/contacts/c-99',
    is_read: false,
    created_at: '2026-10-27T08:00:00Z',
  },
  {
    id: 'n-2',
    title: 'New Project Inquiry',
    message: 'New inquiry from شرکت مهر در یزد',
    notification_type: 'new_project_inquiry',
    link: '/admin/project-inquiries/inq-88',
    is_read: true,
    created_at: '2026-10-26T18:00:00Z',
  },
];

const markReadMock = vi.fn();
const markAllReadMock = vi.fn();
const deleteNotificationMock = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useNotifications: () => ({
    data: MOCK_NOTIFICATIONS,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUnreadCount: () => ({
    data: { count: 1 },
    isLoading: false,
  }),
  useMarkRead: () => ({
    mutate: markReadMock,
    isPending: false,
  }),
  useMarkAllRead: () => ({
    mutate: markAllReadMock,
    isPending: false,
  }),
  useDeleteNotification: () => ({
    mutate: deleteNotificationMock,
    isPending: false,
  }),
}));

describe('Admin Notifications Flow (Phase 12.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notifications with unread highlight and actionable destinations', () => {
    render(<AdminNotificationsPage />);

    expect(screen.getByText('اعلان‌ها')).toBeInTheDocument();
    expect(screen.getByText('New Contact Request')).toBeInTheDocument();
    expect(screen.getByText('New contact request from علی کریمی')).toBeInTheDocument();
    expect(screen.getByText('New Project Inquiry')).toBeInTheDocument();

    // Verify actionable destination links exist and rewrite legacy links
    const viewButtons = screen.getAllByText('مشاهده و پیگیری');
    expect(viewButtons.length).toBe(2);

    // Legacy /admin/project-inquiries/ was normalized by resolveNotificationLink to /fa/admin/inquiries/inq-88
    const inquiryLink = screen.getByText('New inquiry from شرکت مهر در یزد')
      .closest('.p-4, .p-5')
      ?.querySelector('a');
    expect(inquiryLink?.getAttribute('href')).toBe('/fa/admin/inquiries/inq-88');
  });

  it('triggers mark-all-read mutation when Mark All Read button is clicked', () => {
    render(<AdminNotificationsPage />);

    const markAllBtn = screen.getByRole('button', { name: /علامت‌گذاری همه به عنوان خوانده شده/i });
    fireEvent.click(markAllBtn);

    expect(markAllReadMock).toHaveBeenCalled();
  });

  it('allows marking single unread notification as read', () => {
    render(<AdminNotificationsPage />);

    const markReadBtn = screen.getByTitle('خوانده شد');
    fireEvent.click(markReadBtn);

    expect(markReadMock).toHaveBeenCalledWith('n-1', expect.any(Object));
  });

  it('allows deleting a notification', () => {
    render(<AdminNotificationsPage />);

    const deleteButtons = screen.getAllByTitle('حذف');
    fireEvent.click(deleteButtons[0]);

    expect(deleteNotificationMock).toHaveBeenCalledWith('n-1', expect.any(Object));
  });
});
