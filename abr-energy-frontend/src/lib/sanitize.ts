import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4',
      'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'blockquote', 'code', 'pre', 'hr', 'u', 's',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'colspan', 'rowspan', 'id',
    ],
    // URI allowlist: http/https/mailto/tel plus relative URLs, anchors,
    // and fragments. Executable schemes (javascript:, data:, vbscript:, file:)
    // are rejected — DOMPurify's default regexp is intentionally NOT copied
    // verbatim because its generic "any scheme" branch permits javascript:.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
