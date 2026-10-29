import { describe, it, expect } from 'vitest';
import { resolveNotificationLink } from './notification-route';

describe('resolveNotificationLink (Phase 12.21)', () => {
  it('returns default admin notifications route when link is empty or null', () => {
    expect(resolveNotificationLink(null, 'fa')).toBe('/fa/admin/notifications');
    expect(resolveNotificationLink(undefined, 'fa')).toBe('/fa/admin/notifications');
    expect(resolveNotificationLink('', 'fa')).toBe('/fa/admin/notifications');
    expect(resolveNotificationLink('   ', 'fa')).toBe('/fa/admin/notifications');
  });

  it('prefixes relative admin routes with the current locale', () => {
    expect(resolveNotificationLink('/admin/contacts/123-uuid', 'fa')).toBe('/fa/admin/contacts/123-uuid');
    expect(resolveNotificationLink('admin/contacts/123-uuid', 'fa')).toBe('/fa/admin/contacts/123-uuid');
    expect(resolveNotificationLink('/admin/inquiries/456-uuid', 'fa')).toBe('/fa/admin/inquiries/456-uuid');
  });

  it('rewrites legacy project-inquiries destination to inquiries route', () => {
    expect(resolveNotificationLink('/admin/project-inquiries/abc-789', 'fa')).toBe('/fa/admin/inquiries/abc-789');
    expect(resolveNotificationLink('admin/project-inquiries/abc-789', 'fa')).toBe('/fa/admin/inquiries/abc-789');
    expect(resolveNotificationLink('/en/admin/project-inquiries/abc-789', 'fa')).toBe('/fa/admin/inquiries/abc-789');
  });

  it('preserves existing matching locale prefix without duplication', () => {
    expect(resolveNotificationLink('/fa/admin/contacts/xyz', 'fa')).toBe('/fa/admin/contacts/xyz');
  });

  it('replaces mismatched locale prefix with active locale', () => {
    expect(resolveNotificationLink('/en/admin/contacts/xyz', 'fa')).toBe('/fa/admin/contacts/xyz');
  });
});
