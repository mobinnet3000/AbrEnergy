'use client';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminDashboard } from '@/hooks/use-api';
import { useLocale } from '@/i18n';

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { data: stats, isLoading } = useAdminDashboard();

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!stats) return <div className="py-20 text-center text-muted-foreground">{t('common.no_data')}</div>;

  const cards = [
    { label: t('admin.users'), value: stats.total_users, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    { label: t('admin.articles'), value: stats.total_articles, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    { label: t('admin.projects'), value: stats.total_projects, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    { label: t('admin.services'), value: stats.total_services, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    { label: t('admin.contacts'), value: stats.total_contacts, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
    { label: t('admin.inquiries'), value: stats.total_inquiries, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
    { label: 'Pending ' + t('admin.contacts'), value: stats.pending_contacts, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    { label: 'Pending ' + t('admin.inquiries'), value: stats.pending_inquiries, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  ];

  const productCards = [
    { label: t('admin.total_product_categories'), value: stats.total_product_categories },
    { label: t('admin.total_products'), value: stats.total_products },
    { label: t('admin.published_products'), value: stats.published_products },
    { label: t('admin.draft_products'), value: stats.draft_products },
    { label: t('admin.featured_products'), value: stats.featured_products },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.dashboard')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className={`p-6 ${c.color}`}>
              <p className="text-sm opacity-80">{c.label}</p>
              <p className="text-3xl font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {(stats.total_products != null || stats.total_product_categories != null) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">{t('admin.products_overview')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {productCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                  <p className="text-sm opacity-80">{c.label}</p>
                  <p className="text-3xl font-bold mt-1">{c.value ?? 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
