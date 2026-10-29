'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbTrailProps {
  trail: Crumb[];
  className?: string;
}

/**
 * Accessible, theme-aware, RTL-ready breadcrumb trail for public pages.
 * In Persian (RTL), ChevronRight with rtl:rotate-180 points forward (leftward)
 * matching natural right-to-left reading flow.
 */
export function BreadcrumbTrail({ trail, className }: BreadcrumbTrailProps) {
  if (!trail || trail.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 rtl:rotate-180"
                  aria-hidden
                />
              )}
              <li className="flex items-center min-w-0">
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="truncate transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary rounded"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn(
                      'truncate',
                      isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
