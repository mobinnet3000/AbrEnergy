/**
 * Phase 8.5 (BUG-06) — CMS integration tests.
 *
 * These tests prove the REAL CMS surfaces normalized nested errors instead
 * of dropping them: they drive the actual page/editor `onError` paths with
 * realistic axios-shaped backend envelopes and assert what the user sees
 * (inline `role="alert"` summary + concise toast), while dirty state,
 * success behavior, permissions, and read-only UX stay intact.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomepageStudioPage from '@/app/[locale]/admin/content/homepage/page';
import NewCategoryPage from '@/app/[locale]/admin/products/categories/new/page';
import { ProductEditor } from '@/components/products/product-editor';
import { mapProductErrors } from '@/lib/product-form';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { HomepageAdminPayload, User } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({}),
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

const refetchMock = vi.fn();
const studioMutateMock = vi.fn();
const categoryMutateMock = vi.fn();
const previewIssueMock = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useAdminHomepage: () => ({ data: adminPayload, isLoading: false, error: null, refetch: refetchMock }),
  useUpdateAdminHomepage: () => ({ mutate: studioMutateMock, isPending: false }),
  usePublicProductCategories: () => ({ data: [] }),
  useServices: () => ({ data: [] }),
  useAdminProductCategories: () => ({ data: [] }),
  useAttributeDefinitions: () => ({ data: [], isLoading: false }),
  useCreateAdminProductCategory: () => ({ mutate: categoryMutateMock, isPending: false }),
  // Phase 9.1 — NewCategoryPage also consumes the update hook (Save &
  // Continue on an already-persisted category). No-op here: this suite only
  // exercises the create path.
  useUpdateAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/api', () => ({
  articlesApi: { list: async () => [] },
  productsApi: { list: async () => [] },
  projectsApi: { list: async () => [] },
  previewApi: { issue: (...args: unknown[]) => previewIssueMock(...args) },
}));

const adminPayload: HomepageAdminPayload = {
  hero_eyebrow: 'eyebrow',
  hero_primary_cta_label: 'primary',
  hero_primary_cta_url: '/products',
  hero_primary_cta_enabled: true,
  hero_secondary_cta_label: 'secondary',
  hero_secondary_cta_url: '/calculator',
  hero_secondary_cta_enabled: true,
  calculator_cta_label: 'calc',
  calculator_cta_url: '/calculator',
  contact_cta_label: 'contact',
  contact_cta_url: '/contact',
  contact_secondary_cta_label: 'contact-2',
  contact_secondary_cta_url: '/contact',
  articles_count: 3,
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: 'index_follow',
  og_title: '',
  og_description: '',
  og_image: null,
  og_image_url: '',
  updated_at: '2026-09-22T00:00:00Z',
  sections: [
    { key: 'hero', enabled: true, order: 10, title: 'hero-title', subtitle: 'hero-sub', content: '' },
  ],
  featured_products: [],
  categories: [],
  services: [],
  projects: [],
  articles: [],
  visuals: [],
};

/** Realistic nested backend envelope (DRF nested serializer shape). */
const nestedHomepageErr = {
  response: {
    status: 400,
    data: {
      success: false,
      message: 'Validation failed.',
      errors: {
        hero_primary_cta_url: ['Enter a valid URL.'],
        sections_data: { hero: { title: ['Too long.'] } },
        featured_products_data: [{ product: ['Unknown product.'] }],
      },
      status: 400,
    },
  },
};

const nestedCategoryErr = {
  response: {
    status: 400,
    data: {
      success: false,
      errors: {
        translations: { fa: { title: ['This field is required.'] } },
        slug: ['Category slug already exists.'],
      },
      status: 400,
    },
  },
};

function setRole(role: User['role'] | null) {
  if (!role) {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    return;
  }
  useAuthStore.setState({
    user: {
      id: 'u1', email: 'cms@example.com', phone_number: '', full_name: 'CMS', role,
      avatar: null, bio: '', is_active: true, created_at: '', updated_at: '',
    },
    isAuthenticated: true,
  });
}

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function eyebrowInput(): HTMLInputElement {
  const el = Array.from(document.querySelectorAll('fieldset input')).find((n) =>
    (n as HTMLInputElement).value.startsWith('eyebrow'),
  );
  if (!el) throw new Error('eyebrow input not found');
  return el as HTMLInputElement;
}

const toastError = vi.mocked(toast.error);

beforeEach(() => {
  pushMock.mockClear();
  refetchMock.mockClear();
  studioMutateMock.mockReset();
  categoryMutateMock.mockReset();
  previewIssueMock.mockReset();
  toastError.mockClear();
  vi.mocked(toast.success).mockClear();
  setRole('content_manager');
});

