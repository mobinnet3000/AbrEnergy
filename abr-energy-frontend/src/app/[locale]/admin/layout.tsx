'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText, Wrench, FolderKanban, MessageSquare,
  Image, Activity, Bell, LogOut, Menu, Package, FolderTree, Tags, Settings,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadCount } from '@/hooks/use-api';
import { PageLoading } from '@/components/shared';
import { useLocale } from '@/i18n';
import { adminNavSections } from '@/config/navigation';
import { canAccessAdminShell, canViewAdminItem } from '@/lib/admin-permissions';

const sectionIcons: Record<string, typeof LayoutDashboard> = {
  '/admin': LayoutDashboard,
  '/admin/users': Users,
  '/admin/articles': FileText,
  '/admin/services': Wrench,
  '/admin/projects': FolderKanban,
  '/admin/contacts': MessageSquare,
  '/admin/inquiries': MessageSquare,
  '/admin/gallery': Image,
  '/admin/media': Image,
  '/admin/categories': FolderTree,
  '/admin/tags': Tags,
  '/admin/products/categories': FolderTree,
  '/admin/products': Package,
  '/admin/content/homepage': Home,
  '/admin/activity-log': Activity,
  '/admin/settings': Settings,
  '/dashboard/notifications': Bell,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: unreadData } = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
    else if (user && !canAccessAdminShell(user.role)) router.replace('/dashboard');
  }, [isAuthenticated, user, router]);

  // Close mobile menu on route change
  const closeMobile = () => setMobileOpen(false);

  if (!user) return <PageLoading />;
  if (!canAccessAdminShell(user.role)) return null;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="font-heading font-bold text-lg">{t('admin.title')}</h2>
        <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto">
        {adminNavSections.map((section, si) => {
          const items = section.items.filter((it) => canViewAdminItem(it.roles, user.role));
          if (items.length === 0) return null;
          return (
            <div key={si}>
              {section.titleKey && (
                <p className="px-3 mb-1 text-xs font-medium text-muted-foreground">{t(section.titleKey)}</p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = sectionIcons[item.href] ?? FileText;
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  const inner = (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {item.labelKey === 'admin.notifications' && unreadData?.count > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unreadData.count}
                        </span>
                      )}
                    </>
                  );
                  const cls = cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    item.disabled && 'opacity-50 cursor-not-allowed',
                  );
                  return item.disabled ? (
                    <span key={item.href + item.labelKey} className={cls} title={t('admin.coming_soon')}>
                      {inner}
                    </span>
                  ) : (
                    <Link key={item.href} href={item.href} onClick={closeMobile} className={cls} aria-current={active ? 'page' : undefined}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="space-y-2 pt-4 border-t">
        <Link href="/dashboard"><Button variant="outline" size="sm" className="w-full">{t('admin.user_dashboard')}</Button></Link>
        <Button type="button" variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => { logout(); window.location.href = '/'; }}>
          <LogOut className="h-4 w-4 mr-2" /> {t('common.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[80vh]">
      {/* Desktop sidebar */}
      <aside className="w-64 border-r bg-sidebar p-4 hidden lg:flex lg:flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar p-4 shadow-xl animate-fade-in">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b">
          <button type="button" onClick={() => setMobileOpen(true)} className="p-1 rounded-md hover:bg-muted transition-colors" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-heading font-semibold">{t('admin.title')}</h2>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
