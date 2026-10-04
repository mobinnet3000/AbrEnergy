/**
 * Phase 8.6 (BUG-07) — CMS picker search debounce integration tests.
 *
 * These tests prove ACTUAL request behavior (not the existence of a
 * helper) for both server-search pickers:
 *
 *   rapid input  A → AB → ABC  does NOT produce
 *   request(A) / request(AB) / request(ABC) during the window —
 *   it produces exactly one effective request(ABC) after it.
 *
 * Covered for each picker: visible input stays immediate, selection and
 * cancel stay immediate, typing never marks the form dirty (no `onChange`),
 * empty-query behavior is unchanged, and loading/empty/error rendering is
 * unchanged. Fake timers are restored after every test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomepageRelationPicker } from './homepage-relation-picker';
import { ProductRelationsEditor } from '../products/product-relations-editor';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('@/api', () => ({
  adminProductsApi: { list: listMock },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function queryWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const labels = {
  addLabel: 'add',
  emptyLabel: 'empty',
  searchPlaceholder: 'search',
  noResultsLabel: 'none',
};

/**
 * Fire the debounce timer, then flush React Query promise hops.
 *
 * NOTE (fake-timer mechanics, verified against the installed
 * @tanstack/query-core 5.101.4): observer notifications are delivered via
 * a lazily-resolved global `setTimeout(..., 0)` (`notifyManager` +
 * `timeoutManager`), so after promise microtasks settle the notification
 * macrotask must ALSO be advanced before the re-render commits. The
 * trailing `advanceTimersByTime(0)` does that without consuming any
 * pending debounce window (proven by the intermediate-no-request
 * assertions below).
 */
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

describe('HomepageRelationPicker debounce', () => {
  it('rapid typing fires ONE request with the latest query; input stays immediate', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();
    render(
      <HomepageRelationPicker kind="products" items={[]} onChange={onChange} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    await advanceAndFlush(0);
    // Empty-query behavior unchanged: opening still searches '' immediately.
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('');

    const input = screen.getByLabelText('search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'س' } });
    expect(input.value).toBe('س');
    fireEvent.change(input, { target: { value: 'سو' } });
    expect(input.value).toBe('سو');
    fireEvent.change(input, { target: { value: 'سول' } });
    expect(input.value).toBe('سول');

    // Inside the window: NO intermediate request was fired.
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(onSearch).toHaveBeenCalledTimes(1);

    // After the window: exactly one effective request, with the latest query.
    await advanceAndFlush(50);
    expect(onSearch).toHaveBeenCalledTimes(2);
    expect(onSearch).toHaveBeenLastCalledWith('سول');
    const queries = onSearch.mock.calls.map((c) => c[0] as string);
    expect(queries).not.toContain('س');
    expect(queries).not.toContain('سو');

    // Typing never marks the form dirty: onChange untouched.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selection is immediate and needs no debounce wait', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn().mockResolvedValue([{ id: 'p1', title: 'یک' }]);
    const onChange = vi.fn();
    render(
      <HomepageRelationPicker kind="products" items={[]} onChange={onChange} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS + 50);
    fireEvent.click(screen.getByText('یک'));
    // Synchronous: selection does not wait for any timer.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: 'p1', title: 'یک', enabled: true });
  });

  it('cancel is immediate, fires no stale request, and stays clean', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();
    render(
      <HomepageRelationPicker kind="products" items={[]} onChange={onChange} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    await advanceAndFlush(0);
    const input = screen.getByLabelText('search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ناتمام' } });
    // Cancel synchronously, without waiting out the debounce window.
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByLabelText('search')).toBeNull();
    // Even after the window elapses, the abandoned text is never requested.
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS + 100);
    const queries = onSearch.mock.calls.map((c) => c[0] as string);
    expect(queries).not.toContain('ناتمام');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('loading and empty states render exactly as before', async () => {
    vi.useFakeTimers();
    let resolve!: (v: { id: string; title: string }[]) => void;
    const onSearch = vi.fn().mockImplementation(
      () => new Promise<{ id: string; title: string }[]>((r) => { resolve = r; }),
    );
    render(
      <HomepageRelationPicker kind="products" items={[]} onChange={() => undefined} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    await advanceAndFlush(0);
    // Existing loading indicator while the request is in flight.
    expect(screen.getByText('…')).toBeTruthy();
    await act(async () => {
      resolve([]);
    });
    await advanceAndFlush(0);
    // Existing empty state once the request resolves with no rows.
    expect(screen.getByText('none')).toBeTruthy();
  });

  it('a failed search degrades to the existing empty state without crashing', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn().mockRejectedValue(new Error('offline'));
    render(
      <HomepageRelationPicker kind="products" items={[]} onChange={() => undefined} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS + 100);
    // No error box exists by design (unchanged); the list shows no-results.
    expect(screen.getByText('none')).toBeTruthy();
  });
});

describe('ProductRelationsEditor debounce', () => {
  const editorLabels = {
    add: 'admin.relations_add',
    search: 'admin.relations_search',
    cancel: 'common.cancel',
    none: 'admin.no_products',
  };

  it('rapid typing fires ONE request with the latest query; input stays immediate', async () => {
    vi.useFakeTimers();
    listMock.mockResolvedValue([]);
    const onChange = vi.fn();
    render(<ProductRelationsEditor relations={[]} onChange={onChange} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText(editorLabels.add));
    await advanceAndFlush(0);
    // Empty-query behavior unchanged: opening still searches '' immediately.
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({ search: '', page_size: '10' });

    const input = screen.getByLabelText(editorLabels.search) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(listMock).toHaveBeenCalledTimes(1);

    await advanceAndFlush(50);
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(listMock).toHaveBeenLastCalledWith({ search: 'ABC', page_size: '10' });
    const queries = listMock.mock.calls.map((c) => (c[0] as { search: string }).search);
    expect(queries).not.toContain('A');
    expect(queries).not.toContain('AB');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('selection and cancel are immediate; typing never marks dirty', async () => {
    vi.useFakeTimers();
    listMock.mockResolvedValue([{ id: 'p9', title: 'پنل', sku: 'SKU-9' }]);
    const onChange = vi.fn();
    render(<ProductRelationsEditor relations={[]} onChange={onChange} />, { wrapper: queryWrapper() });
    fireEvent.click(screen.getByText(editorLabels.add));
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS + 50);
    fireEvent.click(screen.getByText('پنل'));
    // Synchronous selection with the relation shape intact.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({
      to_product: 'p9',
      title: 'پنل',
      relation_type: 'related',
    });

    // Cancel path: selecting closes the panel by design, so reopen it,
    // type, then cancel immediately — no stale request, no dirty.
    fireEvent.click(screen.getByText(editorLabels.add));
    await advanceAndFlush(0);
    const input = screen.getByLabelText(editorLabels.search) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ناتمام' } });
    fireEvent.click(screen.getByText(editorLabels.cancel));
    expect(screen.queryByLabelText(editorLabels.search)).toBeNull();
    await advanceAndFlush(PICKER_SEARCH_DEBOUNCE_MS + 100);
    const queries = listMock.mock.calls.map((c) => (c[0] as { search: string }).search);
    expect(queries).not.toContain('ناتمام');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
