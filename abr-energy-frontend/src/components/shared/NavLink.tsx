'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  scrolled?: boolean;
  onClick?: () => void;
  external?: boolean;
}

export function NavLinkDesktop({ href, isActive, children, className, scrolled }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-300',
        isActive
          ? scrolled
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-white'
          : scrolled
            ? 'text-muted-foreground hover:text-foreground'
            : 'text-white/60 hover:text-white',
        className,
      )}
    >
      {children}
      {isActive && (
        <motion.span
          layoutId="activeNav"
          className={cn(
            'absolute inset-0 rounded-lg -z-10',
            scrolled ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-white/10',
          )}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function NavLinkMobile({ href, isActive, children, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {children}
    </Link>
  );
}
