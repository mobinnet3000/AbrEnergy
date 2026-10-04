/**
 * Phase 9.2 — dirty navigation guards for the service editors.
 *
 * Both pages reuse the EXISTING Phase 8.3 `useDirtyNavigationGuard` (no new
 * dirty system) over their own form state (new: initial-vs-current
 * comparison; edit: pending `edits`). Clean → direct navigation; dirty →
 * single Stay/Leave dialog (existing localized ConfirmDialog). Failed saves
 * preserve edits+dirty; successful saves navigate with no prompt. No Save &
 * Continue exists here (per scope: not added).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewServicePage from '@/app/[locale]/admin/services/new/page';
import EditServicePage from '@/app/[locale]/admin/services/[id]/edit/page';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'svc-1' }),
}));

vi.mock('next/link', () => ({
  // Faithful test double for clean navigation: a real Next Link performs
  // default SPA navigation to `href` when the click is not prevented (the
  // dirty guard prevents it while dirty). jsdom cannot navigate, so the
  // double records it via the mocked router instead. Also avoids the real
  // Link's prefetch observers (IntersectionObserver) that jsdom lacks.
  default: ({ href, onClick, children, ...rest }: { href: string; onClick?: (e: React.MouseEvent) => void; children: React.ReactNode }) => (
    <a
      href={href}
      onClick={(e: React.MouseEvent) => {
        onClick?.(e);
        if (!e.defaultPrevented) pushMock(typeof href === 'string' ? href : '');
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();
vi.mock('@/api/axios', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const serviceDetail = {
  id: 'svc-1',
  icon: 'solar',
  category: '',
  order: 0,
  status: 'active',
  is_featured: false,
  features: ['warranty'],
  title_fa: 'خدمت موجود',
  short_description_fa: 'خلاصه',
  description_fa: 'شرح',
  title_ar: '', short_description_ar: '', description_ar: '',
  title_en: '', short_description_en: '', description_en: '',
};

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  patchMock.mockReset();
  getMock.mockImplementation((url: string) => {
    if (String(url).startsWith('/service-categories')) return Promise.resolve({ data: { results: [] } });
    return Promise.resolve({ data: serviceDetail });
  });
  postMock.mockResolvedValue({ data: { id: 'svc-9' } });
  patchMock.mockResolvedValue({ data: serviceDetail });
});

afterEach(() => {
  vi.clearAllMocks();
});

function faTitleInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input');
  if (!input) throw new Error('fa title input not found');
  return input as HTMLInputElement;
}

function backLink(container: HTMLElement): HTMLAnchorElement {
  const link = container.querySelector('a[href="/admin/services"]');
  if (!link) throw new Error('back link not found');
  return link as HTMLAnchorElement;
}

describe('Service new — dirty guard (Phase 9.2)', () => {
  it('clean form navigates directly with no dialog', () => {
    const { container } = render(<NewServicePage />, { wrapper: wrapper() });
    fireEvent.click(backLink(container));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/services');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('dirty back-link opens the dialog; Stay keeps edits, Leave navigates once', async () => {
    const { container } = render(<NewServicePage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'خدمت تازه' } });

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_stay' }));
    await waitFor(() => expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
    expect(faTitleInput(container).value).toBe('خدمت تازه');

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_leave' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith('/admin/services');
  });

  it('failed save preserves edits and keeps the form dirty', async () => {
    postMock.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<NewServicePage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'خدمت تازه' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.create_service' }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
    expect(faTitleInput(container).value).toBe('خدمت تازه');

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('successful save navigates with no prompt', async () => {
    const { container } = render(<NewServicePage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'خدمت تازه' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.create_service' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/services'));
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });
});

describe('Service edit — dirty guard (Phase 9.2)', () => {
  it('clean form navigates directly with no dialog', async () => {
    const { container } = render(<EditServicePage />, { wrapper: wrapper() });
    await screen.findByDisplayValue('خدمت موجود');
    fireEvent.click(backLink(container));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/services');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('dirty back-link opens the dialog; Stay keeps edits, Leave navigates once', async () => {
    const { container } = render(<EditServicePage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('خدمت موجود');
    fireEvent.change(input, { target: { value: 'خدمت ویراسته' } });

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_stay' }));
    await waitFor(() => expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
    expect(await screen.findByDisplayValue('خدمت ویراسته')).toBeTruthy();

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_leave' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith('/admin/services');
  });

  it('failed save preserves edits and keeps the form dirty', async () => {
    patchMock.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<EditServicePage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('خدمت موجود');
    fireEvent.change(input, { target: { value: 'خدمت ویراسته' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.save_changes' }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
    expect(await screen.findByDisplayValue('خدمت ویراسته')).toBeTruthy();

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('successful save navigates with no prompt', async () => {
    render(<EditServicePage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('خدمت موجود');
    fireEvent.change(input, { target: { value: 'خدمت ویراسته' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.save_changes' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/services'));
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });
});
