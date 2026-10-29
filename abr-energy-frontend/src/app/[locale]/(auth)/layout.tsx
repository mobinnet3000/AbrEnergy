import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-header-offset flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <div className="w-full max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
}
