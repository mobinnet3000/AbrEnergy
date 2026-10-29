import { describe, it, expect } from 'vitest';
import {
  canAccessAdminShell,
  canManageProductCategories,
  canManageProducts,
  canManageHomepage,
  canManageContent,
  canManageContacts,
  canManageInquiries,
  canManageSiteSettings,
  canManageUsers,
  canViewActivityLog,
  isReadOnlyAnalyst,
  canViewAdminItem,
} from '@/lib/admin-permissions';
import { adminNavSections } from '@/config/navigation';

describe('admin permissions (UI shaping only — backend remains authoritative)', () => {
  it('grants shell access to all internal staff roles and denies customers/guests', () => {
    // Phase 12.27: Complete RBAC shell admission
    expect(canAccessAdminShell('super_admin')).toBe(true);
    expect(canAccessAdminShell('website_admin')).toBe(true);
    expect(canAccessAdminShell('content_manager')).toBe(true);
    expect(canAccessAdminShell('product_manager')).toBe(true);
    expect(canAccessAdminShell('support_manager')).toBe(true);
    expect(canAccessAdminShell('seo_manager')).toBe(true);
    expect(canAccessAdminShell('engineer')).toBe(true);
    expect(canAccessAdminShell('analyst')).toBe(true);

    // Public / Customer users are strictly denied admin shell
    expect(canAccessAdminShell('customer')).toBe(false);
    expect(canAccessAdminShell(null)).toBe(false);
    expect(canAccessAdminShell(undefined)).toBe(false);
  });

  it('gates product and category management to authorized roles', () => {
    expect(canManageProductCategories('super_admin')).toBe(true);
    expect(canManageProductCategories('website_admin')).toBe(true);
    expect(canManageProductCategories('product_manager')).toBe(true);
    expect(canManageProductCategories('content_manager')).toBe(true);
    expect(canManageProductCategories('engineer')).toBe(false);
    expect(canManageProductCategories('support_manager')).toBe(false);
    expect(canManageProductCategories('analyst')).toBe(false);
    expect(canManageProductCategories('customer')).toBe(false);

    expect(canManageProducts('product_manager')).toBe(true);
    expect(canManageProducts('customer')).toBe(false);
  });

  it('gates homepage and content to content & seo managers', () => {
    expect(canManageHomepage('super_admin')).toBe(true);
    expect(canManageHomepage('content_manager')).toBe(true);
    expect(canManageHomepage('seo_manager')).toBe(true);
    expect(canManageHomepage('engineer')).toBe(false);
    expect(canManageHomepage('customer')).toBe(false);

    expect(canManageContent('content_manager')).toBe(true);
    expect(canManageContent('customer')).toBe(false);
  });

  it('gates inquiries and contact requests', () => {
    expect(canManageContacts('support_manager')).toBe(true);
    expect(canManageContacts('content_manager')).toBe(false);

    expect(canManageInquiries('support_manager')).toBe(true);
    expect(canManageInquiries('engineer')).toBe(true);
    expect(canManageInquiries('customer')).toBe(false);
  });

  it('gates user and site settings to super_admin only', () => {
    expect(canManageUsers('super_admin')).toBe(true);
    expect(canManageUsers('website_admin')).toBe(false);
    expect(canManageUsers('content_manager')).toBe(false);

    expect(canManageSiteSettings('super_admin')).toBe(true);
    expect(canManageSiteSettings('website_admin')).toBe(false);
    expect(canManageSiteSettings('analyst')).toBe(false);
  });

  it('allows activity log viewing to super_admin, website_admin, and analyst', () => {
    expect(canViewActivityLog('super_admin')).toBe(true);
    expect(canViewActivityLog('website_admin')).toBe(true);
    expect(canViewActivityLog('analyst')).toBe(true);
    expect(canViewActivityLog('content_manager')).toBe(false);
    expect(canViewActivityLog('customer')).toBe(false);

    const activityEntry = adminNavSections
      .flatMap((s) => s.items)
      .find((i) => i.href === '/admin/activity-log');
    expect(activityEntry).toBeDefined();
    expect(canViewAdminItem(activityEntry?.roles, 'analyst')).toBe(true);
    expect(canViewAdminItem(activityEntry?.roles, 'super_admin')).toBe(true);
    expect(canViewAdminItem(activityEntry?.roles, 'website_admin')).toBe(true);
    expect(canViewAdminItem(activityEntry?.roles, 'content_manager')).toBe(false);

    expect(isReadOnlyAnalyst('analyst')).toBe(true);
    expect(isReadOnlyAnalyst('super_admin')).toBe(false);
  });

  it('hides role-restricted nav items (users/activity-log/settings)', () => {
    const restricted = ['super_admin', 'website_admin'] as const;
    expect(canViewAdminItem([...restricted], 'content_manager')).toBe(false);
    expect(canViewAdminItem([...restricted], 'website_admin')).toBe(true);
    expect(canViewAdminItem(undefined, 'customer')).toBe(true);
    expect(canViewAdminItem([...restricted], null)).toBe(false);
  });

  it('Phase 10.1 (E-01/I-01, Option A) — services/projects CMS surfaces stay visible to content_manager', () => {
    // Backend writes for services/projects are gated by IsContentManager, so
    // the CMS UI must keep offering these workflows to content_manager (no
    // admin-only role restriction on the nav entries, shell admitted).
    const entries = adminNavSections.flatMap((s) => s.items);
    for (const href of ['/admin/services', '/admin/projects']) {
      const entry = entries.find((i) => i.href === href);
      expect(entry).toBeDefined();
      expect(entry!.roles).toBeUndefined();
      expect(canViewAdminItem(entry!.roles, 'content_manager')).toBe(true);
    }
    expect(canAccessAdminShell('content_manager')).toBe(true);
  });
});
