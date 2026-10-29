import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminUsersPage from './page';
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
  usePathname: () => '/fa/admin/users',
}));

const MOCK_USERS = [
  {
    id: 'u-admin-1',
    email: 'boss@abarenergy.ir',
    full_name: 'مدیر کل ارشد',
    phone_number: '09121110000',
    role: 'super_admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u-tech-2',
    email: 'engineer@abarenergy.ir',
    full_name: 'مهندس ناظر',
    phone_number: '09122220000',
    role: 'engineer',
    is_active: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'u-cust-3',
    email: 'client@gmail.com',
    full_name: 'مشتری خورشیدی',
    phone_number: '09123330000',
    role: 'customer',
    is_active: false,
    created_at: '2026-05-01T00:00:00Z',
  },
];

const updateUserMock = vi.fn();

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { user: { id: string; role: string; full_name: string } }) => unknown) =>
    selector({ user: { id: 'u-admin-1', role: 'super_admin', full_name: 'مدیر کل ارشد' } }),
}));

vi.mock('@/hooks/use-api', () => ({
  useAdminUsers: (params?: Record<string, string>) => {
    let results = MOCK_USERS;
    if (params?.role && params.role !== 'all') {
      results = results.filter((u) => u.role === params.role);
    }
    if (params?.is_active) {
      const activeBool = params.is_active === 'true';
      results = results.filter((u) => u.is_active === activeBool);
    }
    if (params?.search) {
      results = results.filter((u) => u.full_name.includes(params.search) || u.email.includes(params.search));
    }
    return {
      data: { count: results.length, results },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useUpdateAdminUser: () => ({
    mutate: updateUserMock,
    isPending: false,
  }),
  useCreateAdminUser: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('Admin Users Flow (Phase 12.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list with Persian roles and active/inactive status badges', () => {
    render(<AdminUsersPage />);

    expect(screen.getByText('کاربران')).toBeInTheDocument();
    expect(screen.getByText('مدیر کل ارشد')).toBeInTheDocument();
    expect(screen.getByText('مهندس ناظر')).toBeInTheDocument();
    expect(screen.getByText('مشتری خورشیدی')).toBeInTheDocument();

    expect(screen.getByText('مدیر ارشد سیستم')).toBeInTheDocument();
    expect(screen.getByText('مهندس فنی')).toBeInTheDocument();
    expect(screen.getByText('مشتری')).toBeInTheDocument();

    expect(screen.getAllByText('فعال').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('غیرفعال')).toBeInTheDocument();
  });

  it('displays last-super-admin protection warning when editing sole active super admin', async () => {
    render(<AdminUsersPage />);

    // Click edit on the sole super admin
    const editButtons = screen.getAllByRole('button', { name: /ویرایش دسترسی و وضعیت/i });
    fireEvent.click(editButtons[0]);

    // Check dialog opens and warning is shown
    expect(screen.getAllByText(/این کاربر تنها مدیر ارشد فعال سیستم است/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows updating role and status for non-super-admin users', async () => {
    render(<AdminUsersPage />);

    // Click edit on customer user (index 2)
    const editButtons = screen.getAllByRole('button', { name: /ویرایش دسترسی و وضعیت/i });
    fireEvent.click(editButtons[2]);

    expect(screen.queryByText(/این کاربر تنها مدیر ارشد فعال سیستم است/i)).not.toBeInTheDocument();

    // Click Save Changes to open confirmation
    const saveButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    fireEvent.click(saveButton);

    // Confirm dialog shows
    expect(screen.getByText(/آیا از تغییر نقش یا وضعیت این کاربر اطمینان دارید؟/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /تایید/i });
    fireEvent.click(confirmButton);

    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'u-cust-3',
        data: expect.objectContaining({
          role: 'customer',
          is_active: false,
        }),
      }),
      expect.any(Object)
    );
  });
});
