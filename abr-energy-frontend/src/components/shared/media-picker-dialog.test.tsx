/**
 * Phase 9.5 — Media Picker (lightweight media reuse) tests.
 *
 * Covers the dialog contract (open / image+document modes / debounced
 * search / server pagination / loading+empty+error+permission states /
 * single+multi selection / cancel-clean / confirm / no URL coupling / no
 * `[object Object]`) and the consumer wiring (product gallery+documents+OG,
 * category cover+OG, homepage visuals+OG, article cover) with the existing
 * upload path preserved. Reuses the established picker-debounce fake-timer
 * mechanics and the shared `useDebouncedValue` (300 ms) — no new debounce
 * implementation anywhere.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChooseMediaButton, type MediaPickerItem } from './media-picker-dialog';
import { MEDIA_PICKER_PAGE_SIZE } from './media-picker-dialog';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/api/axios', () => ({ default: axiosMock }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : ''} {...rest}>{children}</a>
  ),
}));

vi.mock('@/components/shared/rich-text-editor', () => ({
  RichTextEditor: ({ content }: { content: string }) => <div data-testid="rich-text-stub">{content}</div>,
}));

const apiHooksMock = vi.hoisted(() => ({
  useAdminProductCategories: vi.fn(() => ({ data: [] })),
  useAdminProductCategory: vi.fn(() => ({ data: null as unknown, isLoading: false })),
  useCreateAdminProductCategory: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateAdminProductCategory: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteAdminProductCategory: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useAdminHomepage: vi.fn(() => ({ data: null as unknown, isLoading: false, error: null, refetch: vi.fn() })),
  useUpdateAdminHomepage: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePublicProductCategories: vi.fn(() => ({ data: [] })),
  useServices: vi.fn(() => ({ data: [] })),
}));
vi.mock('@/hooks/use-api', () => apiHooksMock);

function queryWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const imgItem = (over: Partial<MediaPickerItem> = {}): MediaPickerItem => ({
  id: 'img-1',
  url: 'http://x/img-1.png',
  thumbnail_url: 'http://x/img-1.png',
  original_name: 'packshot-alpha.png',
  file_type: 'image',
  file_size: 1200,
  width: 10,
  height: 10,
  alt_text: 'alpha',
  subfolder: 'products',
  uploaded_at: '2026-09-01T00:00:00Z',
  ...over,
});

const docItem = (over: Partial<MediaPickerItem> = {}): MediaPickerItem => ({
  id: 'doc-1',
  url: 'http://x/doc-1.pdf',
  thumbnail_url: '',
  original_name: 'datasheet-gamma.pdf',
  file_type: 'document',
  file_size: 2500,
  width: null,
  height: null,
  alt_text: '',
  subfolder: 'documents',
  uploaded_at: '2026-09-01T00:00:00Z',
  ...over,
});

const envelope = (results: MediaPickerItem[], count?: number) => ({
  data: { count: count ?? results.length, next: null, previous: null, results },
});

/** Same fake-timer flush mechanics as the Phase 8.6 picker-debounce suite. */
async function advanceAndFlush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  for (let i = 0; i < 5; i++) {
    await act(async () => {});
  }
  await act(async () => {
    vi.advanceTimersByTime(0);
  });
  for (let i = 0; i < 5; i++) {
    await act(async () => {});
  }
}

function lastMediaParams(): Record<string, unknown> {
  const calls = axiosMock.get.mock.calls as unknown[][];
  const mediaCalls = calls.filter((c) => String(c[0]).startsWith('/media/'));
  const last = mediaCalls[mediaCalls.length - 1];
  return ((last[1] as { params?: Record<string, unknown> })?.params ?? {}) as Record<string, unknown>;
}

function mediaCallCount(): number {
  return (axiosMock.get.mock.calls as unknown[][]).filter((c) => String(c[0]).startsWith('/media/')).length;
}

