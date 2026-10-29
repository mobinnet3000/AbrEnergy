'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BreadcrumbTrail, type Crumb } from './breadcrumb-trail';

export interface InternalPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  centered?: boolean;
  className?: string;
  contain?: boolean;
}

/**
 * Standardized header for internal public pages.
 * Supports breadcrumbs, eyebrow/badge, title (H1), description, and action controls.
 */
export function InternalPageHeader({
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
  centered = false,
  className,
  contain = false,
}: InternalPageHeaderProps) {
  const headerContent = (
    <div
      className={cn(
        'relative pb-6 pt-4 sm:pb-8 sm:pt-6 md:pb-10 md:pt-8',
        centered && 'text-center',
        !contain && className
      )}
    >
      <div className={cn('flex flex-col gap-3 sm:gap-4', centered && 'items-center')}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn('w-full', centered && 'flex justify-center')}
          >
            <BreadcrumbTrail trail={breadcrumbs} />
          </motion.div>
        )}

        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {typeof eyebrow === 'string' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </span>
            ) : (
              eyebrow
            )}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={cn(
              'text-sm text-muted-foreground sm:text-base leading-relaxed max-w-2xl',
              centered && 'mx-auto'
            )}
          >
            {subtitle}
          </motion.p>
        )}

        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 flex flex-wrap items-center gap-3"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );

  if (contain) {
    return (
      <div className={cn('container-page relative z-10', className)}>
        {headerContent}
      </div>
    );
  }

  return headerContent;
}
