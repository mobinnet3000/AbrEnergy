import { describe, it, expect } from 'vitest';
import { canManageProducts, canManageProductCategories, canAccessAdminShell } from '@/lib/admin-permissions';

describe('product CMS permission gating (UI only — backend authoritative)', () => {
  it('grants product management to manager roles', () => {
    expect(canManageProducts('super_admin')).toBe(true);
    expect(canManageProducts('website_admin')).toBe(true);
    expect(canManageProducts('content_manager')).toBe(true);
  });

  it('denies write actions to customers, engineers and anonymous users', () => {
    expect(canManageProducts('customer')).toBe(false);
    expect(canManageProducts('engineer')).toBe(false);
    expect(canManageProducts(null)).toBe(false);
    expect(canManageProducts(undefined)).toBe(false);
  });

  it('matches the category gate (same backend IsContentManager)', () => {
    const roles = ['super_admin', 'website_admin', 'content_manager', 'engineer', 'customer', null, undefined] as const;
    for (const role of roles) {
      expect(canManageProducts(role)).toBe(canManageProductCategories(role));
    }
  });

  it('keeps the admin shell gate unchanged', () => {
    expect(canAccessAdminShell('content_manager')).toBe(true);
    expect(canAccessAdminShell('customer')).toBe(false);
  });
});
