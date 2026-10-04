/**
 * Phase 9.2 — dirty navigation guards for the project editors.
 *
 * Both pages reuse the EXISTING Phase 8.3 `useDirtyNavigationGuard` (no new
 * dirty system) over their own form state (new: initial-vs-current
 * comparison; edit: pending `edits`). Clean → direct navigation; dirty →
 * single Stay/Leave dialog (existing localized ConfirmDialog). Failed saves
 * preserve edits+dirty; successful saves navigate with no prompt. No Save &
 * Continue exists here (per scope: not added). Existing delete/navigation
 * behavior is untouched (no delete UI on these editors).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewProjectPage from '@/app/[locale]/admin/projects/new/page';
import EditProjectPage from '@/app/[locale]/admin/projects/[id]/edit/page';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'prj-1' }),
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

const projectDetail = {
  id: 'prj-1',
  project_type: 'on_grid',
  capacity: 50,
  location: 'تهران',
  status: 'planned',
  start_date: '',
  end_date: '',
  title_fa: 'پروژه موجود',
  description_fa: 'شرح',
  title_ar: '', description_ar: '',
  title_en: '', description_en: '',
};

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  patchMock.mockReset();
  getMock.mockResolvedValue({ data: projectDetail });
  postMock.mockResolvedValue({ data: { id: 'prj-9' } });
  patchMock.mockResolvedValue({ data: projectDetail });
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
  const link = container.querySelector('a[href="/admin/projects"]');
  if (!link) throw new Error('back link not found');
  return link as HTMLAnchorElement;
}

describe('Project new — dirty guard (Phase 9.2)', () => {
  it('clean form navigates directly with no dialog', () => {
    const { container } = render(<NewProjectPage />, { wrapper: wrapper() });
    fireEvent.click(backLink(container));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/projects');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('dirty back-link opens the dialog; Stay keeps edits, Leave navigates once', async () => {
    const { container } = render(<NewProjectPage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'پروژه تازه' } });

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_stay' }));
    await waitFor(() => expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
    expect(faTitleInput(container).value).toBe('پروژه تازه');

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_leave' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith('/admin/projects');
  });

  it('failed save preserves edits and keeps the form dirty', async () => {
    postMock.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<NewProjectPage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'پروژه تازه' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.create_project' }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
    expect(faTitleInput(container).value).toBe('پروژه تازه');

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('successful save navigates with no prompt', async () => {
    const { container } = render(<NewProjectPage />, { wrapper: wrapper() });
    fireEvent.change(faTitleInput(container), { target: { value: 'پروژه تازه' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.create_project' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/projects'));
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });
});

describe('Project edit — dirty guard (Phase 9.2)', () => {
  it('clean form navigates directly with no dialog', async () => {
    const { container } = render(<EditProjectPage />, { wrapper: wrapper() });
    await screen.findByDisplayValue('پروژه موجود');
    fireEvent.click(backLink(container));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/projects');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('dirty back-link opens the dialog; Stay keeps edits, Leave navigates once', async () => {
    const { container } = render(<EditProjectPage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('پروژه موجود');
    fireEvent.change(input, { target: { value: 'پروژه ویراسته' } });

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_stay' }));
    await waitFor(() => expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
    expect(await screen.findByDisplayValue('پروژه ویراسته')).toBeTruthy();

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_leave' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith('/admin/projects');
  });

  it('failed save preserves edits and keeps the form dirty', async () => {
    patchMock.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<EditProjectPage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('پروژه موجود');
    fireEvent.change(input, { target: { value: 'پروژه ویراسته' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.save_changes' }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
    expect(await screen.findByDisplayValue('پروژه ویراسته')).toBeTruthy();

    fireEvent.click(backLink(container));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('successful save navigates with no prompt', async () => {
    render(<EditProjectPage />, { wrapper: wrapper() });
    const input = await screen.findByDisplayValue('پروژه موجود');
    fireEvent.change(input, { target: { value: 'پروژه ویراسته' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.save_changes' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/projects'));
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });
});
