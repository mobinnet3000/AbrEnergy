/**
 * Phase 5.2 — catalog media URL helper (shared by `next/image` display and
 * SEO metadata). The backend returns media paths such as `/media/...`
 * (relative) or absolute URLs. `next/image` requires resolvable sources and
 * OpenGraph tags require absolute URLs, so relative paths are resolved
 * against the configured API origin. No production domain is hardcoded:
 * everything derives from `NEXT_PUBLIC_API_URL` with a localhost fallback
 * matching `.env.example`.
 */

function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:8000';
  }
}

/**
 * Resolve a backend-supplied media URL to an absolute URL when it is
 * relative (`/media/...`). Absolute http(s) URLs, data URIs, and blobs pass
 * through untouched; empty input yields `""`.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${apiOrigin()}${trimmed}`;
  return `${apiOrigin()}/${trimmed}`;
}

/** Absolute site URL for sitemap/robots/canonical generation (env-driven). */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

/** Backend API base (`.../api/v1`), env-driven with localhost fallback. */
export function apiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
  return raw.replace(/\/+$/, '');
}
