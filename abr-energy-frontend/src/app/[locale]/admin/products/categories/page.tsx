'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, FolderPlus, ChevronDown, ChevronLeft, ChevronRight,
  Folder, Star, StarOff, Power, PowerOff, MoreHorizontal, Copy, Loader2,
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
  useAdminProductCategories, useUpdateAdminProductCategory, useDeleteAdminProductCategory,
  useDuplicateAdminProductCategory,
} from '@/hooks/use-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  ACTIVE_FILTER_VALUES,
  buildListQuery,
  parseEnumParam,
  parseFeaturedParam,
  parseIdParam,
  parseSearchParam,
} from '@/lib/admin-list-query';
import { useLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { canManageProductCategories } from '@/lib/admin-permissions';
import { normalizeApiError, summarizeNormalizedError } from '@/lib/api-errors';
import type { ProductCategory } from '@/types';
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-tree';

export default function AdminProductCategoriesPage() {
  const { t, isRTL } = useLocale();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = canManageProductCategories(role);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Phase 9.3-A — the URL is the source of truth for the filter state that
  // actually exists on this page (search + active/featured/parent). This list
  // is intentionally a single tree fetch (`page_size=100`, no pager), so no
  // `page` is invented here — a stray `?page=` in the URL is ignored.
  const urlSearch = parseSearchParam(searchParams.get('search'));
  const urlStatus = parseEnumParam(searchParams.get('active'), ACTIVE_FILTER_VALUES) ?? 'all';
  const urlFeatured = parseFeaturedParam(searchParams.get('featured')) ? 'featured' : 'all';
  const urlParent = parseIdParam(searchParams.get('parent')) ?? 'all';

  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [featuredFilter, setFeaturedFilter] = useState(urlFeatured);
  const [parentFilter, setParentFilter] = useState(urlParent);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<ProductCategory | null>(null);
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

  // Phase 9.3-A — URL → state (browser back/forward + external router
  // navigation; refresh/deep-link is covered by the initializers). Guarded
  // per field; never clobbers in-flight typing.
  /* eslint-disable react-hooks/set-state-in-effect -- The address bar is
  external state: adopt its snapshot into local state when navigation changes
  it underneath us. Every setter is a guarded no-op when already equal, so
  this converges without looping; proven by the 9.3-A URL suites. */
  useEffect(() => {
    urlSnapshotRef.current = buildListQuery({
      search: urlSearch,
      active: urlStatus,
      featured: urlFeatured === 'featured',
      parent: urlParent,
    });
    setSearch((p) => (p === urlSearch ? p : urlSearch));
    setStatusFilter((p) => (p === urlStatus ? p : urlStatus));
    setFeaturedFilter((p) => (p === urlFeatured ? p : urlFeatured));
    setParentFilter((p) => (p === urlParent ? p : urlParent));
  }, [urlSearch, urlStatus, urlFeatured, urlParent]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Phase 9.3-A — state → URL via `replace` (no history entry per keystroke
  // or filter change). Canonical-compare on both sides: no navigation loop.
  // The commit waits until the search settles so a stale in-flight debounce
  // can never resurrect a search just left via back/forward navigation.
  const searchSettled = debouncedSearch === search;
  const targetQuery = buildListQuery({
    search: debouncedSearch,
    active: statusFilter,
    featured: featuredFilter === 'featured',
    parent: parentFilter,
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

  // Phase 9.1 — page_size capped to the backend StandardPagination max (100);
  // the previous 200 was silently truncated server-side past 100 rows.
  const params = useMemo(() => {
    const p: Record<string, string> = { page_size: '100' };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter === 'active') p.is_active = 'true';
    if (statusFilter === 'inactive') p.is_active = 'false';
    if (featuredFilter === 'featured') p.is_featured = 'true';
    if (parentFilter !== 'all') p.parent = parentFilter;
    return p;
  }, [debouncedSearch, statusFilter, featuredFilter, parentFilter]);

  const hasFilter = search.trim() !== '' || statusFilter !== 'all' || featuredFilter !== 'all' || parentFilter !== 'all';

  const { data, isLoading, error, refetch } = useAdminProductCategories(params);
  const updateMut = useUpdateAdminProductCategory();
  const deleteMut = useDeleteAdminProductCategory();
  const duplicateMut = useDuplicateAdminProductCategory();

  // Phase 9.4 — node-only duplicate under the same parent (no confirm, no
  // dirty guard). Exactly one POST per click; success navigates to the
  // RETURNED duplicate id's edit page.
  const handleDuplicate = (row: ProductCategory) => {
    if (duplicatingId !== null) return;
    setDuplicatingId(row.id);
    duplicateMut.mutate(row.id, {
      onSuccess: (data: { id: string }) => {
        setDuplicatingId(null);
        toast.success(t('admin.category_duplicated'));
        router.push(`/admin/products/categories/${data.id}/edit`);
      },
      onError: (e: unknown) => {
        setDuplicatingId(null);
        const normalized = normalizeApiError(e);
        if (normalized.kind === 'permission') {
          toast.error(t('admin.permission_denied'));
        } else if (normalized.kind === 'network' || normalized.kind === 'server') {
          toast.error(t('admin.server_connection_failed'));
        } else {
          toast.error(summarizeNormalizedError(normalized) ?? t('admin.category_save_failed'));
        }
      },
    });
  };

  const rows: ProductCategory[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.results) ? data.results : [];
  }, [data]);

  const parents = useMemo(() => rows.filter((r) => !r.parent || !rows.some((x) => x.id === r.parent)), [rows]);
  const tree = useMemo(() => buildCategoryTree(rows), [rows]);

  const patchRow = (id: string, patch: Partial<ProductCategory>) => {
    qc.setQueriesData({ queryKey: ['admin-product-categories'] }, (old: unknown) => {
      if (!old) return old;
      const apply = (list: ProductCategory[]) => list.map((r) => (r.id === id ? { ...r, ...patch } : r));
      if (Array.isArray(old)) return apply(old);
      if (typeof old === 'object' && old !== null && 'results' in old) {
        const o = old as { results: ProductCategory[] };
        return { ...o, results: apply(o.results) };
      }
      return old;
    });
  };

  const toggleField = (row: ProductCategory, field: 'is_active' | 'is_featured') => {
    const next = !row[field];
    patchRow(row.id, { [field]: next });
    updateMut.mutate(
      { id: row.id, data: { [field]: next } },
      {
        onSuccess: () => toast.success(t(field === 'is_active' ? (next ? 'admin.category_activated' : 'admin.category_deactivated') : 'admin.category_updated')),
        onError: () => {
          patchRow(row.id, { [field]: row[field] });
          toast.error(t('admin.category_save_failed'));
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMut.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t('admin.category_deleted'));
        setDeleting(null);
      },
      onError: (e: unknown) => {
        const status = (e as { response?: { status?: number } })?.response?.status;
        toast.error(t(status === 403 ? 'admin.permission_denied' : 'admin.category_save_failed'));
        setDeleting(null);
      },
    });
  };

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div>
        <PageHeader title={t('admin.product_categories')} description={t('admin.category_tree')} />
        <ErrorState
          title={t('admin.failed_load')}
          message={t(status === 403 ? 'admin.permission_denied' : 'admin.server_connection_failed')}
          action={{ label: t('admin.try_again'), onClick: () => refetch() }}
        />
      </div>
    );
  }

  const renderNode = (node: CategoryTreeNode, depth: number): React.ReactNode => {
    const isCollapsed = collapsed.has(node.id);
    const hasKids = node.kids.length > 0;
    const ChevronIcon = hasKids ? ChevronDown : isRTL ? ChevronLeft : ChevronRight;
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2.5 px-3 border-b last:border-0 hover:bg-muted/30 transition-colors"
          style={{ paddingInlineStart: `${0.75 + depth * 1.5}rem` }}
        >
          <button
            type="button"
            onClick={() => setCollapsed((prev) => { const n = new Set(prev); if (n.has(node.id)) n.delete(node.id); else n.add(node.id); return n; })}
            className="p-1 rounded hover:bg-muted shrink-0"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            aria-expanded={!isCollapsed}
            disabled={!hasKids}
          >
            <ChevronIcon className={`h-4 w-4 text-muted-foreground ${isCollapsed ? (isRTL ? 'rotate-90' : '-rotate-90') : ''} ${!hasKids ? 'opacity-30' : ''}`} />
          </button>
          <Folder className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="font-medium flex-1 min-w-0 truncate">{node.title}</span>
          <span className="hidden md:inline text-xs text-muted-foreground shrink-0" dir="ltr">{node.slug}</span>
          <Badge variant={node.is_active ? 'default' : 'secondary'} className="shrink-0">
            {t(node.is_active ? 'admin.active' : 'admin.inactive')}
          </Badge>
          {node.is_featured && (
            <Badge variant="outline" className="shrink-0 gap-1">
              <Star className="h-3 w-3" aria-hidden="true" />{t('admin.featured')}
            </Badge>
          )}
          {canWrite && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button" variant="ghost" size="icon-xs"
                onClick={() => toggleField(node, 'is_active')}
                aria-label={t(node.is_active ? 'admin.inactive' : 'admin.active')}
                title={t(node.is_active ? 'admin.inactive' : 'admin.active')}
              >
                {node.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button" variant="ghost" size="icon-xs"
                onClick={() => toggleField(node, 'is_featured')}
                aria-label={t('admin.featured')}
                title={t('admin.featured')}
              >
                {node.is_featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-xs" />}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => { router.push(`/admin/products/categories/${node.id}/edit`); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />{t('admin.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { router.push(`/admin/products/categories/new?parent=${node.id}`); }}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />{t('admin.add_child')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={duplicatingId === node.id}
                    onClick={() => handleDuplicate(node)}
                  >
                    {duplicatingId === node.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Copy className="h-3.5 w-3.5" />}{t('admin.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleting(node)}>
                    <Trash2 className="h-3.5 w-3.5" />{t('admin.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {!isCollapsed && !hasFilter && node.kids.map((k) => renderNode(k, depth + 1))}
        {!isCollapsed && hasFilter && node.kids.map((k) => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title={t('admin.product_categories')} description={t('admin.category_tree')}>
        {canWrite && (
          <Link href="/admin/products/categories/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="h-4 w-4 me-1" />{t('admin.create_category')}
          </Link>
        )}
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder={t('admin.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              dir="auto"
              aria-label={t('admin.search_placeholder')}
            />
            <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-full" aria-label={t('admin.status')}>
                <SelectValue placeholder={t('admin.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                <SelectItem value="active">{t('admin.filter_active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.filter_inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={(v: string | null) => setFeaturedFilter(v ?? 'all')}>
              <SelectTrigger className="w-full" aria-label={t('admin.featured')}>
                <SelectValue placeholder={t('admin.featured')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.all')}</SelectItem>
                <SelectItem value="featured">{t('admin.filter_featured')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={parentFilter} onValueChange={(v: string | null) => setParentFilter(v ?? 'all')}>
              <SelectTrigger className="w-full" aria-label={t('admin.parent_category')}>
                <SelectValue placeholder={t('admin.parent_category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.all')}</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
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
              title={t('admin.no_product_categories')}
              message=""
              action={canWrite ? { label: t('admin.create_first_category'), onClick: () => { router.push('/admin/products/categories/new'); } } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('admin.category_tree')} ({rows.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {tree.map((n) => renderNode(n, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title={t('admin.delete_category_title')}
        description={t('admin.delete_category_desc')}
        confirmText={t('admin.delete')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDelete}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
