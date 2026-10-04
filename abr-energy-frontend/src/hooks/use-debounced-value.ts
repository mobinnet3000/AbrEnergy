'use client';
import { useEffect, useState } from 'react';

/** Phase 8.6 (BUG-07) — shared picker-search debounce window (human typing). */
export const PICKER_SEARCH_DEBOUNCE_MS = 300;

/**
 * Returns `value` delayed by `delayMs`: the caller renders `value`
 * immediately (input stays responsive) while side effects (API search
 * requests) consume the debounced copy. Rapid updates restart the window,
 * so only the latest value is ever emitted — intermediate keystrokes never
 * produce a request. Timer is owned by the effect and always cleared.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = PICKER_SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
