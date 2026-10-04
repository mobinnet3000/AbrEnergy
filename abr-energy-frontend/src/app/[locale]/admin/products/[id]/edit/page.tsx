'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ProductEditor, mapProductErrors, type ProductErrorMap } from '@/components/products/product-editor';
import { useAdminProduct, useUpdateAdminProduct, useDeleteAdminProduct } from '@/hooks/use-api';
import { previewApi } from '@/api';
import { buildProductPreviewUrl } from '@/lib/preview';
import { useLocale } from '@/i18n';
import type { ProductFormState, ProductSubmitMode } from '@/components/products/product-editor';
import type { ProductDetail, ProductWritePayload } from '@/types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminProduct(id);
  const updateMut = useUpdateAdminProduct();
  const deleteMut = useDeleteAdminProduct();
  const [serverErrors, setServerErrors] = useState<ProductErrorMap>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPreviewIssuing, setIsPreviewIssuing] = useState(false);
  // Phase 8.3 — bumped on Save & Continue success so ProductEditor clears
  // its dirty latch (server state matches the form again).
  const [dirtyResetSignal, setDirtyResetSignal] = useState(0);

  const detail: ProductDetail | null = (data ?? null) as ProductDetail | null;

  const handleSubmit = (payload: ProductWritePayload, _form: ProductFormState, submitMode: ProductSubmitMode) => {
    setServerErrors({});
    updateMut.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          toast.success(t('admin.product_updated'));
          if (submitMode === 'save' || submitMode === 'publish') {
            router.push('/admin/products');
          } else {
            // Save & Continue: dirty is now clean (no prompt from here on);
            // failed saves never reach this branch, so dirty is preserved.
            setDirtyResetSignal((n) => n + 1);
            refetch();
          }
        },
        onError: (e: unknown) => {
          const resp = (e as { response?: { data?: unknown } })?.response?.data;
          const mapped = mapProductErrors(resp);
          setServerErrors(mapped);
          if (Object.keys(mapped).length === 0) setServerErrors({ detail: [t('admin.product_save_failed')] });
          else toast.error(t('admin.product_save_failed'));
        },
      },
    );
  };

  const handleDelete = () => {
    deleteMut.mutate(id, {
      onSuccess: () => {
        toast.success(t('admin.product_deleted'));
        router.push('/admin/products');
      },
      onError: (e: unknown) => {
        const st = (e as { response?: { status?: number } })?.response?.status;
        toast.error(t(st === 403 ? 'admin.permission_denied' : 'admin.product_save_failed'));
        setConfirmDelete(false);
      },
    });
  };

  // Phase 8.2 — saved-state preview: issue a short-lived signed token
  // (IsContentManager only) and open the isolated preview route in a new
  // tab. Unsaved edits are NOT previewed (no draft persistence — save
  // first). Duplicate issuance is blocked while a request is in flight.
  const handlePreview = async () => {
    if (isPreviewIssuing) return;
    setIsPreviewIssuing(true);
    try {
      const res = await previewApi.issue({ resource_type: 'product', resource_id: id, locale: 'fa' });
      window.open(buildProductPreviewUrl(res.token, id, 'fa'), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(t('admin.preview_failed'));
    } finally {
      setIsPreviewIssuing(false);
    }
  };

  return (
    <>
      <ProductEditor
        mode="edit"
        initial={detail}
        isLoading={isLoading}
        loadError={error}
        onRetry={() => refetch()}
        onSubmit={handleSubmit}
        isPending={updateMut.isPending}
        serverErrorMap={serverErrors}
        productId={id}
        onDelete={() => setConfirmDelete(true)}
        isDeleting={deleteMut.isPending}
        onPreview={handlePreview}
        isPreviewIssuing={isPreviewIssuing}
        dirtyResetSignal={dirtyResetSignal}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}
        title={t('admin.delete_product_title')}
        description={`${detail?.title ?? ''} — ${t('admin.delete_product_desc')}`}
        confirmText={t('admin.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
      />
    </>
  );
}
