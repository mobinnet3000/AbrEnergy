'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader, TableLoading, EmptyState, ErrorState } from '@/components/shared';
import { Plus, Home, Image as ImageIcon, Settings } from 'lucide-react';
import {
  useAdminProducts,
  useAdminArticles,
  useAdminServices,
  useAdminDashboardOverview,
} from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { canManageProducts, canManageProductCategories, canManageHomepage, canManageSiteSettings } from '@/lib/admin-permissions';
import { useLocale } from '@/i18n';

// Phase 9.3-B — Admin Dashboard Hub (CMS workflow hub, in place at
// `/[locale]/admin`). Every number and record comes from the real API; there
// are no hardcoded statistics and no decorative actions.
//
// Request strategy (4 requests on a cold load, Phase 12.15):
//   recent   3 recent lists (products/articles/services, page_size 5,
//            `-created_at`) — the only list round-trips
//   counts   1 staff-gated aggregate (`/admin/dashboard/overview/`) for
//            overview, attention, content-quality, inventory and status bars
// Deliberately omitted (documented, not faked): inactive categories (tree
// fetch semantics — a navigation shortcut would add no value beyond the
// overview card) and projects in Recent Items (the backend declares NO
// `ordering_fields` for projects, so no supported recency ordering exists).
// The pre-existing `/admin/dashboard/stats/` aggregate is intentionally NOT
// consumed here: it is `IsSuperAdmin`-only (content/website managers get
// 403), while the new overview endpoint is readable by every manager role.
//
// Phase 12.15 adds three real-data sections backed by that aggregate:
// content-quality (products missing image/document/SEO title, articles
// missing a cover), media/documents inventory, and publication-status bars.
// All values are server-side database COUNTs — no demo labels, no hardcoded
// marketing numbers, no client-side fabrication.

type Row = Record<string, unknown>;

interface Paged {
  count?: number;
  results?: Row[];
}

// Trustworthy totals now come from the server aggregate; this helper remains
// for the recent lists (`results` only).
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

interface StatusSegment {
  label: string;
  value: number;
  barClass: string;
}