describe('Homepage Studio nested errors (BUG-06)', () => {
  it('15. surfaces nested validation errors with field context (inline + toast)', () => {
    studioMutateMock.mockImplementation((_p: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError(nestedHomepageErr),
    );
    renderWithClient(<HomepageStudioPage />);
    fireEvent.click(screen.getByText('admin.save_continue'));

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('hero_primary_cta_url: Enter a valid URL.');
    expect(alert.textContent).toContain('sections_data.hero.title: Too long.');
    expect(alert.textContent).toContain('featured_products_data.0.product: Unknown product.');
    expect(JSON.stringify(alert.textContent)).not.toContain('[object Object]');
    // Concise toast keeps field context instead of a bare generic message.
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0][0])).toContain('hero_primary_cta_url');
  });

  it('18a. failed save keeps edits (form stays dirty, retry possible)', () => {
    studioMutateMock.mockImplementation((_p: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError(nestedHomepageErr),
    );
    renderWithClient(<HomepageStudioPage />);
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    fireEvent.click(screen.getByText('admin.save_continue'));

    // Edits preserved: value intact + alert shown + guard still armed.
    expect(eyebrowInput().value).toBe('eyebrow-edited');
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.getByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('19. successful save behavior unchanged (edits cleared, no alert)', () => {
    studioMutateMock.mockImplementation((_p: unknown, opts: { onSuccess: () => void }) => opts.onSuccess());
    renderWithClient(<HomepageStudioPage />);
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    fireEvent.click(screen.getByText('admin.save_continue'));

    expect(refetchMock).toHaveBeenCalled();
    expect(eyebrowInput().value).toBe('eyebrow');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('20. permission error stays a permission error', () => {
    studioMutateMock.mockImplementation((_p: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError({ response: { status: 403, data: { detail: 'Nope.' } } }),
    );
    renderWithClient(<HomepageStudioPage />);
    fireEvent.click(screen.getByText('admin.save_continue'));
    expect(toastError).toHaveBeenCalledWith('admin.permission_denied');
  });

  it('21. network error stays generic and safe', () => {
    studioMutateMock.mockImplementation((_p: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError({ code: 'ERR_NETWORK', message: 'Network Error', request: {} }),
    );
    renderWithClient(<HomepageStudioPage />);
    fireEvent.click(screen.getByText('admin.save_continue'));
    expect(toastError).toHaveBeenCalledWith('admin.server_connection_failed');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('22. read-only Studio behavior intact (no error box, still non-editable)', () => {
    setRole('customer');
    renderWithClient(<HomepageStudioPage />);
    expect(document.querySelector('fieldset[disabled]')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('admin.readonly_notice_title')).toBeTruthy();
  });

  it('23. preview issuance failure stays a safe generic toast', async () => {
    previewIssueMock.mockRejectedValue({ response: { status: 403, data: { detail: 'Nope.' } } });
    renderWithClient(<HomepageStudioPage />);
    fireEvent.click(screen.getByText('admin.homepage_preview'));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('admin.homepage_preview_failed'));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Product Editor nested errors (BUG-06)', () => {
  it('16. nested validation errors reach their editor sections with form intact', () => {
    // Exact call path of the edit/create pages: response.data → mapProductErrors.
    const data = {
      status: 400,
      errors: {
        translations: { fa: { title: ['Title is required'] } },
        price_data: { regular_price: ['Must be positive'] },
        images_data: [{ media_file: ['Missing file'] }],
      },
    };
    const serverErrorMap = mapProductErrors((data as { response?: unknown }).response ?? data);
    renderWithClient(
      <ProductEditor mode="create" onSubmit={() => undefined} isPending={false} serverErrorMap={serverErrorMap} />,
    );
    expect(screen.getByText('fa.title: Title is required')).toBeTruthy();
    expect(screen.getByText('regular_price: Must be positive')).toBeTruthy();
    expect(screen.getByText('0.media_file: Missing file')).toBeTruthy();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });
});

describe('Category Editor nested errors (BUG-06)', () => {
  it('17. nested validation errors reach the user with field context; failed save stays dirty', () => {
    categoryMutateMock.mockImplementation((_p: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError(nestedCategoryErr),
    );
    const { container } = renderWithClient(<NewCategoryPage />);
    const titleInput = container.querySelectorAll('input')[0] as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'دسته تست' } });
    fireEvent.click(screen.getByText('admin.save'));

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('translations.fa.title: This field is required.');
    expect(alert.textContent).toContain('slug: Category slug already exists.');
    // Failed save keeps the typed value (dirty latch untouched by errors).
    expect(titleInput.value).toBe('دسته تست');
    expect(titleInput.getAttribute('aria-describedby')).toBe('cms-form-errors');
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0][0])).toContain('translations.fa.title');
  });
});