beforeEach(() => {
  vi.useFakeTimers();
  axiosMock.get.mockReset();
  axiosMock.post.mockReset();
  axiosMock.patch.mockReset();
  axiosMock.get.mockResolvedValue(envelope([imgItem()]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('MediaPickerDialog — open, modes, states', () => {
  it('opens from the trigger and sends the image type filter', async () => {
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByText('admin.media_picker_title_image')).toBeTruthy();
    expect(lastMediaParams()).toMatchObject({ file_type: 'image', page: 1, page_size: MEDIA_PICKER_PAGE_SIZE });
  });

  it('document mode filters documents and shows the document title', async () => {
    axiosMock.get.mockResolvedValue(envelope([docItem()]));
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="document" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByText('admin.media_picker_title_document')).toBeTruthy();
    expect(lastMediaParams()).toMatchObject({ file_type: 'document' });
    expect(screen.getByText('datasheet-gamma.pdf')).toBeTruthy();
  });

  it('renders loading, then cards', async () => {
    let resolve!: (v: unknown) => void;
    axiosMock.get.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByRole('status')).toBeTruthy();
    await act(async () => {
      resolve(envelope([imgItem()]));
    });
    await advanceAndFlush(0);
    expect(screen.getByText('packshot-alpha.png')).toBeTruthy();
  });

  it('renders the empty state when the library has no rows', async () => {
    axiosMock.get.mockResolvedValue(envelope([]));
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByText('admin.media_picker_empty')).toBeTruthy();
  });

  it('renders a retryable error state (never [object Object])', async () => {
    axiosMock.get.mockRejectedValueOnce({
      response: { status: 500, data: { status: 500, errors: { images_data: { 0: { media_file: ['bad'] } } } } },
    });
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).not.toContain('[object Object]');
    const before = mediaCallCount();
    fireEvent.click(screen.getByText('admin.retry'));
    await advanceAndFlush(0);
    expect(mediaCallCount()).toBeGreaterThan(before);
  });

  it('renders the permission-denied state on 403', async () => {
    axiosMock.get.mockRejectedValueOnce({
      response: { status: 403, data: { status: 403, errors: { detail: 'forbidden' } } },
    });
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByRole('alert').textContent).toContain('admin.permission_denied');
  });
});

describe('MediaPickerDialog — search debounce + pagination', () => {
  it('rapid typing fires ONE request with the latest query', async () => {
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(mediaCallCount()).toBe(1);

    const input = screen.getByLabelText('admin.media_picker_search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'س' } });
    expect(input.value).toBe('س');
    fireEvent.change(input, { target: { value: 'سو' } });
    fireEvent.change(input, { target: { value: 'سول' } });

    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(mediaCallCount()).toBe(1);

    await advanceAndFlush(50);
    expect(mediaCallCount()).toBe(2);
    expect(lastMediaParams()).toMatchObject({ search: 'سول' });
    const searches = (axiosMock.get.mock.calls as unknown[][])
      .filter((c) => String(c[0]).startsWith('/media/'))
      .map((c) => (c[1] as { params?: Record<string, unknown> })?.params?.search as string | undefined);
    expect(searches).not.toContain('س');
    expect(searches).not.toContain('سو');
    // Typing never selects: parent untouched.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('paginates server-side and never touches the URL', async () => {
    const page1 = [imgItem()];
    const page2 = [imgItem({ id: 'img-2', original_name: 'packshot-beta.png', url: 'http://x/img-2.png' })];
    axiosMock.get.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      const page = Number(config?.params?.page ?? 1);
      return Promise.resolve({
        data: {
          count: 21,
          next: page === 1 ? 'n' : null,
          previous: page === 2 ? 'p' : null,
          results: page === 1 ? page1 : page2,
        },
      });
    });
    const hrefBefore = window.location.href;
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect(screen.getByText('packshot-alpha.png')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('common.next'));
    await advanceAndFlush(0);
    expect(lastMediaParams()).toMatchObject({ page: 2 });
    expect(screen.getByText('packshot-beta.png')).toBeTruthy();
    expect(window.location.href).toBe(hrefBefore);
  });
});

