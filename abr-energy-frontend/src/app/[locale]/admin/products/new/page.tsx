'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductEditor, mapProductErrors, type ProductErrorMap } from '@/components/products/product-editor';
import { useCreateAdminProduct } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import type { ProductFormState, ProductSubmitMode } from '@/components/products/product-editor';
import type { ProductWritePayload } from '@/types';

export default function NewProductPage() {
  const { t } = useLocale();
  const router = useRouter();
  const createMut = useCreateAdminProduct();
  const [serverErrors, setServerErrors] = useState<ProductErrorMap>({});

  const handleSubmit = (payload: ProductWritePayload, _form: ProductFormState, submitMode: ProductSubmitMode) => {
    setServerErrors({});
    createMut.mutate(payload, {
      onSuccess: (created: { id: string }) => {
        toast.success(t('admin.product_created'));
        if (submitMode === 'continue' && created?.id) {
          router.push(`/admin/products/${created.id}/edit`);
        } else {
          router.push('/admin/products');
        }
      },
      onError: (e: unknown) => {
        const data = (e as { response?: { data?: unknown } })?.response?.data;
        const mapped = mapProductErrors(data);
        setServerErrors(mapped);
        if (Object.keys(mapped).length === 0) setServerErrors({ detail: [t('admin.product_save_failed')] });
        else toast.error(t('admin.product_save_failed'));
      },
    });
  };

  return (
    <ProductEditor
      mode="create"
      onSubmit={handleSubmit}
      isPending={createMut.isPending}
      serverErrorMap={serverErrors}
    />
  );
}
