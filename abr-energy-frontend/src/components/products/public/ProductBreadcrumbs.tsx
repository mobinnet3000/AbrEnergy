'use client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Fragment } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

/** Accessible RTL breadcrumb trail shared by all catalog pages. */
export function ProductBreadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronLeft className="h-4 w-4 shrink-0 text-white/25" aria-hidden />
              )}
              <li className="flex items-center">
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="text-white/45 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-500 rounded"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-white/85' : 'text-white/45'}>
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