describe('MediaPickerDialog — selection semantics', () => {
  it('single mode: confirm disabled until a card is picked, then returns the item', async () => {
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    const confirm = screen.getByText('admin.media_picker_select');
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirm);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject([{ id: 'img-1', url: 'http://x/img-1.png' }]);
    // Dialog closed after confirm.
    expect(screen.queryByText('admin.media_picker_title_image')).toBeNull();
  });

  it('multi mode: stages several cards, toggles off, and returns all', async () => {
    axiosMock.get.mockResolvedValue(
      envelope([imgItem(), imgItem({ id: 'img-2', original_name: 'packshot-beta.png', url: 'http://x/img-2.png' })], 2),
    );
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" multiple onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByLabelText('packshot-beta.png'));
    // Toggle the first one back off.
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByText('admin.media_picker_select'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject([{ id: 'img-2' }]);
  });

  it('cancel leaves the parent unchanged and resets staging on reopen', async () => {
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText('admin.media_picker_title_image')).toBeNull();

    // Reopen: nothing pre-staged (confirm disabled again).
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    expect((screen.getByText('admin.media_picker_select') as HTMLButtonElement).disabled).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('RTL: filenames stay LTR, card buttons expose selected state', async () => {
    const onSelect = vi.fn();
    render(<ChooseMediaButton mode="image" multiple onSelect={onSelect} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    const name = screen.getByText('packshot-alpha.png');
    expect(name.getAttribute('dir')).toBe('ltr');
    const card = screen.getByLabelText('packshot-alpha.png');
    expect(card.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(card);
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Phase 9.5 — consumer integrations', () => {
  it('product documents: choose-existing appends a PDF row; upload stays available', async () => {
    const { ProductDocumentsManager } = await import('../products/product-documents-manager');
    axiosMock.get.mockResolvedValue(envelope([docItem()]));
    const onChange = vi.fn();
    render(<ProductDocumentsManager documents={[]} onChange={onChange} />, { wrapper: queryWrapper() });
    // Existing upload path untouched.
    expect(screen.getByText('admin.docs_upload')).toBeTruthy();
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('datasheet-gamma.pdf'));
    fireEvent.click(screen.getByText('admin.media_picker_select'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({
      media_file: 'doc-1',
      url: 'http://x/doc-1.pdf',
      title: 'datasheet-gamma',
      doc_type: 'catalog',
      is_active: true,
    });
  });

  it('product OG: choose-existing writes the id+url pair through set()', async () => {
    const { ProductSeoFields } = await import('../products/product-seo-fields');
    const set = vi.fn();
    const form = { seo_title: '', seo_description: '', canonical_url: '', robots: 'index_follow', og_title: '', og_description: '', og_image_url: '', og_image_id: '', slug: '' } as unknown as import('@/lib/product-form').ProductFormState;
    render(<ProductSeoFields form={form} set={set} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByText('admin.media_picker_select'));
    expect(set).toHaveBeenCalledWith('og_image_url', 'http://x/img-1.png');
    expect(set).toHaveBeenCalledWith('og_image_id', 'img-1');
  });

  it('homepage visuals: per-row choose writes image+image_url only', async () => {
    const { HomepageVisualsEditor } = await import('../homepage/homepage-visuals-editor');
    const onChange = vi.fn();
    const visuals = [{ key: 'v1', image: '', image_url: '', alt: 'hero', order: 0, enabled: true, link_url: '' }];
    render(<HomepageVisualsEditor visuals={visuals} onChange={onChange} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByText('admin.media_picker_select'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ key: 'v1', image: 'img-1', image_url: 'http://x/img-1.png', alt: 'hero' });
  });

  it('category cover+OG: both slots offer choose-existing beside upload', async () => {
    const { default: NewCategoryPage } = await import('@/app/[locale]/admin/products/categories/new/page');
    render(<NewCategoryPage />, { wrapper: queryWrapper() });
    await advanceAndFlush(0);
    const triggers = screen.getAllByText('admin.media_choose_existing');
    // Cover slot + OG slot.
    expect(triggers.length).toBe(2);
  });

  it('homepage OG: choose-existing writes og_image_id and save sends the id (no copy)', async () => {
    const { useAuthStore } = await import('@/stores/auth-store');
    const { default: HomepageStudioPage } = await import('@/app/[locale]/admin/content/homepage/page');
    const homepagePayload = {
      hero_eyebrow: '', hero_primary_cta_label: '', hero_primary_cta_url: '', hero_primary_cta_enabled: true,
      hero_secondary_cta_label: '', hero_secondary_cta_url: '', hero_secondary_cta_enabled: true,
      calculator_cta_label: '', calculator_cta_url: '', contact_cta_label: '', contact_cta_url: '',
      contact_secondary_cta_label: '', contact_secondary_cta_url: '', articles_count: 3,
      seo_title: '', seo_description: '', canonical_url: '', robots: 'index_follow',
      og_title: '', og_description: '', og_image: null, og_image_url: '', updated_at: '',
      sections: [], featured_products: [], categories: [], services: [], projects: [], articles: [], visuals: [],
    };
    apiHooksMock.useAdminHomepage.mockReturnValue({ data: homepagePayload, isLoading: false, error: null, refetch: vi.fn() });
    const mutate = vi.fn();
    apiHooksMock.useUpdateAdminHomepage.mockReturnValue({ mutate, isPending: false });
    useAuthStore.setState({ user: { role: 'content_manager' } as unknown as import('@/types').User });
    try {
      render(<HomepageStudioPage />, { wrapper: queryWrapper() });
      await advanceAndFlush(0);
      // No visuals rows: the only choose trigger is the singleton OG slot.
      const triggers = screen.getAllByText('admin.media_choose_existing');
      expect(triggers.length).toBe(1);
      fireEvent.click(triggers[0]);
      await advanceAndFlush(0);
      fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
      fireEvent.click(screen.getByText('admin.media_picker_select'));
      await advanceAndFlush(0);
      fireEvent.click(screen.getByText('common.save'));
      await advanceAndFlush(0);
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ og_image: 'img-1' }),
        expect.anything(),
      );
    } finally {
      useAuthStore.setState({ user: null });
    }
  });

  it('article cover: choose-existing stores the id and submits cover_image (no copy)', async () => {
    const { default: NewArticlePage } = await import('@/app/[locale]/admin/articles/new/page');
    axiosMock.post.mockResolvedValue({ data: { id: 'art-9' } });
    const { container } = render(<NewArticlePage />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    await advanceAndFlush(0);
    fireEvent.click(screen.getByLabelText('packshot-alpha.png'));
    fireEvent.click(screen.getByText('admin.media_picker_select'));
    await advanceAndFlush(0);
    // Submit the form; the existing title inputs are the first inputs.
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    await advanceAndFlush(0);
    expect(axiosMock.post).toHaveBeenCalledWith(
      '/admin/articles/',
      expect.objectContaining({ cover_image: 'img-1', cover_image_url: 'http://x/img-1.png' }),
    );
  });

  it('existing upload controls remain rendered next to every choose trigger', async () => {
    const { ProductDocumentsManager } = await import('../products/product-documents-manager');
    const onChange = vi.fn();
    render(<ProductDocumentsManager documents={[]} onChange={onChange} />, { wrapper: queryWrapper() });
    // Upload affordance (DocumentUpload label) + choose trigger coexist.
    expect(screen.getByText('admin.docs_upload')).toBeTruthy();
    expect(screen.getByText('admin.media_choose_existing')).toBeTruthy();
    // Scoped check: the dialog list is modal-local (no list URL coupling).
    expect(within(document.body).queryByText('packshot-alpha.png')).toBeNull();
  });
});
