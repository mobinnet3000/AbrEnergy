'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, PageLoading, ErrorState } from '@/components/shared';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { useLocale } from '@/i18n';
import {
  attachAttributeDefinitions,
  buildProductPayload,
  emptyProductForm,
  mapProductErrors,
  productToForm,
  type ProductErrorMap,
  type ProductFormState,
} from '@/lib/product-form';
import { useAdminProductCategories, useAttributeDefinitions } from '@/hooks/use-api';
import type { ProductAttributeDefinition, ProductCategory, ProductDetail, ProductWritePayload } from '@/types';
import {
  CategorySelector,
  ProductAttributesEditor,
  ProductDocumentsManager,
  ProductMediaManager,
  ProductPriceEditor,
  ProductPublishPanel,
  ProductRelationsEditor,
  ProductSeoFields,
  ProductSpecificationsEditor,
  ProductStatusBadge,
  ProductVisibilityBadge,
} from './index';

export type ProductSubmitMode = 'save' | 'continue' | 'publish';

interface ProductEditorProps {
  mode: 'create' | 'edit';
  initial?: ProductDetail | null;
  isLoading?: boolean;
  loadError?: unknown;
  onRetry?: () => void;
  onSubmit: (payload: ProductWritePayload, form: ProductFormState, submitMode: ProductSubmitMode) => void;
  isPending: boolean;
  serverErrorMap?: ProductErrorMap;
  productId?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
  backHref?: string;
}

function SectionErrors({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="text-sm text-destructive space-y-1 pt-2" role="alert">
      {errors.map((e, i) => <li key={i}>{e}</li>)}
    </ul>
  );
}

