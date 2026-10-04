'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader, TableLoading, EmptyState, ErrorState } from '@/components/shared';
import { Plus, Home } from 'lucide-react';
import {
  useAdminProducts,
  useAdminProductCategories,
  useAdminArticles,
  useAdminServices,
  useAdminProjects,
} from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { canManageProducts, canManageProductCategories, canManageHomepage } from '@/lib/admin-permissions';
import { useLocale } from '@/i18n';

// Phase 9.3-B — Admin Dashboard Hub (CMS workflow hub, in place at
// `/[locale]/admin`). Frontend-only: every number and record below comes
// from an EXISTING admin list endpoint (`count` / `results` of the standard
// paginated envelope). No fake statistics, no new backend, no new routes.
//
// Request strategy (10 tiny parallel React Query requests on a cold load):
//   overview  recent-products (page_size 5, doubles as products count)
//           + recent-articles (page_size 5, doubles as articles count)
//           + recent-services (page_size 5, doubles as services count)
//           + categories count (page_size 1) + projects count (page_size 1)
//   attention 5 × page_size-1 filtered counts (draft/hidden products,
//             draft/scheduled articles, inactive services)
//   recent    reuses the 3 overview queries above (zero extra requests)
// Deliberately omitted (documented, not faked): inactive categories (tree
// fetch semantics — a navigation shortcut would add no value beyond the
// overview card) and projects in Recent Items (the backend declares NO
// `ordering_fields` for projects, so no supported recency ordering exists).
// The pre-existing `/admin/dashboard/stats/` aggregate is intentionally NOT
// consumed here: it is `IsSuperAdmin`-only (content/website managers get
// 403), while the list endpoints above are readable by every manager role.

type Row = Record<string, unknown>;

interface Paged {
  count?: number;
  results?: Row[];
}

// Trustworthy total ONLY: the server-computed `count` field. Never
// `results.length` (page_size truncates it) — this is why the category card
// shows the real total, not "100".
function getCount(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Paged;
  if (typeof d.count === 'number') return d.count;
  if (Array.isArray(d.results)) return d.results.length;
  if (Array.isArray(data)) return (data as Row[]).length;
  return null;
}

function getRows(data: unknown): Row[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Paged;
  if (Array.isArray(d.results)) return d.results as Row[];
  if (Array.isArray(data)) return data as Row[];
  return [];
}

function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status;
}

interface Metric {
  label: string;
  href: string;
  count: number | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

// One metric card. Loading / error are per-card so a single failed count
// never breaks the section (or the page).
function MetricCard({ metric }: { metric: Metric }) {
  const { t } = useLocale();
  const st = statusOf(metric.error);
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        {metric.isLoading ? (
          <div className="h-9 w-16 mt-1 animate-pulse rounded bg-muted" aria-label={t('common.loading')} />
        ) : metric.error || metric.count == null ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-bold text-muted-foreground" title={t(st === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}>—</span>
            <Button type="button" variant="ghost" size="sm" onClick={metric.onRetry}>
              {t('admin.try_again')}
            </Button>
          </div>
        ) : (
          <p className="text-3xl font-bold mt-1">{metric.count}</p>
        )}
        <Link href={metric.href} className="mt-2 inline-block text-sm text-primary hover:underline">
          {t('common.view_all')}
        </Link>
      </CardContent>
    </Card>
  );
}

interface RecentItem {
  id: string;
  title: string;
  status: string;
  date: string | null;
  editHref: string;
}

function toRecentItems(rows: Row[], editBase: string, dateKey: string): RecentItem[] {
  return rows
    .filter((r) => typeof r.id === 'string' || typeof r.id === 'number')
    .map((r) => {
      const rawDate = r[dateKey];
      let date: string | null = null;
      if (typeof rawDate === 'string' && rawDate) {
        const d = new Date(rawDate);
        if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString();
      }
      return {
        id: String(r.id),
        title: typeof r.title === 'string' && r.title ? r.title : String(r.id),
        status: typeof r.status === 'string' ? r.status : '',
        date,
        editHref: `${editBase}/${r.id}/edit`,
      };
    });
}

