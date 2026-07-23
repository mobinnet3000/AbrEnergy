import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({ className, count = 1, height = 'h-4', width = 'w-full' }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('animate-pulse rounded-md bg-muted', height, width, className)}
        />
      ))}
    </>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function CardLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
          <LoadingSkeleton height="h-5" width="w-3/4" />
          <LoadingSkeleton count={3} height="h-3" />
        </div>
      ))}
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <LoadingSkeleton height="h-10" />
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} height="h-12" />
      ))}
    </div>
  );
}
