import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDirtyNavigationGuard } from './use-dirty-navigation-guard';
import fa from '../../locales/fa.json';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';

afterEach(() => {
  vi.restoreAllMocks();
});

function beforeunloadListeners() {
  const added: EventListener[] = [];
  const removed: EventListener[] = [];
  vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, cb: EventListener) => {
    if (type === 'beforeunload' && cb) added.push(cb);
  }) as typeof window.addEventListener);
  vi.spyOn(window, 'removeEventListener').mockImplementation(((type: string, cb: EventListener) => {
    if (type === 'beforeunload' && cb) removed.push(cb);
  }) as typeof window.removeEventListener);
  return { added, removed };
}

describe('Phase 8.3 dirty navigation guard — SPA navigation', () => {
  it('clean form: navigation proceeds immediately with no dialog', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: false }));
    act(() => {
      result.current.requestNavigation('/admin', navigate);
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.pendingHref).toBeNull();
  });

  it('dirty form: navigation is held and the dialog opens with the destination preserved', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.requestNavigation('/admin/products', navigate);
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.pendingHref).toBe('/admin/products');
  });

  it('Stay cancels navigation and closes the dialog', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.requestNavigation('/admin', navigate);
    });
    expect(result.current.dialogOpen).toBe(true);
    act(() => {
      result.current.confirmStay();
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.pendingHref).toBeNull();
  });

  it('dialog dismiss (onOpenChange false) behaves as Stay', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.requestNavigation('/admin', navigate);
    });
    act(() => {
      result.current.handleDialogOpenChange(false);
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
  });

  it('Leave runs the originally requested destination exactly once', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.requestNavigation('/admin/products/categories', navigate);
    });
    act(() => {
      result.current.confirmLeave();
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.pendingHref).toBeNull();
  });

  it('duplicate rapid attempts yield one dialog; the last destination wins (deterministic)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.requestNavigation('/admin', first);
    });
    act(() => {
      result.current.requestNavigation('/admin/products', second);
    });
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.pendingHref).toBe('/admin/products');
    act(() => {
      result.current.confirmLeave();
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('save-success bypass navigates immediately even from a stale dirty closure', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    act(() => {
      result.current.navigateAfterSave(navigate);
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.dialogOpen).toBe(false);
  });

  it('dirty reset (save cleared isDirty) lets the next navigation proceed without a dialog', () => {
    const navigate = vi.fn();
    const { result, rerender } = renderHook(
      ({ isDirty }: { isDirty: boolean }) => useDirtyNavigationGuard({ isDirty }),
      { initialProps: { isDirty: true } },
    );
    rerender({ isDirty: false }); // simulates setEdits({}) / dirtyResetSignal
    act(() => {
      result.current.requestNavigation('/admin', navigate);
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.dialogOpen).toBe(false);
  });
});

describe('Phase 8.3 dirty navigation guard — Link clicks', () => {
  it('clean form: Link click is untouched (no preventDefault, no dialog)', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: false }));
    const preventDefault = vi.fn();
    act(() => {
      result.current.guardLinkClick({ preventDefault } as unknown as React.MouseEvent, '/admin', navigate);
    });
    expect(preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
  });

  it('dirty form: Link click is intercepted into the single dialog', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    const preventDefault = vi.fn();
    act(() => {
      result.current.guardLinkClick({ preventDefault } as unknown as React.MouseEvent, '/admin', navigate);
    });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.pendingHref).toBe('/admin');
  });
});

describe('Phase 8.3 dirty navigation guard — beforeunload', () => {
  it('attaches no listener while clean', () => {
    const { added } = beforeunloadListeners();
    const { unmount } = renderHook(() => useDirtyNavigationGuard({ isDirty: false }));
    expect(added).toHaveLength(0);
    unmount();
  });

  it('attaches exactly one listener while dirty and removes it on save/unmount', () => {
    const { added, removed } = beforeunloadListeners();
    const { rerender, unmount } = renderHook(
      ({ isDirty }: { isDirty: boolean }) => useDirtyNavigationGuard({ isDirty }),
      { initialProps: { isDirty: true } },
    );
    expect(added).toHaveLength(1);
    rerender({ isDirty: false }); // save cleared dirty
    expect(removed).toHaveLength(1);
    unmount();
    // Unmounting a clean guard must not leak listeners.
    expect(added).toHaveLength(1);
  });

  it('removes the listener on unmount while still dirty (no leak)', () => {
    const { added, removed } = beforeunloadListeners();
    const { unmount } = renderHook(() => useDirtyNavigationGuard({ isDirty: true }));
    expect(added).toHaveLength(1);
    unmount();
    expect(removed).toHaveLength(1);
  });
});

describe('Phase 8.3 dirty navigation guard — locale contract', () => {
  it('provides title/message/stay/leave keys in fa/ar/en', () => {
    for (const [name, bundle] of [['fa', fa], ['ar', ar], ['en', en]] as const) {
      const admin = (bundle as Record<string, Record<string, string>>).admin;
      expect(admin['unsaved_changes_title'], `${name}.admin.unsaved_changes_title`).toBeTruthy();
      expect(admin['unsaved_changes'], `${name}.admin.unsaved_changes`).toBeTruthy();
      expect(admin['unsaved_changes_stay'], `${name}.admin.unsaved_changes_stay`).toBeTruthy();
      expect(admin['unsaved_changes_leave'], `${name}.admin.unsaved_changes_leave`).toBeTruthy();
    }
  });
});