/** Product Studio editor — shared by create and edit pages. */
export function ProductEditor({
  mode, initial, isLoading, loadError, onRetry, onSubmit, isPending,
  serverErrorMap, productId, onDelete, isDeleting, backHref = '/admin/products',
}: ProductEditorProps) {
  const { t } = useLocale();
  // Phase 3 `initial + edits` pattern: no set-state-in-effect. The merged form
  // is derived each render; only user edits live in state.
  const baseForm = useMemo(
    () => (mode === 'edit' && initial ? productToForm(initial) : emptyProductForm()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode === 'edit' ? initial : null],
  );
  const [edits, setEdits] = useState<Partial<ProductFormState>>({});
  const merged: ProductFormState = useMemo(() => ({ ...baseForm, ...edits }), [baseForm, edits]);
  const [dirty, setDirty] = useState(false);
  const [localErrors, setLocalErrors] = useState<ProductErrorMap>({});

  const set = <K extends keyof ProductFormState>(key: K, val: ProductFormState[K]) => {
    setEdits((p) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const { data: catData } = useAdminProductCategories({ page_size: '200' });
  const categories: ProductCategory[] = useMemo(() => {
    if (!catData) return [];
    if (Array.isArray(catData)) return catData;
    return Array.isArray(catData?.results) ? catData.results : [];
  }, [catData]);

  const { data: defsData, isLoading: defsLoading } = useAttributeDefinitions({ page_size: '200', is_active: 'true' });
  const allDefinitions: ProductAttributeDefinition[] = useMemo(() => {
    if (!defsData) return [];
    if (Array.isArray(defsData)) return defsData;
    return Array.isArray(defsData?.results) ? defsData.results : [];
  }, [defsData]);

  // Definitions scoped to the selected category + global ones.
  const definitions = useMemo(
    () => allDefinitions.filter((d) => !d.category || (merged.category && d.category === merged.category)),
    [allDefinitions, merged.category],
  );

  // Attribute rows are derived (never stored back in an effect):
  // 1. attach definition ids to hydrated rows via value codes once defs load;
  // 2. hide rows whose definition left the scope after a category change
  //    (switching back restores them; submit drops out-of-scope rows).
  const attributes = useMemo(() => {
    let rows = merged.attributes;
    if (
      rows.length > 0 &&
      rows.every((r) => !r.definition) &&
      allDefinitions.length > 0 &&
      initial
    ) {
      rows = attachAttributeDefinitions(rows, initial.attribute_values ?? [], allDefinitions);
    }
    const scope = new Set(definitions.map((d) => d.id));
    return rows.filter((r) => !r.definition || scope.has(r.definition));
  }, [merged.attributes, allDefinitions, definitions, initial]);

  const form: ProductFormState = useMemo(() => ({ ...merged, attributes }), [merged, attributes]);

  const errors: ProductErrorMap = useMemo(
    () => ({ ...localErrors, ...(serverErrorMap ?? {}) }),
    [localErrors, serverErrorMap],
  );

  const submit = (submitMode: ProductSubmitMode) => {
    const next: ProductErrorMap = {};
    if (!form.title.trim()) next.identity = [...(next.identity ?? []), `${t('admin.title_fa_product')}: ${t('admin.field_required_detail')}`];
    if (!form.sku.trim()) next.identity = [...(next.identity ?? []), `SKU: ${t('admin.field_required_detail')}`];
    setLocalErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(t('admin.form_errors_present'));
      return;
    }
    const working: ProductFormState = submitMode === 'publish' ? { ...form, status: 'published' } : form;
    onSubmit(buildProductPayload(working), working, submitMode);
  };

  if (mode === 'edit' && isLoading) return <PageLoading />;
  if (mode === 'edit' && loadError) {
    return (
      <div>
        <PageHeader title={t('admin.edit_product')} description="" />
        <ErrorState
          title={t('admin.failed_load')}
          message={t('admin.server_connection_failed')}
          action={onRetry ? { label: t('admin.try_again'), onClick: onRetry } : undefined}
        />
      </div>
    );
  }

  const effectivePreview = initial && 'price' in initial
    ? (initial as { price?: { state?: string; final_price?: string | null; regular_price?: string | null } }).price ?? null
    : null;

  return (
    <div>
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 ms-0 me-2 rtl:rotate-180" />{t('admin.back_to_products')}
      </Link>
      <PageHeader
        title={mode === 'create' ? t('admin.create_product') : (initial?.title || t('admin.edit_product'))}
        description={mode === 'create' ? t('admin.product_identity') : ''}
      >
        <div className="flex items-center gap-2">
          {mode === 'edit' && initial && (
            <>
              <ProductStatusBadge status={initial.status} />
              <ProductVisibilityBadge visibility={initial.visibility} />
            </>
          )}
          {mode === 'edit' && onDelete && (
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 me-1" />{t('admin.delete')}
            </Button>
          )}
        </div>
      </PageHeader>

      {errors.detail && errors.detail.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <SectionErrors errors={errors.detail} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader><CardTitle>{t('admin.product_identity')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.title_fa_product')} *</label>
                  <Input value={form.title} onChange={(e) => set('title', e.target.value)} dir="auto" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SKU *</label>
                  <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.slug_field')}</label>
                  <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} dir="ltr" />
                  <p className="text-xs text-muted-foreground mt-1">{t('admin.slug_hint')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.category_field')}</label>
                  <CategorySelector categories={categories} value={form.category} onChange={(id) => set('category', id)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.short_desc_fa_product')}</label>
                <Textarea value={form.short_description} onChange={(e) => set('short_description', e.target.value)} dir="auto" rows={2} />
              </div>
              <SectionErrors errors={errors.identity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.product_content')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.description_fa')}</label>
                <RichTextEditor content={form.description} onChange={(html) => set('description', html)} dir="rtl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.features_fa')}</label>
                <RichTextEditor content={form.features} onChange={(html) => set('features', html)} dir="rtl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.product_media')}</CardTitle></CardHeader>
            <CardContent>
              <ProductMediaManager images={form.images} onChange={(images) => set('images', images)} errors={errors.media} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.docs_title')}</CardTitle></CardHeader>
            <CardContent>
              <ProductDocumentsManager documents={form.documents} onChange={(documents) => set('documents', documents)} errors={errors.documents} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.product_specs')}</CardTitle></CardHeader>
            <CardContent>
              <ProductSpecificationsEditor specs={form.specs} onChange={(specs) => set('specs', specs)} errors={errors.specs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.product_attributes')}</CardTitle></CardHeader>
            <CardContent>
              <ProductAttributesEditor
                categoryId={form.category}
                definitions={definitions}
                defsLoading={defsLoading}
                rows={form.attributes}
                onChange={(attributes) => set('attributes', attributes)}
                errors={errors.attributes}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.product_relations')}</CardTitle></CardHeader>
            <CardContent>
              <ProductRelationsEditor
                currentProductId={productId}
                relations={form.relations}
                onChange={(relations) => set('relations', relations)}
                errors={errors.relations}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.seo_section')}</CardTitle></CardHeader>
            <CardContent>
              <ProductSeoFields form={form} set={set} originalSlug={mode === 'edit' ? initial?.slug : undefined} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4">
          <Card>
            <CardHeader><CardTitle>{t('admin.product_publishing')}</CardTitle></CardHeader>
            <CardContent>
              <ProductPublishPanel form={form} set={set} categories={categories} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('admin.product_pricing')}</CardTitle></CardHeader>
            <CardContent>
              <ProductPriceEditor
                price={form.price}
                onChange={(price) => set('price', price)}
                effective={effectivePreview}
                errors={errors.price}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 mt-6 -mx-4 md:-mx-8 px-4 md:px-8 flex justify-end gap-3 z-10 flex-wrap">
        <Button type="button" variant="outline" onClick={() => { window.location.href = backHref; }}>
          {t('common.cancel')}
        </Button>
        {form.status !== 'published' && (
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => submit('publish')}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}{t('admin.save_publish')}
          </Button>
        )}
        <Button type="button" variant="outline" disabled={isPending} onClick={() => submit('continue')}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}{t('admin.save_continue')}
        </Button>
        <Button type="button" disabled={isPending} onClick={() => submit('save')}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}{t('admin.save')}
        </Button>
      </div>
    </div>
  );
}

export { mapProductErrors };
export type { ProductErrorMap, ProductFormState };
