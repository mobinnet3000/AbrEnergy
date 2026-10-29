import { normalizeApiError, summarizeNormalizedError } from '@/lib/api-errors';

export function contentSaveErrorMessage(fallback: string, error: unknown): string {
  const summary = summarizeNormalizedError(normalizeApiError(error));
  return summary ? `${fallback}: ${summary}` : fallback;
}
