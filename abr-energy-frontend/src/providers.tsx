'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type { AxiosError } from 'axios';

/**
 * Phase 12.25 — Safe, bounded retry logic for React Query:
 * - Never retries 4xx client errors (particularly 429 Too Many Requests, 401, 403, 404).
 * - Bounded to at most 1 retry for transient 5xx server errors or network disconnects.
 * - Prevents retry storms against throttled DRF endpoints.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  const status = (error as AxiosError)?.response?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: false,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      useAuthStore.getState().initialize();
    }
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthInitializer>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
