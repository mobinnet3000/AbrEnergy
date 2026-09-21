'use client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaUpload } from '@/components/shared/media-upload';
import { useLocale } from '@/i18n';
import { homepageFormKey, reorderItems, type HomepageVisualItem } from '@/lib/homepage-form';

interface HomepageVisualsEditorProps {
  visuals: HomepageVisualItem[];
  onChange: (visuals: HomepageVisualItem[]) => void;
  errors?: string[];
}

/**
 * Phase 7 — floating-visual manager. Editors pick an image (MediaUpload,
 * `subfolder="homepage"`), alt text, an optional link, order (up/down)
 * and visibility. No pixel-position editor in this phase.
 */
export function HomepageVisualsEditor({ visuals, onChange, errors }: HomepageVisualsEditorProps) {
  const { t } = useLocale();

  const patch = (key: string, p: Partial<HomepageVisualItem>) => {
    onChange(visuals.map((v) => (v.key === key ? { ...v, ...p } : v)));
  };

  return (
    <div className="space-y-3">
      {visuals.length === 0 && <p className="text-sm text-muted-foreground">{t('admin.homepage_visuals_empty')}</p>}
      {visuals.map((v, i) => (
        <div key={v.key} className="rounded-lg border bg-muted/10 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium flex-1" dir="auto">
              {v.alt || t('admin.homepage_visuals_empty')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={v.enabled}
              onClick={() => patch(v.key, { enabled: !v.enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${v.enabled ? 'bg-primary' : 'bg-input'}`}
              aria-label={t('admin.active')}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${v.enabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
              />
            </button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(reorderItems(visuals, v.key, -1))} disabled={i === 0} aria-label={t('admin.media_reorder_up')}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(reorderItems(visuals, v.key, 1))} disabled={i === visuals.length - 1} aria-label={t('admin.media_reorder_down')}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onChange(visuals.filter((x) => x.key !== v.key).map((x, idx) => ({ ...x, order: idx })))}
              aria-label={t('admin.delete')}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <MediaUpload
            subfolder="homepage"
            currentImage={v.image_url}
            onUpload={(url, fid) => patch(v.key, { image_url: url, image: fid || '' })}
            label={t('admin.homepage_visual_image')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.homepage_visual_alt')}</label>
              <Input value={v.alt} onChange={(e) => patch(v.key, { alt: e.target.value })} dir="auto" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.homepage_visual_link')}</label>
              <Input
                value={v.link_url}
                onChange={(e) => patch(v.key, { link_url: e.target.value })}
                dir="ltr"
                placeholder="/products"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...visuals, { key: homepageFormKey('vis'), image: '', image_url: '', alt: '', order: visuals.length, enabled: true, link_url: '' }])}
      >
        <Plus className="h-3.5 w-3.5 me-1" />
        {t('admin.homepage_visuals_add')}
      </Button>
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
