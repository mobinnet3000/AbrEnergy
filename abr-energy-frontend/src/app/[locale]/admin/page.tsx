'use client';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminDashboard } from '@/hooks/use-api';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboard();

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading dashboard...</div>;
  if (!stats) return <div className="py-20 text-center text-muted-foreground">No data</div>;

  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    { label: 'Articles', value: stats.total_articles, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    { label: 'Projects', value: stats.total_projects, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    { label: 'Services', value: stats.total_services, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    { label: 'Contacts', value: stats.total_contacts, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
    { label: 'Inquiries', value: stats.total_inquiries, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
    { label: 'Pending Contacts', value: stats.pending_contacts, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    { label: 'Pending Inquiries', value: stats.pending_inquiries, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
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
    </div>
  );
}
