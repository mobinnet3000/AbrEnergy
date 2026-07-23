'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 } },
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