// Phase 12.15 — publication-status breakdown. Every segment is a real
// server-side COUNT from `/admin/dashboard/overview/`; the bar width is a
// proportion of those exact counts. Zero-content shows an honest empty
// message rather than an empty bar.
function StatusBreakdown({
  label,
  segments,
  isLoading,
  error,
  onRetry,
}: {
  label: string;
  segments: StatusSegment[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const { t } = useLocale();
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const st = statusOf(error);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <TableLoading rows={2} />
        ) : error ? (
          <ErrorState
            title={label}
            message={t(st === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}
            action={{ label: t('admin.try_again'), onClick: onRetry }}
          />
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">{t('admin.show_none')}</p>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={label}>
              {segments.map((s) =>
                s.value > 0 ? (
                  <div key={s.label} className={s.barClass} style={{ width: `${(s.value / total) * 100}%` }} />
                ) : null
              )}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {segments.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.barClass}`} aria-hidden="true" />
                    {s.label}
                  </span>
                  <span className="font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
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
  const canWriteSettings = canManageSiteSettings(role);

  // Phase 12.15 — the three recent lists are the ONLY list requests. All
  // counts (overview, attention, inventory, status bars) come from ONE
  // server-side aggregate, so the dashboard issues 4 requests total instead
  // of the previous 10 list-count round-trips.
  const productsRecent = useAdminProducts({ page: '1', page_size: '5', ordering: '-created_at' });
  const articlesRecent = useAdminArticles({ page: '1', page_size: '5', ordering: '-created_at' });
  const servicesRecent = useAdminServices({ page: '1', page_size: '5', ordering: '-created_at' });
  // Supported orderings (audited): products sort_order/created_at,
  // articles publish_date/created_at/view_count, services order/created_at.
  // Projects declares NO `ordering_fields`, so it never appears in Recent
  // Items — only in the aggregate count/status below.

  // One aggregate for every count. These are plain database COUNTs, readable
  // by every manager role (`IsContentManager`). Missing rows render as "—"
  // + retry per card rather than a fabricated zero.
  const overviewQuery = useAdminDashboardOverview();
  const ov = overviewQuery.data;
  const ovLoading = overviewQuery.isLoading;
  const ovError = overviewQuery.error;
  const ovRetry = () => { void overviewQuery.refetch(); };
  const ovMetric = (label: string, href: string, value: number | undefined): Metric => ({
    label,
    href,
    count: value ?? null,
    isLoading: ovLoading,
    error: ovError,
    onRetry: ovRetry,
  });

  const contentQuality: Metric[] = [
    ovMetric(t('admin.without_image'), '/admin/products', ov?.products.without_image),
    ovMetric(t('admin.without_document'), '/admin/products', ov?.products.without_document),
    ovMetric(t('admin.without_seo_title'), '/admin/products', ov?.products.without_seo_title),
    ovMetric(t('admin.articles_without_cover'), '/admin/articles', ov?.articles.without_cover),
  ];

  const mediaDocuments: Metric[] = [
    ovMetric(t('admin.media_total'), '/admin/media', ov?.media.total),
    ovMetric(t('admin.media_images_count'), '/admin/media', ov?.media.images),
    ovMetric(t('admin.media_documents_count'), '/admin/media', ov?.media.documents),
    ovMetric(t('admin.gallery_images_count'), '/admin/gallery', ov?.gallery.images),
    ovMetric(t('admin.product_documents_count'), '/admin/products', ov?.documents.total),
  ];

  const productStatus: StatusSegment[] = [
    { label: t('admin.status_published'), value: ov?.products.published ?? 0, barClass: 'bg-green-500' },
    { label: t('admin.status_draft'), value: ov?.products.draft ?? 0, barClass: 'bg-amber-500' },
    { label: t('admin.status_archived'), value: ov?.products.archived ?? 0, barClass: 'bg-slate-400' },
  ];

  const articleStatus: StatusSegment[] = [
    { label: t('admin.status_published'), value: ov?.articles.published ?? 0, barClass: 'bg-green-500' },
    { label: t('admin.status_draft'), value: ov?.articles.draft ?? 0, barClass: 'bg-amber-500' },
    { label: t('admin.scheduled'), value: ov?.articles.scheduled ?? 0, barClass: 'bg-sky-500' },
  ];

  const quickActions = [
    canWriteProducts && { label: t('admin.create_product'), href: '/admin/products/new', icon: Plus },
    canWriteCategories && { label: t('admin.create_category'), href: '/admin/products/categories/new', icon: Plus },
    canWriteContent && { label: t('admin.create_article'), href: '/admin/articles/new', icon: Plus },
    canWriteContent && { label: t('admin.create_service'), href: '/admin/services/new', icon: Plus },
    canWriteContent && { label: t('admin.create_project'), href: '/admin/projects/new', icon: Plus },
    canStudio && { label: t('admin.homepage_studio'), href: '/admin/content/homepage', icon: Home },
    canWriteContent && { label: t('admin.media'), href: '/admin/media', icon: ImageIcon },
    canWriteSettings && { label: t('admin.site_settings'), href: '/admin/settings', icon: Settings },
  ].filter((a): a is { label: string; href: string; icon: typeof Plus } => a !== false);

  const overview: Metric[] = [
    ovMetric(t('admin.products'), '/admin/products', ov?.products.total),
    ovMetric(t('admin.product_categories'), '/admin/products/categories', ov?.product_categories.total),
    ovMetric(t('admin.articles'), '/admin/articles', ov?.articles.total),
    ovMetric(t('admin.services'), '/admin/services', ov?.services.total),
    ovMetric(t('admin.projects'), '/admin/projects', ov?.projects.total),
  ];

  // Deep links keep the exact 9.3-A filtered URLs; only the counts moved to
  // the aggregate, so each card still lands on the right filtered list.
  const attention: Metric[] = [
    ovMetric(`${t('admin.products')} · ${t('admin.status_draft')}`, '/admin/products?status=draft', ov?.products.draft),
    ovMetric(`${t('admin.products')} · ${t('admin.visibility_hidden')}`, '/admin/products?visibility=hidden', ov?.products.hidden),
    ovMetric(`${t('admin.articles')} · ${t('admin.draft')}`, '/admin/articles?status=draft', ov?.articles.draft),
    ovMetric(`${t('admin.articles')} · ${t('admin.scheduled')}`, '/admin/articles?status=scheduled', ov?.articles.scheduled),
    ovMetric(`${t('admin.services')} · ${t('admin.inactive')}`, '/admin/services?status=inactive', ov?.services.inactive),
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

      <section aria-label={t('admin.content_quality')} className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('admin.content_quality')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contentQuality.map((m) => (
            <MetricCard key={m.label + m.href} metric={m} />
          ))}
        </div>
      </section>

      <section aria-label={t('admin.media_documents')} className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('admin.media_documents')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {mediaDocuments.map((m) => (
            <MetricCard key={m.label + m.href} metric={m} />
          ))}
        </div>
      </section>

      <section aria-label={t('admin.publication_status')} className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('admin.publication_status')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusBreakdown
            label={t('admin.products')}
            segments={productStatus}
            isLoading={ovLoading}
            error={ovError}
            onRetry={ovRetry}
          />
          <StatusBreakdown
            label={t('admin.articles')}
            segments={articleStatus}
            isLoading={ovLoading}
            error={ovError}
            onRetry={ovRetry}
          />
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
