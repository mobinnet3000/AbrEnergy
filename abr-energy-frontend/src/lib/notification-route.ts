/**
 * Normalizes notification destination URLs to ensure safe, localized routing
 * without dead links or broken route parameters.
 */
export function resolveNotificationLink(link: string | null | undefined, locale = 'fa'): string {
  if (!link || typeof link !== 'string' || !link.trim()) {
    return `/${locale}/admin/notifications`;
  }

  let cleaned = link.trim();

  // Rewrite legacy project-inquiry links to real frontend routes
  cleaned = cleaned.replace(/^\/?admin\/project-inquiries\/?/, '/admin/inquiries/');
  cleaned = cleaned.replace(/^\/?[a-z]{2}\/admin\/project-inquiries\/?/, '/admin/inquiries/');

  // Remove duplicate consecutive slashes
  cleaned = cleaned.replace(/\/{2,}/g, '/');

  // If already starts with a locale segment e.g. /fa/...
  const localeMatch = cleaned.match(/^\/([a-z]{2})(\/.*)?$/);
  if (localeMatch) {
    const existingLocale = localeMatch[1];
    const rest = localeMatch[2] || '';
    if (existingLocale === locale) {
      return cleaned;
    }
    return `/${locale}${rest}`;
  }

  // Ensure leading slash
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }

  return `/${locale}${cleaned}`;
}
