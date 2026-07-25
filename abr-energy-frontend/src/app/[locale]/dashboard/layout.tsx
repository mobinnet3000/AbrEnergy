'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { User, Bell, Calculator, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n';

const navItems = [
  { href: '/dashboard/profile', labelKey: 'dashboard.profile', icon: User },
  { href: '/dashboard/notifications', labelKey: 'dashboard.notifications', icon: Bell },
  { href: '/dashboard/calculations', labelKey: 'dashboard.calculations', icon: Calculator },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!user) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="min-h-[80vh] flex flex-col lg:flex-row">
      <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
        <div className="mb-6">
          <h2 className="font-bold text-lg">{t('dashboard.title')}</h2>
          <p className="text-sm text-muted-foreground truncate">{user?.full_name ?? user?.email}</p>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 pt-4 border-t">
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full">{t('dashboard.back_to_site')}</Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-red-500"
            onClick={() => { logout(); window.location.href = '/'; }}
          >
            <LogOut className="h-4 w-4 mr-2" /> {t('common.logout')}
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
