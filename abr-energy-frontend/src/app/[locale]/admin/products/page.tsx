'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Star, StarOff, Power, PowerOff, MoreHorizontal,
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
} from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { canManageProducts } from '@/lib/admin-permissions';
import { formatPrice, priceStateLabelKey } from '@/lib/product-form';
import { ProductStatusBadge, ProductVisibilityBadge } from '@/components/products';
import type { ProductCategory, ProductListItem } from '@/types';

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { t } = useLocale();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = canManageProducts(role);
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [active, setActive] = useState('all');
  const [featured, setFeatured] = useState('all');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), page_size: String(PAGE_SIZE) };
    if (search.trim()) p.search = search.trim();
    if (category !== 'all') p.category = category;
    if (status !== 'all') p.status = status;
    if (visibility !== 'all') p.visibility = visibility;
    if (active === 'active') p.is_active = 'true';
    if (active === 'inactive') p.is_active = 'false';
    if (featured === 'featured') p.is_featured = 'true';
    return p;
  }, [search, category, status, visibility, active, featured, page]);

  const resetPage = (fn: (v: string) => void) => (v: string | null) => { setPage(1); fn(v ?? 'all'); };

  const { data, isLoading, error, refetch } = useAdminProducts(params);
  const { data: catData } = useAdminProductCategories({ page_size: '200' });
  const updateMut = useUpdateAdminProduct();
  const deleteMut = useDeleteAdminProduct();

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
              action={canWrite ? { label: t('admin.create_first_product'), onClick: () => { window.location.href = '/admin/products/new'; } } : undefined}
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
                                <DropdownMenuItem onClick={() => { window.location.href = `/admin/products/${row.id}/edit`; }}>
                                  <Pencil className="h-3.5 w-3.5" />{t('admin.edit')}
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
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  {t('common.previous') ?? '‹'}
                </Button>
                <span className="text-xs text-muted-foreground" dir="ltr">{page} / {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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
