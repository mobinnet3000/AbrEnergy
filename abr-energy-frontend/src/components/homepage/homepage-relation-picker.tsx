'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/i18n';
import { homepageFormKey, reorderItems, type HomepageRelationItem } from '@/lib/homepage-form';
import { toast } from 'sonner';

export interface PickerOption {
  id: string;
  title: string;
  subtitle?: string;
}

interface HomepageRelationPickerProps {
  /** Stable query-key suffix identifying the entity kind (e.g. 'products'). */
  kind: string;
  items: HomepageRelationItem[];
  onChange: (items: HomepageRelationItem[]) => void;
  onSearch: (query: string) => Promise<PickerOption[]>;
  addLabel: string;
  emptyLabel: string;
  searchPlaceholder: string;
  noResultsLabel: string;
  errors?: string[];
}

/**
 * Phase 7 — generic curated-relation picker (products, categories,
 * services, projects, articles). Search-as-you-type against the public
 * list endpoints (never bulk-loads), numeric ordering via up/down buttons
 * (no drag-drop dependency), per-row enable toggle. Duplicates are blocked
 * client-side; the backend OneToOne rows enforce them server-side.
 */
export function HomepageRelationPicker({
  kind,
  items,
  onChange,
  onSearch,
  addLabel,
  emptyLabel,
  searchPlaceholder,
  noResultsLabel,
  errors,
}: HomepageRelationPickerProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['homepage-picker', kind, search],
    queryFn: () => onSearch(search.trim()),
    enabled: open,
  });

  const usedIds = new Set(items.map((r) => r.id));

  const add = (opt: PickerOption) => {
    if (usedIds.has(opt.id)) {
      toast.error(t('admin.homepage_duplicate_item'));
      return;
    }
    onChange([
      ...items,
      { key: homepageFormKey('rel'), id: opt.id, title: opt.title, order: items.length, enabled: true },
    ]);
    setOpen(false);
    setSearch('');
  };

  const patch = (key: string, p: Partial<HomepageRelationItem>) => {
    onChange(items.map((r) => (r.key === key ? { ...r, ...p } : r)));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      {items.map((r, i) => (
        <div key={r.key} className="flex items-center gap-2 rounded-lg border bg-muted/10 p-2">
          <span className="text-sm font-medium flex-1 min-w-0 truncate" dir="auto">
            {r.title || <span className="text-muted-foreground" dir="ltr">{r.id.slice(0, 8)}</span>}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={r.enabled}
            onClick={() => patch(r.key, { enabled: !r.enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${r.enabled ? 'bg-primary' : 'bg-input'}`}
            aria-label={t('admin.active')}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${r.enabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
            />
          </button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(reorderItems(items, r.key, -1))} disabled={i === 0} aria-label={t('admin.media_reorder_up')}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(reorderItems(items, r.key, 1))} disabled={i === items.length - 1} aria-label={t('admin.media_reorder_down')}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange(items.filter((x) => x.key !== r.key).map((x, idx) => ({ ...x, order: idx })))}
            aria-label={t('admin.delete')}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      {!open ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 me-1" />
          {addLabel}
        </Button>
      ) : (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute top-2.5 start-3 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              dir="auto"
              className="ps-9"
              aria-label={searchPlaceholder}
              autoFocus
            />
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">…</p>
          ) : (
            <ul className="max-h-48 overflow-auto divide-y rounded-md border">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => add(opt)}
                    disabled={usedIds.has(opt.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-start disabled:opacity-40"
                  >
                    <span className="flex-1 min-w-0 truncate" dir="auto">
                      {opt.title}
                    </span>
                    {opt.subtitle && (
                      <span className="text-xs text-muted-foreground shrink-0" dir="auto">
                        {opt.subtitle}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">{noResultsLabel}</li>
              )}
            </ul>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      )}
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