interface RecentGroupProps {
  title: string;
  manageHref: string;
  emptyTitleKey: string;
  emptyActionLabelKey: string | null;
  createHref: string | null;
  items: RecentItem[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  activeValue: string;
}

// One recent-items group. Own loading / error / empty states; a failure
// here isolates to this group — the dashboard keeps rendering.
function RecentGroup(props: RecentGroupProps) {
  const { t } = useLocale();
  const router = useRouter();
  const st = statusOf(props.error);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{props.title}</span>
          <Link href={props.manageHref} className="text-sm font-normal text-primary hover:underline">
            {t('common.view_all')}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {props.isLoading ? (
          <TableLoading rows={3} />
        ) : props.error ? (
          <ErrorState
            title={t(props.emptyTitleKey)}
            message={t(st === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}
            action={{ label: t('admin.try_again'), onClick: props.onRetry }}
          />
        ) : props.items.length === 0 ? (
          <EmptyState
            title={t(props.emptyTitleKey)}
            message=""
            action={
              props.emptyActionLabelKey && props.createHref
                ? { label: t(props.emptyActionLabelKey), onClick: () => { router.push(props.createHref as string); } }
                : undefined
            }
          />
        ) : (
          <ul className="divide-y">
            {props.items.map((it) => (
              <li key={it.id} className="py-2 flex items-center gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <Link href={it.editHref} className="block truncate text-sm font-medium hover:underline" dir="auto">
                    {it.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {it.status && (
                      <Badge variant={it.status === props.activeValue ? 'default' : 'secondary'} className="capitalize">
                        {it.status}
                      </Badge>
                    )}
                    {it.date && <span dir="ltr">{it.date}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canWriteProducts = canManageProducts(role);
  const canWriteCategories = canManageProductCategories(role);
  const canStudio = canManageHomepage(role);
  // Audited: no article/service/project-specific capability helper exists.
  // All three share the manager-role content gate on the list pages (whose
  // create buttons render ungated); the backend stays authoritative, so the
  // existing manager helper shapes this UI. No new permission introduced.
  const canWriteContent = canManageProductCategories(role);

  // Overview + recent share these three queries (page_size 5): `count`
  // feeds the overview card, `results` feeds the recent group.
  const productsRecent = useAdminProducts({ page: '1', page_size: '5', ordering: '-created_at' });
  const articlesRecent = useAdminArticles({ page: '1', page_size: '5', ordering: '-created_at' });
  const servicesRecent = useAdminServices({ page: '1', page_size: '5', ordering: '-created_at' });
  // Supported orderings (audited): products sort_order/created_at,
  // articles publish_date/created_at/view_count, services order/created_at.
  // Projects declares NO `ordering_fields` — it is counted here but never
  // ordered, and is omitted from Recent Items (documented above).
  const categoriesCount = useAdminProductCategories({ page: '1', page_size: '1' });
  const projectsCount = useAdminProjects({ page: '1', page_size: '1' });

  // Needs Attention: one page_size-1 filtered count per card, using ONLY
  // filters the backend views actually declare (audited in 9.2/9.3-A and
  // re-verified here). Each card deep-links to the exact 9.3-A filtered URL.
  const draftProducts = useAdminProducts({ status: 'draft', page: '1', page_size: '1' });
  const hiddenProducts = useAdminProducts({ visibility: 'hidden', page: '1', page_size: '1' });
  const draftArticles = useAdminArticles({ status: 'draft', page: '1', page_size: '1' });
  const scheduledArticles = useAdminArticles({ status: 'scheduled', page: '1', page_size: '1' });
  const inactiveServices = useAdminServices({ status: 'inactive', page: '1', page_size: '1' });

  const quickActions = [
    canWriteProducts && { label: t('admin.create_product'), href: '/admin/products/new', icon: Plus },
    canWriteCategories && { label: t('admin.create_category'), href: '/admin/products/categories/new', icon: Plus },
    canWriteContent && { label: t('admin.create_article'), href: '/admin/articles/new', icon: Plus },
    canWriteContent && { label: t('admin.create_service'), href: '/admin/services/new', icon: Plus },
    canWriteContent && { label: t('admin.create_project'), href: '/admin/projects/new', icon: Plus },
    canStudio && { label: t('admin.homepage_studio'), href: '/admin/content/homepage', icon: Home },
  ].filter((a): a is { label: string; href: string; icon: typeof Plus } => a !== false);

  const overview: Metric[] = [
    { label: t('admin.products'), href: '/admin/products', count: getCount(productsRecent.data), isLoading: productsRecent.isLoading, error: productsRecent.error, onRetry: () => { void productsRecent.refetch(); } },
    { label: t('admin.product_categories'), href: '/admin/products/categories', count: getCount(categoriesCount.data), isLoading: categoriesCount.isLoading, error: categoriesCount.error, onRetry: () => { void categoriesCount.refetch(); } },
    { label: t('admin.articles'), href: '/admin/articles', count: getCount(articlesRecent.data), isLoading: articlesRecent.isLoading, error: articlesRecent.error, onRetry: () => { void articlesRecent.refetch(); } },
    { label: t('admin.services'), href: '/admin/services', count: getCount(servicesRecent.data), isLoading: servicesRecent.isLoading, error: servicesRecent.error, onRetry: () => { void servicesRecent.refetch(); } },
    { label: t('admin.projects'), href: '/admin/projects', count: getCount(projectsCount.data), isLoading: projectsCount.isLoading, error: projectsCount.error, onRetry: () => { void projectsCount.refetch(); } },
  ];

  const attention: Metric[] = [
    { label: `${t('admin.products')} · ${t('admin.status_draft')}`, href: '/admin/products?status=draft', count: getCount(draftProducts.data), isLoading: draftProducts.isLoading, error: draftProducts.error, onRetry: () => { void draftProducts.refetch(); } },
    { label: `${t('admin.products')} · ${t('admin.visibility_hidden')}`, href: '/admin/products?visibility=hidden', count: getCount(hiddenProducts.data), isLoading: hiddenProducts.isLoading, error: hiddenProducts.error, onRetry: () => { void hiddenProducts.refetch(); } },
    { label: `${t('admin.articles')} · ${t('admin.draft')}`, href: '/admin/articles?status=draft', count: getCount(draftArticles.data), isLoading: draftArticles.isLoading, error: draftArticles.error, onRetry: () => { void draftArticles.refetch(); } },
    { label: `${t('admin.articles')} · ${t('admin.scheduled')}`, href: '/admin/articles?status=scheduled', count: getCount(scheduledArticles.data), isLoading: scheduledArticles.isLoading, error: scheduledArticles.error, onRetry: () => { void scheduledArticles.refetch(); } },
    { label: `${t('admin.services')} · ${t('admin.inactive')}`, href: '/admin/services?status=inactive', count: getCount(inactiveServices.data), isLoading: inactiveServices.isLoading, error: inactiveServices.error, onRetry: () => { void inactiveServices.refetch(); } },
  ];

  return (
    <div>
      <PageHeader title={t('admin.dashboard')} />

      {quickActions.length > 0 && (
        <section aria-label={t('admin.quick_actions')} className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t('admin.quick_actions')}</h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((a) => (
              <Button key={a.href} type="button" variant="outline" onClick={() => { router.push(a.href); }}>
                <a.icon className="h-4 w-4 mr-1" aria-hidden="true" /> {a.label}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section aria-label={t('admin.content_overview')} className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('admin.content_overview')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {overview.map((m) => (
            <MetricCard key={m.href + m.label} metric={m} />
          ))}
        </div>
      </section>

      <section aria-label={t('admin.needs_attention')} className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('admin.needs_attention')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {attention.map((m) => (
            <MetricCard key={m.href + m.label} metric={m} />
          ))}
        </div>
      </section>

      <section aria-label={t('admin.recent_items')}>
        <h2 className="text-xl font-bold mb-4">{t('admin.recent_items')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentGroup
            title={t('admin.products')}
            manageHref="/admin/products"
            emptyTitleKey="admin.no_products"
            emptyActionLabelKey={canWriteProducts ? 'admin.create_first_product' : null}
            createHref={canWriteProducts ? '/admin/products/new' : null}
            items={toRecentItems(getRows(productsRecent.data), '/admin/products', 'updated_at')}
            isLoading={productsRecent.isLoading}
            error={productsRecent.error}
            onRetry={() => { void productsRecent.refetch(); }}
            activeValue="published"
          />
          <RecentGroup
            title={t('admin.articles')}
            manageHref="/admin/articles"
            emptyTitleKey="admin.no_articles"
            emptyActionLabelKey={canWriteContent ? 'admin.create_first_article' : null}
            createHref={canWriteContent ? '/admin/articles/new' : null}
            items={toRecentItems(getRows(articlesRecent.data), '/admin/articles', 'created_at')}
            isLoading={articlesRecent.isLoading}
            error={articlesRecent.error}
            onRetry={() => { void articlesRecent.refetch(); }}
            activeValue="published"
          />
          <RecentGroup
            title={t('admin.services')}
            manageHref="/admin/services"
            emptyTitleKey="admin.all_services"
            emptyActionLabelKey={canWriteContent ? 'admin.create_service' : null}
            createHref={canWriteContent ? '/admin/services/new' : null}
            items={toRecentItems(getRows(servicesRecent.data), '/admin/services', 'created_at')}
            isLoading={servicesRecent.isLoading}
            error={servicesRecent.error}
            onRetry={() => { void servicesRecent.refetch(); }}
            activeValue="active"
          />
        </div>
      </section>
    </div>
  );
}
