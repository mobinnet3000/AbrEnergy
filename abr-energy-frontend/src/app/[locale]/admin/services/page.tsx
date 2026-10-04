'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader, TableLoading, EmptyState, ErrorState } from '@/components/shared';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import { useAdminServices } from '@/hooks/use-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  SERVICE_LIST_STATUSES,
  buildListQuery,
  parseEnumParam,
  parseFeaturedParam,
  parsePageParam,
  parseSearchParam,
} from '@/lib/admin-list-query';
import { useLocale } from '@/i18n';

const PAGE_SIZE = 20;

type ServiceRow = Record<string, unknown>;

// Phase 9.2 — services admin list consumes the EXISTING `/admin/services/`
// endpoint (same ServiceListView as the public catalog, JWT-authenticated).
// Only backend-supported params are sent: `search` (translations title /
// short_description), `status` (active/inactive), `is_featured`, `page`,
// `page_size`. `ordering` (order/created_at) and `category` exist server-side
// but have no list UX here (no localized ordering labels / no category picker
// in this slice — documented in the Phase 9.2 report, not faked).
export default function AdminServicesPage() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Phase 9.3-A — the URL is the source of truth for list view state
  // (search + status + featured + page — the only controls this list renders).
  const urlSearch = parseSearchParam(searchParams.get('search'));
  const urlStatus = parseEnumParam(searchParams.get('status'), SERVICE_LIST_STATUSES) ?? 'all';
  const urlFeatured = parseFeaturedParam(searchParams.get('featured')) ? 'featured' : 'all';
  const urlPage = parsePageParam(searchParams.get('page'));

  const [search, setSearch] = useState(urlSearch);
  const [status, setStatus] = useState(urlStatus);
  const [featured, setFeatured] = useState(urlFeatured);
  const [page, setPage] = useState(urlPage);

  // Phase 9.1 pattern (shared Phase 8.6 abstraction): the visible input stays
  // immediate; only the query-driving value is debounced (300 ms).
  const debouncedSearch = useDebouncedValue(search);

  // Canonical snapshot of the live URL (validated parses — never raw
  // `useSearchParams()` object identity, which effects must not depend on).
  // Refreshed in the sync effect; read by the commit effect.
  const urlSnapshotRef = useRef('');

  // Phase 9.3-A — URL → state (back/forward + external navigation; refresh /
  // deep-link is covered by the initializers). Guarded per field.
  /* eslint-disable react-hooks/set-state-in-effect -- The address bar is
  external state: adopt its snapshot into local state when navigation changes
  it underneath us. Every setter is a guarded no-op when already equal, so
  this converges without looping; proven by the 9.3-A URL suites. */
  useEffect(() => {
    urlSnapshotRef.current = buildListQuery({
      search: urlSearch,
      status: urlStatus,
      featured: urlFeatured === 'featured',
      page: urlPage,
    });
    setSearch((p) => (p === urlSearch ? p : urlSearch));
    setStatus((p) => (p === urlStatus ? p : urlStatus));
    setFeatured((p) => (p === urlFeatured ? p : urlFeatured));
    setPage((p) => (p === urlPage ? p : urlPage));
  }, [urlSearch, urlStatus, urlFeatured, urlPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Phase 9.3-A — state → URL via `replace` (pagination uses `push` in
  // goPage). Canonical-compare: no navigation loop. The commit waits until
  // the search settles so a stale in-flight debounce can never resurrect a
  // search just left via back/forward navigation.
  const searchSettled = debouncedSearch === search;
  const targetQuery = buildListQuery({
    search: debouncedSearch,
    status,
    featured: featured === 'featured',
    page,
  });
  // Commit effect: reacts to TARGET changes only — never to the URL itself —
  // so an external navigation (back/forward) can never trigger a commit of
  // pre-sync state in the same commit the sync effect adopts the new URL.
  // Comparing against the canonical snapshot (not the raw URL) also
  // preserves unknown params: they are ignored, never dropped.
  useEffect(() => {
    if (!searchSettled) return;
    if (targetQuery !== urlSnapshotRef.current) {
      router.replace(targetQuery ? `${pathname}?${targetQuery}` : pathname);
    }
  }, [searchSettled, targetQuery, pathname, router]);

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), page_size: String(PAGE_SIZE) };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (status !== 'all') p.status = status;
    if (featured === 'featured') p.is_featured = 'true';
    return p;
  }, [debouncedSearch, status, featured, page]);

  const resetPage = (fn: (v: string) => void) => (v: string | null) => { setPage(1); fn(v ?? 'all'); };

  // Phase 9.3-A — pagination uses `push` so Back returns to the previous page.
  const goPage = (n: number) => {
    setPage(n);
    const q = buildListQuery({
      search: debouncedSearch,
      status,
      featured: featured === 'featured',
      page: n,
    });
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const { data, isLoading, error, refetch } = useAdminServices(params);

  const rows: ServiceRow[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.results) ? data.results : [];
  }, [data]);
  const count: number = typeof data?.count === 'number' ? data.count : rows.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (error) {
    const st = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div>
        <PageHeader title={t('admin.all_services')} />
        <ErrorState
          title={t('admin.failed_load_services')}
          message={t(st === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}
          action={{ label: t('admin.try_again'), onClick: () => refetch() }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('admin.all_services')}>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
        >
          <Plus className="h-4 w-4 mr-1" /> {t('admin.create_service')}
        </Link>
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              placeholder={t('admin.search_placeholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              dir="auto"
              aria-label={t('admin.search_placeholder')}
            />
            <Select value={status} onValueChange={resetPage(setStatus)}>
              <SelectTrigger className="w-full" aria-label={t('admin.filter_status')}>
                <SelectValue placeholder={t('admin.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="active">{t('admin.active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featured} onValueChange={resetPage(setFeatured)}>
              <SelectTrigger className="w-full" aria-label={t('admin.featured')}>
                <SelectValue placeholder={t('admin.featured')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="featured">{t('admin.filter_featured')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableLoading rows={5} />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={t('admin.all_services')}
              message=""
              action={{ label: t('admin.create_service'), onClick: () => { router.push('/admin/services/new'); } }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_services')} ({count})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.title_label')}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.category_field')}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.status')}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.featured')}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.created')}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.title as string}</td>
                      <td className="py-3 px-4 text-muted-foreground">{(s as { category_title?: string }).category_title || '-'}</td>
                      <td className="py-3 px-4"><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status as string}</Badge></td>
                      <td className="py-3 px-4">{s.is_featured ? '✓' : '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(s.created_at as string).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/services/${s.id}/edit`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/services/${s.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8"
                            aria-label="View"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(Math.max(1, page - 1))}>
                  {t('common.previous')}
                </Button>
                <span className="text-xs text-muted-foreground" dir="ltr">{page} / {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(Math.min(totalPages, page + 1))}>
                  {t('common.next')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
