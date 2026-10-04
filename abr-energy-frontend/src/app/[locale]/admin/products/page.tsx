'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Star, StarOff, Power, PowerOff, MoreHorizontal, Copy, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PageHeader, TableLoading, EmptyState, ErrorState } from '@/components/shared';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useAdminProducts, useUpdateAdminProduct, useDeleteAdminProduct, useAdminProductCategories,
  useDuplicateAdminProduct,
} from '@/hooks/use-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  ACTIVE_FILTER_VALUES,
  PRODUCT_LIST_STATUSES,
  PRODUCT_LIST_VISIBILITY,
  buildListQuery,
  parseEnumParam,
  parseFeaturedParam,
  parseIdParam,
  parsePageParam,
  parseSearchParam,
} from '@/lib/admin-list-query';
import { useLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { canManageProducts } from '@/lib/admin-permissions';
import { normalizeApiError, summarizeNormalizedError } from '@/lib/api-errors';
import { formatPrice, priceStateLabelKey } from '@/lib/product-form';
import { ProductStatusBadge, ProductVisibilityBadge } from '@/components/products';
import type { ProductCategory, ProductListItem } from '@/types';

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { t } = useLocale();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = canManageProducts(role);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Phase 9.3-A — the URL is the source of truth for list view state. The
  // values below are parsed once per render from the live search params
  // (invalid values fail safely: bad page → 1, unknown enum → 'all').
  const urlSearch = parseSearchParam(searchParams.get('search'));
  const urlCategory = parseIdParam(searchParams.get('category')) ?? 'all';
  const urlStatus = parseEnumParam(searchParams.get('status'), PRODUCT_LIST_STATUSES) ?? 'all';
  const urlVisibility = parseEnumParam(searchParams.get('visibility'), PRODUCT_LIST_VISIBILITY) ?? 'all';
  const urlActive = parseEnumParam(searchParams.get('active'), ACTIVE_FILTER_VALUES) ?? 'all';
  const urlFeatured = parseFeaturedParam(searchParams.get('featured')) ? 'featured' : 'all';
  const urlPage = parsePageParam(searchParams.get('page'));

  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState(urlCategory);
  const [status, setStatus] = useState(urlStatus);
  const [visibility, setVisibility] = useState(urlVisibility);
  const [active, setActive] = useState(urlActive);
  const [featured, setFeatured] = useState(urlFeatured);
  const [page, setPage] = useState(urlPage);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);
  // Phase 9.4 — id of the row with an in-flight duplicate request (per-item
  // pending state; the item is disabled while set, blocking double-submit).
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Phase 9.1 — the visible input stays immediate; only the query-driving
  // value is debounced (shared Phase 8.6 abstraction, 300 ms).
  const debouncedSearch = useDebouncedValue(search);

  // Canonical snapshot of the live URL (validated parses — never raw
  // `useSearchParams()` object identity, which effects must not depend on).
  // Refreshed in the sync effect; read by the commit effect.
  const urlSnapshotRef = useRef('');

  // Phase 9.3-A — URL → state: refresh/deep-link is covered by the
  // initializers above; this covers browser back/forward and any router
  // navigation landing here with a different query. Guarded per field, so it
  // only runs when a parsed URL value actually changes and never clobbers
  // in-flight typing (typing does not touch the URL until the debounce
  // effect below commits it).
  /* eslint-disable react-hooks/set-state-in-effect -- The address bar is
  external state: adopt its snapshot into local state when navigation changes
  it underneath us. Every setter is a guarded no-op when already equal, so
  this converges without looping; proven by the 9.3-A URL suites. */
  useEffect(() => {
    urlSnapshotRef.current = buildListQuery({
      search: urlSearch,
      category: urlCategory,
      status: urlStatus,
      visibility: urlVisibility,
      active: urlActive,
      featured: urlFeatured === 'featured',
      page: urlPage,
    });
    setSearch((p) => (p === urlSearch ? p : urlSearch));
    setCategory((p) => (p === urlCategory ? p : urlCategory));
    setStatus((p) => (p === urlStatus ? p : urlStatus));
    setVisibility((p) => (p === urlVisibility ? p : urlVisibility));
    setActive((p) => (p === urlActive ? p : urlActive));
    setFeatured((p) => (p === urlFeatured ? p : urlFeatured));
    setPage((p) => (p === urlPage ? p : urlPage));
  }, [urlSearch, urlCategory, urlStatus, urlVisibility, urlActive, urlFeatured, urlPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Phase 9.3-A — state → URL: reflect the debounced search + filters + page
  // with `replace` (never a history entry per keystroke; pagination uses
  // `push` in goPage). Both sides are canonically serialized so param
  // ordering or unknown params can never cause a navigation loop. The commit
  // waits until the search settles (`debouncedSearch === search`) so a stale
  // in-flight debounce can never resurrect a search the user just left via
  // back/forward navigation.
  const searchSettled = debouncedSearch === search;
  const targetQuery = buildListQuery({
    search: debouncedSearch,
    category,
    status,
    visibility,
    active,
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
    if (category !== 'all') p.category = category;
    if (status !== 'all') p.status = status;
    if (visibility !== 'all') p.visibility = visibility;
    if (active === 'active') p.is_active = 'true';
    if (active === 'inactive') p.is_active = 'false';
    if (featured === 'featured') p.is_featured = 'true';
    return p;
  }, [debouncedSearch, category, status, visibility, active, featured, page]);

  const resetPage = (fn: (v: string) => void) => (v: string | null) => { setPage(1); fn(v ?? 'all'); };

  // Phase 9.3-A — pagination is a meaningful navigation step, so it uses
  // `push` (Back returns to the previous page). Search/filter changes stay on
  // `replace` via the sync effect above.
  const goPage = (n: number) => {
    setPage(n);
    const q = buildListQuery({
      search: debouncedSearch,
      category,
      status,
      visibility,
      active,
      featured: featured === 'featured',
      page: n,
    });
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const { data, isLoading, error, refetch } = useAdminProducts(params);
  const { data: catData } = useAdminProductCategories({ page_size: '100' });
  const updateMut = useUpdateAdminProduct();
  const deleteMut = useDeleteAdminProduct();
  const duplicateMut = useDuplicateAdminProduct();

  // Phase 9.4 — duplicate is a non-destructive create: no confirmation, no
  // dirty guard (list pages own none). Exactly one POST per click; success
  // navigates to the RETURNED duplicate id's edit page.
  const handleDuplicate = (row: ProductListItem) => {
    if (duplicatingId !== null) return;
    setDuplicatingId(row.id);
    duplicateMut.mutate(row.id, {
      onSuccess: (data: { id: string }) => {
        setDuplicatingId(null);
        toast.success(t('admin.product_duplicated'));
        router.push(`/admin/products/${data.id}/edit`);
      },
      onError: (e: unknown) => {
        setDuplicatingId(null);
        const normalized = normalizeApiError(e);
        if (normalized.kind === 'permission') {
          toast.error(t('admin.permission_denied'));
        } else if (normalized.kind === 'network' || normalized.kind === 'server') {
          toast.error(t('admin.server_connection_failed'));
        } else {
          toast.error(summarizeNormalizedError(normalized) ?? t('admin.product_save_failed'));
        }
      },
    });
  };

  const rows: ProductListItem[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.results) ? data.results : [];
  }, [data]);
  const count: number = typeof data?.count === 'number' ? data.count : rows.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const categories: ProductCategory[] = useMemo(() => {
    if (!catData) return [];
    if (Array.isArray(catData)) return catData;
    return Array.isArray(catData?.results) ? catData.results : [];
  }, [catData]);
  const catTitle = useMemo(() => new Map(categories.map((c) => [c.id, c.title])), [categories]);

  const patchRow = (id: string, patch: Partial<ProductListItem>) => {
    qc.setQueriesData({ queryKey: ['admin-products'] }, (old: unknown) => {
      if (!old) return old;
      const apply = (list: ProductListItem[]) => list.map((r) => (r.id === id ? { ...r, ...patch } : r));
      if (Array.isArray(old)) return apply(old);
      if (typeof old === 'object' && old !== null && 'results' in old) {
        const o = old as { results: ProductListItem[] };
        return { ...o, results: apply(o.results) };
      }
      return old;
    });
  };

  const toggleField = (row: ProductListItem, field: 'is_active' | 'is_featured') => {
    const next = !row[field];
    patchRow(row.id, { [field]: next });
    updateMut.mutate(
      { id: row.id, data: { [field]: next } },
      {
        onSuccess: () => {
          const key = field === 'is_active'
            ? next ? 'admin.product_activated' : 'admin.product_deactivated'
            : next ? 'admin.product_featured_on' : 'admin.product_featured_off';
          toast.success(t(key));
        },
        onError: () => {
          patchRow(row.id, { [field]: row[field] });
          toast.error(t('admin.product_save_failed'));
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMut.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t('admin.product_deleted'));
        setDeleting(null);
      },
      onError: (e: unknown) => {
        const st = (e as { response?: { status?: number } })?.response?.status;
        toast.error(t(st === 403 ? 'admin.permission_denied' : 'admin.product_save_failed'));
        setDeleting(null);
      },
    });
  };

  if (error) {
    const st = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div>
        <PageHeader title={t('admin.all_products')} description={t('admin.products_list')} />
        <ErrorState
          title={t('admin.failed_load')}
          message={t(st === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}
          action={{ label: t('admin.try_again'), onClick: () => refetch() }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('admin.all_products')} description={t('admin.products_list')}>
        {canWrite && (
          <Link href="/admin/products/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="h-4 w-4 me-1" />{t('admin.create_product')}
          </Link>
        )}
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Input
              placeholder={t('admin.search_products')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              dir="auto"
              aria-label={t('admin.search_products')}
            />
            <Select value={category} onValueChange={resetPage(setCategory)}>
              <SelectTrigger className="w-full" aria-label={t('admin.category_field')}>
                <SelectValue placeholder={t('admin.category_field')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={resetPage(setStatus)}>
              <SelectTrigger className="w-full" aria-label={t('admin.filter_status')}>
                <SelectValue placeholder={t('admin.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="draft">{t('admin.status_draft')}</SelectItem>
                <SelectItem value="published">{t('admin.status_published')}</SelectItem>
                <SelectItem value="archived">{t('admin.status_archived')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibility} onValueChange={resetPage(setVisibility)}>
              <SelectTrigger className="w-full" aria-label={t('admin.filter_visibility')}>
                <SelectValue placeholder={t('admin.filter_visibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="public">{t('admin.visibility_public')}</SelectItem>
                <SelectItem value="hidden">{t('admin.visibility_hidden')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={active} onValueChange={resetPage(setActive)}>
              <SelectTrigger className="w-full" aria-label={t('admin.filter_active_state')}>
                <SelectValue placeholder={t('admin.filter_active_state')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="active">{t('admin.filter_active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.filter_inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featured} onValueChange={resetPage(setFeatured)}>
              <SelectTrigger className="w-full" aria-label={t('admin.filter_featured_state')}>
                <SelectValue placeholder={t('admin.filter_featured_state')} />
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
        <TableLoading rows={8} />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={t('admin.no_products')}
              message=""
              action={canWrite ? { label: t('admin.create_first_product'), onClick: () => { router.push('/admin/products/new'); } } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('admin.products_list')} ({count})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-start font-medium px-3 py-2">{t('admin.title_fa_product')}</th>
                    <th className="text-start font-medium px-3 py-2">SKU</th>
                    <th className="text-start font-medium px-3 py-2">{t('admin.category_field')}</th>
                    <th className="text-start font-medium px-3 py-2">{t('admin.table_status')}</th>
                    <th className="text-start font-medium px-3 py-2">{t('admin.table_price')}</th>
                    <th className="text-start font-medium px-3 py-2">{t('admin.table_updated')}</th>
                    <th className="text-start font-medium px-3 py-2">{t('admin.table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {row.cover_image_url ? (
                            <img src={row.cover_image_url} alt="" className="h-10 w-10 rounded-md object-cover border shrink-0" loading="lazy" />
                          ) : (
                            <span className="h-10 w-10 rounded-md border bg-muted/30 shrink-0 inline-block" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[220px]" dir="auto">{row.title}</div>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <ProductVisibilityBadge visibility={row.visibility} />
                              {!row.is_active && <Badge variant="secondary">{t('admin.inactive')}</Badge>}
                              {row.is_featured && <Badge variant="outline"><Star className="h-3 w-3" aria-hidden="true" />{t('admin.featured')}</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground" dir="ltr">{row.sku}</td>
                      <td className="px-3 py-2 text-xs max-w-[140px] truncate" dir="auto">
                        {row.category ? (catTitle.get(row.category) ?? '…') : <span className="text-muted-foreground">{t('admin.no_category')}</span>}
                      </td>
                      <td className="px-3 py-2"><ProductStatusBadge status={row.status} /></td>
                      <td className="px-3 py-2">
                        {row.price?.state === 'discounted' ? (
                          <div className="text-xs space-y-0.5">
                            <div className="text-muted-foreground"><s dir="ltr">{formatPrice(row.price.regular_price)}</s></div>
                            <div className="font-semibold" dir="ltr">{formatPrice(row.price.final_price)}</div>
                          </div>
                        ) : row.price?.final_price ? (
                          <span className="text-xs font-medium" dir="ltr">{formatPrice(row.price.final_price)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t(priceStateLabelKey(row.price?.state))}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {canWrite ? (
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon-xs" onClick={() => toggleField(row, 'is_active')} aria-label={t(row.is_active ? 'admin.deactivate' : 'admin.activate')} title={t(row.is_active ? 'admin.deactivate' : 'admin.activate')}>
                              {row.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                            </Button>
                            <Button type="button" variant="ghost" size="icon-xs" onClick={() => toggleField(row, 'is_featured')} aria-label={t(row.is_featured ? 'admin.unfeature' : 'admin.feature')} title={t(row.is_featured ? 'admin.unfeature' : 'admin.feature')}>
                              {row.is_featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-xs" />}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { router.push(`/admin/products/${row.id}/edit`); }}>
                                  <Pencil className="h-3.5 w-3.5" />{t('admin.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={duplicatingId === row.id}
                                  onClick={() => handleDuplicate(row)}
                                >
                                  {duplicatingId === row.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Copy className="h-3.5 w-3.5" />}{t('admin.duplicate')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row)}>
                                  <Trash2 className="h-3.5 w-3.5" />{t('admin.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-3 border-t">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(Math.max(1, page - 1))}>
                  {t('common.previous') ?? '‹'}
                </Button>
                <span className="text-xs text-muted-foreground" dir="ltr">{page} / {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(Math.min(totalPages, page + 1))}>
                  {t('common.next') ?? '›'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title={t('admin.delete_product_title')}
        description={`${deleting?.title ?? ''} — ${t('admin.delete_product_desc')}`}
        confirmText={t('admin.delete')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDelete}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
