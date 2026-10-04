import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomepageStudioPage from '@/app/[locale]/admin/content/homepage/page';
import { useAuthStore } from '@/stores/auth-store';
import type { HomepageAdminPayload } from '@/types';
import type { User } from '@/types';
import fa from '../../../locales/fa.json';
import ar from '../../../locales/ar.json';
import en from '../../../locales/en.json';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/shared/media-upload', () => ({
  MediaUpload: ({ label }: { label: string }) => <div>{label}</div>,
}));

const refetchMock = vi.fn();
const mutateMock = vi.fn();

// Controllable save-pending flag: proves Save-disabled !== read-only.
const updateState = { isPending: false };

vi.mock('@/hooks/use-api', () => ({
  useAdminHomepage: () => ({ data: adminPayload, isLoading: false, error: null, refetch: refetchMock }),
  useUpdateAdminHomepage: () => ({ mutate: mutateMock, isPending: updateState.isPending }),
  usePublicProductCategories: () => ({ data: [] }),
  useServices: () => ({ data: [] }),
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
    { key: 'contact', enabled: true, order: 80, title: 'contact-title', subtitle: '', content: '' },
  ],
  featured_products: [],
  categories: [],
  services: [],
  projects: [],
  articles: [],
  visuals: [],
};

function setRole(role: User['role'] | null) {
  if (!role) {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    return;
  }
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'cms@example.com',
      phone_number: '',
      full_name: 'CMS User',
      role,
      avatar: null,
      bio: '',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    isAuthenticated: true,
  });
}

function renderStudio() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <HomepageStudioPage />
    </QueryClientProvider>,
  );
}

function eyebrowInput() {
  // NOTE (Phase 8.4): `*ByDisplayValue` proved non-deterministic against the
  // Base UI input primitive in this jsdom setup (identical back-to-back
  // `queryAll`/`getAll` calls disagreed), so locate the control
  // deterministically by its live `value` property instead. Role/text
  // queries below remain testing-library based and are stable.
  // `startsWith` keeps working after the tests edit the value.
  const el = Array.from(document.querySelectorAll('fieldset input')).find((n) =>
    (n as HTMLInputElement).value.startsWith('eyebrow'),
  );
  if (!el) throw new Error('eyebrow input not found');
  return el as HTMLInputElement;
}

beforeEach(() => {
  pushMock.mockClear();
  refetchMock.mockClear();
  mutateMock.mockReset();
  mutateMock.mockImplementation(() => undefined);
  updateState.isPending = false;
});

afterEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe('Phase 8.4 read-only UX — permission-gated Studio (BUG-05)', () => {
  it('non-manager role sees a read-only notice (not color-only: icon + text)', () => {
    setRole('engineer');
    renderStudio();
    const notice = screen.getByRole('note');
    expect(notice.getAttribute('id')).toBe('homepage-readonly-notice');
    expect(within(notice).getByText('admin.readonly_notice_title')).toBeTruthy();
    expect(within(notice).getByText('admin.readonly_notice_desc')).toBeTruthy();
  });

  it('non-manager role: form controls are semantically disabled via fieldset', () => {
    setRole('engineer');
    const { container } = renderStudio();
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).toBeTruthy();
    expect(fieldset?.hasAttribute('disabled')).toBe(true);
    expect(fieldset?.getAttribute('aria-describedby')).toBe('homepage-readonly-notice');
    // Spot-check a real input: it lives inside the disabled fieldset, so the
    // browser natively blocks focus/input (jsdom does not propagate
    // fieldset-disabled to the `disabled` IDL, so assert the wiring, not the
    // IDL), and it keeps the disabled visual treatment (never looks editable).
    const input = eyebrowInput();
    expect(input.closest('fieldset')?.hasAttribute('disabled')).toBe(true);
    expect(input.className).toContain('disabled:opacity-50');
  });

  it('non-manager role: Save actions disabled but Cancel stays enabled (leaving always works)', () => {
    setRole('customer');
    renderStudio();
    expect((screen.getByText('admin.save_continue').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('common.save').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('common.cancel').closest('button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('read-only switches expose a disabled visual affordance (not editable-looking)', () => {
    setRole('engineer');
    const { container } = renderStudio();
    const switches = Array.from(container.querySelectorAll('button[role="switch"]'));
    expect(switches.length).toBeGreaterThan(0);
    for (const sw of switches) {
      expect(sw.className).toContain('disabled:opacity-50');
      expect(sw.className).toContain('disabled:cursor-not-allowed');
    }
  });

  it('read-only form cannot become dirty: Cancel navigates immediately with no prompt', () => {
    setRole('engineer');
    renderStudio();
    fireEvent.click(screen.getByText('common.cancel').closest('button') as HTMLButtonElement);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin');
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
  });

  it('manager role: no notice, fieldset enabled, inputs editable', () => {
    setRole('content_manager');
    const { container } = renderStudio();
    expect(screen.queryByRole('note')).toBeNull();
    expect(container.querySelector('fieldset')?.hasAttribute('disabled')).toBe(false);
    expect(eyebrowInput().disabled).toBe(false);
  });

  it('manager role: editing a field works and makes the form dirty (guard prompts)', () => {
    setRole('content_manager');
    renderStudio();
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    expect(eyebrowInput().value).toBe('eyebrow-edited');
    fireEvent.click(screen.getByText('common.cancel').closest('button') as HTMLButtonElement);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('dirty guard still works end-to-end: Leave proceeds, Stay cancels', () => {
    setRole('content_manager');
    renderStudio();
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    fireEvent.click(screen.getByText('common.cancel').closest('button') as HTMLButtonElement);
    // Leave → originally requested destination runs exactly once.
    fireEvent.click(screen.getByText('admin.unsaved_changes_leave'));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  it('Save-disabled (request in flight) does NOT make editable fields read-only', () => {
    setRole('content_manager');
    updateState.isPending = true;
    renderStudio();
    // Buttons reflect the pending request…
    expect((screen.getByText('admin.save_continue').closest('button') as HTMLButtonElement).disabled).toBe(true);
    // …but editable inputs stay enabled.
    expect(eyebrowInput().disabled).toBe(false);
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-still-editable' } });
    expect(eyebrowInput().value).toBe('eyebrow-still-editable');
  });

  it('failed save preserves dirty state (Cancel still prompts)', () => {
    setRole('content_manager');
    mutateMock.mockImplementation((_payload, opts: { onError?: (e: unknown) => void }) => {
      opts.onError?.({ response: { data: { errors: { hero_eyebrow: ['bad'] } } } });
    });
    renderStudio();
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    fireEvent.click(screen.getByText('admin.save_continue').closest('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('common.cancel').closest('button') as HTMLButtonElement);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('admin.unsaved_changes_title')).toBeTruthy();
  });

  it('Save & Continue success clears dirty state (Cancel navigates clean)', () => {
    setRole('content_manager');
    mutateMock.mockImplementation((_payload, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });
    renderStudio();
    fireEvent.change(eyebrowInput(), { target: { value: 'eyebrow-edited' } });
    fireEvent.click(screen.getByText('admin.save_continue').closest('button') as HTMLButtonElement);
    expect(refetchMock).toHaveBeenCalled();
    fireEvent.click(screen.getByText('common.cancel').closest('button') as HTMLButtonElement);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  it('accessibility: switches keep label/checked semantics in both modes', () => {
    setRole('engineer');
    const { unmount } = renderStudio();
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    for (const sw of switches) {
      expect(sw.getAttribute('aria-checked')).toMatch(/^(true|false)$/);
      expect(sw.getAttribute('aria-label')).toBeTruthy();
    }
    unmount();
    setRole('content_manager');
    renderStudio();
    for (const sw of screen.getAllByRole('switch')) {
      expect(sw.getAttribute('aria-checked')).toMatch(/^(true|false)$/);
      expect(sw.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('fa/ar/en parity for the new read-only keys (no locale activation)', () => {
    for (const [name, bundle] of [['fa', fa], ['ar', ar], ['en', en]] as const) {
      const admin = (bundle as Record<string, Record<string, string>>).admin;
      expect(admin.readonly_notice_title, `${name}.admin.readonly_notice_title`).toBeTruthy();
      expect(admin.readonly_notice_desc, `${name}.admin.readonly_notice_desc`).toBeTruthy();
    }
  });
});
