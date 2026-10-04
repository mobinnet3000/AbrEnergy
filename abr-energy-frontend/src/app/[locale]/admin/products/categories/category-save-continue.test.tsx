/**
 * Phase 9.1 — category Save & Continue (+ dirty-guard integration).
 *
 * New page:
 * - Save & Continue persists, stays on the editor, establishes the real id
 * - a second Save & Continue updates the SAME entity (no duplicate)
 * - Save after a continue updates then leaves to the list
 * - dirty state resets on continue (Cancel navigates without a prompt)
 * - failed save preserves edits, stays on the page, keeps error mapping
 * - plain Save still leaves to the list (existing behavior preserved)
 * - dirty Cancel still prompts (Stay cancels, Leave navigates)
 *
 * Edit page:
 * - Save & Continue persists, stays on the same editor, refetches
 * - dirty resets once the baseline reconciles (no false prompt)
 * - failed save preserves edits and stays dirty
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewCategoryPage from '@/app/[locale]/admin/products/categories/new/page';
import EditCategoryPage from '@/app/[locale]/admin/products/categories/[id]/edit/page';
import { useAuthStore } from '@/stores/auth-store';
import type { ProductCategoryDetail, User } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'c1' }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/shared/media-upload', () => ({
  MediaUpload: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('@/components/shared/rich-text-editor', () => ({
  RichTextEditor: ({ content }: { content: string }) => <div data-testid="rich-text-stub">{content}</div>,
}));

const createMutateMock = vi.fn();
const updateMutateMock = vi.fn();
const refetchMock = vi.fn();

let detail: ProductCategoryDetail = {
  id: 'c1',
  title: 'دسته اصلی',
  slug: 'cat-1',
  slug_t: 'cat-1',
  parent: null,
  description: '',
  content: '',
  meta_title: '',
  meta_description: '',
  cover: null,
  cover_image_url: '',
  og_image: null,
  og_image_url: '',
  sort_order: 0,
  is_active: true,
  is_featured: false,
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: 'index_follow',
  og_title: '',
  og_description: '',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

vi.mock('@/hooks/use-api', () => ({
  useAdminProductCategories: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useAdminProductCategory: () => ({ data: detail, isLoading: false, error: null, refetch: refetchMock }),
  useCreateAdminProductCategory: () => ({ mutate: createMutateMock, isPending: false }),
  useUpdateAdminProductCategory: () => ({ mutate: updateMutateMock, isPending: false }),
  useDeleteAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/api', () => ({
  previewApi: { issue: async () => ({ token: 'tok' }) },
}));

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

/** First text input on the category form is the title. */
function titleInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input');
  if (!input) throw new Error('title input not found');
  return input as HTMLInputElement;
}

const nested400 = {
  response: {
    status: 400,
    data: { errors: { translations: { fa: { title: ['This field is required.'] } }, slug: ['Taken.'] } },
  },
};

beforeEach(() => {
  detail = { ...detail, title: 'دسته اصلی', slug: 'cat-1' };
  useAuthStore.setState({ user: { role: 'content_manager' } as unknown as User });
  createMutateMock.mockImplementation((_payload: unknown, opts?: { onSuccess?: (v: unknown) => void }) => {
    opts?.onSuccess?.({ id: 'c1' });
  });
  updateMutateMock.mockImplementation((_vars: unknown, opts?: { onSuccess?: () => void }) => {
    opts?.onSuccess?.();
  });
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
});

describe('Category create — Save & Continue', () => {
  it('persists, stays on the editor, and resets dirty state', async () => {
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه' } });

    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));

    expect(createMutateMock).toHaveBeenCalledTimes(1);
    expect(createMutateMock.mock.calls[0][0]).toMatchObject({
      translations: { fa: { title: 'دسته تازه' } },
    });
    // Remains on the editor: no navigation away.
    expect(pushMock).not.toHaveBeenCalled();
    // Dirty reset: Cancel now navigates directly with no prompt.
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories'),
    );
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('a second Save & Continue updates the same entity (no duplicate)', () => {
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));
    expect(createMutateMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه ویراسته' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));

    expect(createMutateMock).toHaveBeenCalledTimes(1);
    expect(updateMutateMock).toHaveBeenCalledTimes(1);
    expect(updateMutateMock.mock.calls[0][0]).toMatchObject({ id: 'c1' });
    expect(updateMutateMock.mock.calls[0][0].data).toMatchObject({
      translations: { fa: { title: 'دسته تازه ویراسته' } },
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Save after a continue updates the same entity then leaves to the list', async () => {
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.save' }));
    expect(createMutateMock).toHaveBeenCalledTimes(1);
    expect(updateMutateMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories'),
    );
  });

  it('plain Save still leaves to the list (existing behavior preserved)', async () => {
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save' }));
    expect(createMutateMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories'),
    );
  });

  it('failed Save & Continue preserves edits, stays, and keeps error mapping', async () => {
    createMutateMock.mockImplementation((_p: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(nested400);
    });
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته تازه' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));

    // Inline alert with field context (Phase 8.5 mapping intact).
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('translations.fa.title');
    // Typed value preserved, still on the page, still dirty.
    expect(titleInput(container).value).toBe('دسته تازه');
    expect(pushMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('dirty Cancel prompts; Stay cancels, Leave navigates (guard intact)', async () => {
    const { container } = render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'ناتمام' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_stay' }));
    await waitFor(() =>
      expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull(),
    );
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(await screen.findByText('admin.unsaved_changes_title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.unsaved_changes_leave' }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories'),
    );
  });

  it('clean Cancel navigates directly with no prompt', () => {
    render(<NewCategoryPage />, { wrapper: wrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/products/categories');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });
});

describe('Category edit — Save & Continue', () => {
  it('persists, stays on the same editor, and refetches', async () => {
    const { container } = render(<EditCategoryPage />, { wrapper: wrapper() });
    expect(titleInput(container).value).toBe('دسته اصلی');

    fireEvent.change(titleInput(container), { target: { value: 'دسته ویراسته' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));

    expect(updateMutateMock).toHaveBeenCalledTimes(1);
    expect(updateMutateMock.mock.calls[0][0]).toMatchObject({ id: 'c1' });
    expect(updateMutateMock.mock.calls[0][0].data).toMatchObject({
      translations: { fa: { title: 'دسته ویراسته' } },
    });
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
    // Remains on the editor: no navigation away.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('dirty resets once the baseline reconciles (no false prompt)', async () => {
    const { container, rerender } = render(<EditCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته ویراسته' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());

    // Server baseline now matches the form (refetch reconciliation).
    detail = { ...detail, title: 'دسته ویراسته' };
    rerender(<EditCategoryPage />);

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories'),
    );
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('failed Save & Continue preserves edits and stays dirty', async () => {
    updateMutateMock.mockImplementation((_v: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(nested400);
    });
    const { container } = render(<EditCategoryPage />, { wrapper: wrapper() });
    fireEvent.change(titleInput(container), { target: { value: 'دسته ویراسته' } });
    fireEvent.click(screen.getByRole('button', { name: 'admin.save_continue' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(titleInput(container).value).toBe('دسته ویراسته');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
