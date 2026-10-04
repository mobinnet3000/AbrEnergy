/**
 * Phase 8.6 (BUG-07) — shared debounce helper unit tests.
 *
 * Proves the timing contract the pickers rely on: the returned value lags
 * `value` by the window, rapid updates collapse to the latest value only,
 * and timers are always cleaned up.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue, PICKER_SEARCH_DEBOUNCE_MS } from './use-debounced-value';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('سلام'));
    expect(result.current).toBe('سلام');
  });

  it('holds the old value inside the window and emits the latest after it', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v), {
      initialProps: { v: '' },
    });
    rerender({ v: 'س' });
    act(() => {
      vi.advanceTimersByTime(PICKER_SEARCH_DEBOUNCE_MS - 50);
    });
    expect(result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('س');
  });

  it('collapses rapid updates to the latest value only', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v), {
      initialProps: { v: '' },
    });
    rerender({ v: 'س' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ v: 'سو' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ v: 'سول' });
    act(() => {
      vi.advanceTimersByTime(PICKER_SEARCH_DEBOUNCE_MS - 1);
    });
    // The intermediate values never surfaced — still the original.
    expect(result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('سول');
  });

  it('respects a custom delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v, 100), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('clears the pending timer on unmount without emitting', () => {
    vi.useFakeTimers();
    const { result, rerender, unmount } = renderHook(({ v }: { v: string }) => useDebouncedValue(v), {
      initialProps: { v: '' },
    });
    rerender({ v: 'ناتمام' });
    unmount();
    act(() => {
      vi.advanceTimersByTime(PICKER_SEARCH_DEBOUNCE_MS + 1000);
    });
    // No crash, no late emission possible after unmount.
    expect(result.current).toBe('');
  });
});
