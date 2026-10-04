'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Phase 8.3 — reusable dirty-navigation guard for CMS editors.
 *
 * Single source of truth stays in the form: the caller passes its EXISTING
 * `isDirty` boolean (initial-vs-current comparison owned by the form). This
 * hook adds NO second dirty-state system — it only:
 *
 * 1. Arms a `beforeunload` listener while `isDirty` is true (browser/tab
 *    refresh/close and full-reload navigations; removed when clean).
 * 2. Holds at most ONE pending internal (SPA) navigation request and the
 *    open/closed state of a single confirmation dialog.
 *
 * App Router note (Next 15): there is no `router.events`-style interception
 * API. All in-page navigations (`router.push/replace`, guarded `<Link>`
 * onClick, Cancel/Back buttons) must be routed through `requestNavigation`.
 * Sidebar/top-shell links and the browser back button live outside the dirty
 * page and are NOT intercepted (documented limitation — no global router or
 * history hack is introduced).
 *
 * Deterministic duplicate policy: if several navigations are requested while
 * the dialog is open, the LAST request wins (pending is replaced, never
 * queued, never duplicated). Stay discards the pending request; Leave runs
 * exactly the stored destination.
 */
export interface PendingNavigation {
  /** Requested destination (for reporting only — never rendered into a URL). */
  href: string;
  /** The exact navigation to run if the user chooses Leave. */
  navigate: () => void;
}

export function useDirtyNavigationGuard({ isDirty }: { isDirty: boolean }) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  // Callbacks read `isDirty` directly (no render-phase ref mirror): every
  // click re-renders first, so the value is fresh. Post-save navigations
  // use `navigateAfterSave`, which never consults `isDirty` — safe even
  // from a stale pre-save closure.

  // ── 1. beforeunload: armed only while dirty, exactly one listener ──
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── 2. SPA navigation requests ──
  const requestNavigation = useCallback(
    (href: string, navigate: () => void) => {
      if (!isDirty) {
        navigate();
        return;
      }
      // Last-wins: a single dialog, a single pending destination.
      setPending({ href, navigate });
    },
    [isDirty],
  );

  /** Guarded `<Link onClick>` helper: `onClick={(e) => guardClick(e, href, () => router.push(href))}`. */
  const guardLinkClick = useCallback(
    (e: React.MouseEvent, href: string, navigate: () => void) => {
      if (!isDirty) return; // clean → default Link behavior
      e.preventDefault();
      setPending({ href, navigate });
    },
    [isDirty],
  );

  /**
   * Post-save / post-delete navigations. The save already cleared the form's
   * dirty state (or deleted the entity), so these must never prompt — even
   * when called from a stale closure that still sees `isDirty === true`.
   */
  const navigateAfterSave = useCallback((navigate: () => void) => {
    setPending(null);
    navigate();
  }, []);

  const confirmLeave = useCallback(() => {
    const target = pending;
    setPending(null);
    target?.navigate();
  }, [pending]);

  const confirmStay = useCallback(() => {
    setPending(null);
  }, []);

  return {
    /** True while the confirmation dialog must be shown. */
    dialogOpen: pending !== null,
    /** Requested destination href (reporting only). */
    pendingHref: pending?.href ?? null,
    requestNavigation,
    guardLinkClick,
    navigateAfterSave,
    /** Leave → run the stored navigation exactly once. */
    confirmLeave,
    /** Stay / dismiss → discard the pending navigation. */
    confirmStay,
    /** Wire directly to the dialog's `onOpenChange` (dismiss == Stay). */
    handleDialogOpenChange: useCallback(
      (open: boolean) => {
        if (!open) setPending(null);
      },
      [],
    ),
  };
}

export type DirtyNavigationGuard = ReturnType<typeof useDirtyNavigationGuard>;
