'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Images, Loader2, RefreshCw, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue, PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';
import { useAdminMediaList, type MediaPickerItem } from '@/hooks/use-admin-media-list';
import { normalizeApiError, summarizeNormalizedError } from '@/lib/api-errors';
import { useLocale } from '@/i18n';

export type { MediaPickerItem };
export type MediaPickerMode = 'image' | 'document';

export const MEDIA_PICKER_PAGE_SIZE = 20;

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mandatory type gate: maps to `?file_type=` so image slots never see PDFs and vice versa. */
  mode: MediaPickerMode;
  /** `false` (default) = single slot (OG/cover); `true` = gallery/documents multi-select. */
  multiple?: boolean;
  /** Already-attached ids (skipped as duplicates by multi consumers on Apply). */
  selectedIds?: string[];
  /** Fired ONLY on confirm — Cancel/close leaves the parent form untouched (never dirty). */
  onSelect: (items: MediaPickerItem[]) => void;
}

/**
 * Phase 9.5 — ONE reusable media picker (`mode="image" | "document"`).
 *
 * Dialog-based, modal-local state (search/page/selection never touch the
 * URL). Search uses the shared 300 ms `useDebouncedValue`; listing is
 * server-paginated via React Query; every failure renders through the
 * Phase 8.5 `normalizeApiError` path (never `[object Object]`).
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  mode,
  multiple = false,
  selectedIds = [],
  onSelect,
}: MediaPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mounted fresh on every open: modal-local state (search/page/staging)
          initializes from props via useState initializers, so no reset
          effects are needed; closing unmounts and discards everything. */}
      {open && (
        <MediaPickerBody
          mode={mode}
          multiple={multiple}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function MediaPickerBody({
  mode,
  multiple,
  selectedIds,
  onSelect,
  onClose,
}: {
  mode: MediaPickerMode;
  multiple: boolean;
  selectedIds: string[];
  onSelect: (items: MediaPickerItem[]) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  // Phase 8.6: the visible input stays immediate; only the API query waits.
  const debouncedSearch = useDebouncedValue(search, PICKER_SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [staging, setStaging] = useState<string[]>(() => (multiple ? [...selectedIds] : []));
  // Rows seen on any visited page, so Apply can resolve staged ids that are
  // no longer on the current page (multi-select across pages). Ref-only
  // accumulation; closing unmounts and discards it.
  const seenRef = useRef(new Map<string, MediaPickerItem>());
  const trimmed = debouncedSearch.trim();

  const fileType = mode === 'image' ? 'image' : 'document';
  const query = useAdminMediaList({
    file_type: fileType,
    search: trimmed,
    page,
    page_size: MEDIA_PICKER_PAGE_SIZE,
    enabled: true,
  });

  const items = useMemo(() => query.data?.results ?? [], [query.data]);
  useEffect(() => {
    for (const item of items) seenRef.current.set(item.id, item);
  }, [items]);

  const totalCount = query.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / MEDIA_PICKER_PAGE_SIZE));
  const stagedSet = useMemo(() => new Set(staging), [staging]);

  const toggle = (id: string) => {
    setStaging((prev) => {
      if (!multiple) return [id];
      return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  const normalized = query.error ? normalizeApiError(query.error) : null;
  const permissionDenied = normalized?.kind === 'permission';
  const errorSummary = normalized ? summarizeNormalizedError(normalized) : null;

  const handleConfirm = () => {
    const picked = staging
      .map((id) => seenRef.current.get(id))
      .filter((item): item is MediaPickerItem => item !== undefined);
    onSelect(picked);
    onClose();
  };

  const title = mode === 'image' ? t('admin.media_picker_title_image') : t('admin.media_picker_title_document');

  return (
      <DialogContent className="max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('admin.media_picker_hint')}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="h-4 w-4 absolute top-2.5 start-3 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            // New search restarts at page 1 (same rule as the CMS lists).
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('admin.media_picker_search')}
            dir="auto"
            className="ps-9"
            aria-label={t('admin.media_picker_search')}
            autoFocus
          />
        </div>

        {query.isPending && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {!query.isPending && permissionDenied && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm" role="alert">
            {t('admin.permission_denied')}
          </div>
        )}

        {!query.isPending && !permissionDenied && query.isError && (
          <div className="rounded-lg border px-4 py-6 text-center space-y-3" role="alert">
            <p className="text-sm text-destructive">{errorSummary ?? t('admin.failed_load')}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()}>
              <RefreshCw className="h-3.5 w-3.5 me-1" aria-hidden="true" />
              {t('admin.retry')}
            </Button>
          </div>
        )}

        {!query.isPending && !query.isError && items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('admin.media_picker_empty')}</p>
        )}

        {!query.isPending && !query.isError && items.length > 0 && (
          <div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-auto p-1" aria-label={title}>
              {items.map((item) => {
                const selected = stagedSet.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-pressed={selected}
                      aria-label={item.original_name}
                      className={`relative w-full rounded-lg border p-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                        selected ? 'border-primary ring-2 ring-primary/40 bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      {item.file_type === 'image' && item.url ? (
                        <span className="block aspect-video overflow-hidden rounded-md bg-muted/30">
                          <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </span>
                      ) : (
                        <span className="flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-muted/30 px-2">
                          <FileText className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                          <span className="text-[11px] text-muted-foreground">{formatSize(item.file_size)}</span>
                        </span>
                      )}
                      <span className="mt-1 block truncate text-xs font-medium" dir="ltr" title={item.original_name}>
                        {item.original_name}
                      </span>
                      {item.alt_text ? (
                        <span className="block truncate text-[11px] text-muted-foreground" dir="auto">
                          {item.alt_text}
                        </span>
                      ) : null}
                      {selected && (
                        <span className="absolute top-1 end-1 rounded-full bg-primary p-1 text-primary-foreground" aria-hidden="true">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span dir="ltr">
                {page} / {totalPages} · {totalCount}
              </span>
              <span className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || query.isFetching}
                  aria-label={t('common.previous')}
                >
                  <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || query.isFetching}
                  aria-label={t('common.next')}
                >
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                </Button>
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <span className="text-xs text-muted-foreground me-auto" dir="ltr">
            {multiple && staging.length > 0 ? `${staging.length}` : ''}
          </span>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={staging.length === 0}>
            {t('admin.media_picker_select')}
          </Button>
        </DialogFooter>
      </DialogContent>
  );
}

interface ChooseMediaButtonProps {
  mode: MediaPickerMode;
  multiple?: boolean;
  selectedIds?: string[];
  onSelect: (items: MediaPickerItem[]) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Phase 9.5 — additive `[Choose existing]` trigger. Renders beside the
 * existing upload control; the dialog writes back through `onSelect`, so
 * the host form's existing dirty/save path is inherited unchanged.
 */
export function ChooseMediaButton({
  mode,
  multiple = false,
  selectedIds,
  onSelect,
  label,
  disabled = false,
}: ChooseMediaButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
        <Images className="h-3.5 w-3.5 me-1" aria-hidden="true" />
        {label ?? t('admin.media_choose_existing')}
      </Button>
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        multiple={multiple}
        selectedIds={selectedIds}
        onSelect={onSelect}
      />
    </>
  );
}
