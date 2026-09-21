'use client';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { DOC_TYPE_OPTIONS, formKey, type ProductDocumentFormItem } from '@/lib/product-form';
import { DocumentUpload } from './document-upload';

interface ProductDocumentsManagerProps {
  documents: ProductDocumentFormItem[];
  onChange: (docs: ProductDocumentFormItem[]) => void;
  errors?: string[];
}

/** PDF document manager: upload, title/type/description, active flag, ordering. */
export function ProductDocumentsManager({ documents, onChange, errors }: ProductDocumentsManagerProps) {
  const { t } = useLocale();

  const addDoc = (url: string, fileId?: string, fileName?: string) => {
    if (!fileId) return;
    onChange([
      ...documents,
      {
        key: formKey('doc'),
        media_file: fileId,
        url,
        title: (fileName ?? '').replace(/\.pdf$/i, ''),
        doc_type: 'catalog',
        sort_order: documents.length,
        is_active: true,
        description: '',
        file_name: fileName ?? '',
      },
    ]);
  };

  const patch = (key: string, p: Partial<ProductDocumentFormItem>) => {
    onChange(documents.map((d) => (d.key === key ? { ...d, ...p } : d)));
  };

  const move = (key: string, dir: -1 | 1) => {
    const idx = documents.findIndex((d) => d.key === key);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= documents.length) return;
    const copy = [...documents];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    onChange(copy.map((d, i) => ({ ...d, sort_order: i })));
  };

  const remove = (key: string) => {
    onChange(documents.filter((d) => d.key !== key).map((d, i) => ({ ...d, sort_order: i })));
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.docs_empty')}</p>
      )}
      {documents.map((d, i) => (
        <div key={d.key} className="rounded-lg border p-3 space-y-2 bg-muted/10">
          <DocumentUpload
            currentUrl={d.url}
            fileName={d.file_name || d.title}
            onUpload={(url, fid) => { if (!url && !fid) remove(d.key); }}
            label={t('admin.docs_upload')}
          />
          <Input
            value={d.title}
            onChange={(e) => patch(d.key, { title: e.target.value })}
            placeholder={t('admin.doc_title_field')}
            dir="auto"
            aria-label={t('admin.doc_title_field')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={d.doc_type} onValueChange={(v: string | null) => patch(d.key, { doc_type: v || 'other' })}>
              <SelectTrigger className="w-full" aria-label={t('admin.doc_type_field')}>
                <SelectValue placeholder={t('admin.doc_type_field')} />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{t(`admin.doc_type_${o}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              role="switch"
              aria-checked={d.is_active}
              onClick={() => patch(d.key, { is_active: !d.is_active })}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>{t('admin.active')}</span>
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${d.is_active ? 'bg-primary' : 'bg-input'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${d.is_active ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
              </span>
            </button>
          </div>
          <Textarea
            value={d.description}
            onChange={(e) => patch(d.key, { description: e.target.value })}
            placeholder={t('admin.doc_desc_field')}
            dir="auto"
            rows={2}
            aria-label={t('admin.doc_desc_field')}
          />
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(d.key, -1)} disabled={i === 0} aria-label={t('admin.media_reorder_up')}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(d.key, 1)} disabled={i === documents.length - 1} aria-label={t('admin.media_reorder_down')}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(d.key)} aria-label={t('admin.delete')}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <DocumentUpload onUpload={addDoc} label={t('admin.docs_upload')} />
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
