'use client';
import { cn } from '@/lib/utils';

export interface InternalPageShellProps {
  children: React.ReactNode;
  className?: string;
  headerOffset?: boolean;
}

/**
 * Shared shell for non-homepage public pages.
 * Provides the fixed-header offset, lightweight solar background treatment,
 * and consistent theme-aware surface styling.
 */
export function InternalPageShell({
  children,
  className,
  headerOffset = true,
}: InternalPageShellProps) {
  return (
    <div
      className={cn(
        'internal-page-shell',
        headerOffset && 'site-header-offset',
        className
      )}
    >
      <div aria-hidden className="internal-horizon-line" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
