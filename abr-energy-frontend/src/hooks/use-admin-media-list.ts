'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { mediaApi, type MediaListParams } from '@/api';

/** Phase 9.5 — one reusable media row (existing `MediaFileListSerializer` shape). */
export interface MediaPickerItem {
  id: string;
  url: string;
  thumbnail_url: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  subfolder: string;
  uploaded_at: string;
}

export interface AdminMediaListParams extends MediaListParams {
  enabled?: boolean;
}

export interface AdminMediaListResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: MediaPickerItem[];
}

/**
 * Phase 9.5 — server-paginated reusable-media list.
 *
 * Query key `['admin-media', params]`; 30 s `staleTime` matches the app
 * default (`providers.tsx`). `keepPreviousData` keeps the previous page
 * visible while the next one loads. Callers debounce `search` with the
 * shared `useDebouncedValue` (300 ms) so typing never fires one request
 * per keystroke. Modal-local only — never touches the URL.
 */
export function useAdminMediaList({
  file_type,
  search,
  page,
  page_size,
  ordering,
  enabled = true,
}: AdminMediaListParams & { page?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-media', { file_type, search, page, page_size, ordering }],
    queryFn: async (): Promise<AdminMediaListResult> => {
      const data = await mediaApi.list({ file_type, search, page, page_size, ordering });
      const results = Array.isArray(data?.results) ? data.results : [];
      return {
        count: typeof data?.count === 'number' ? data.count : results.length,
        next: data?.next ?? null,
        previous: data?.previous ?? null,
        results,
      };
    },
    enabled,
    staleTime: 30000,
    placeholderData: keepPreviousData,
    // No per-query `retry`: the app provider default (`providers.tsx`)
    // already retries once; tests pin `retry: false` via their client.
  });
}
