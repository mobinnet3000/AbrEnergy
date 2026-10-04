'use client';

import Link from 'next/link';

/**
 * Phase 8.2 — shared preview-state indicator. Same visual language as the
 * Phase 8.1 homepage preview banner (amber, sticky, explicit PREVIEW marker
 * + back-to-Studio link) so preview never looks like production content.
 */
export function PreviewBanner({ studioHref, studioLabel }: { studioHref: string; studioLabel: string }) {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black"
    >
      <span>PREVIEW — not public. Links and content reflect saved CMS state including hidden items.</span>
      <Link href={studioHref} className="underline underline-offset-2">
        {studioLabel}
      </Link>
    </div>
  );
}
