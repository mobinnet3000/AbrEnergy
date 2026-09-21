import { describe, it, expect } from 'vitest';
import {
  canAccessAdminShell,
  canManageProductCategories,
  canViewAdminItem,
} from '@/lib/admin-permissions';

describe('admin permissions (UI shaping only — backend remains authoritative)', () => {
  it('grants shell access to manager roles only', () => {
    expect(canAccessAdminShell('super_admin')).toBe(true);
    expect(canAccessAdminShell('website_admin')).toBe(true);
    expect(canAccessAdminShell('content_manager')).toBe(true);
    expect(canAccessAdminShell('engineer')).toBe(false);
    expect(canAccessAdminShell('customer')).toBe(false);
    expect(canAccessAdminShell(null)).toBe(false);
    expect(canAccessAdminShell(undefined)).toBe(false);
  });

  it('denies category management to non-manager roles (permission denied state)', () => {
    expect(canManageProductCategories('content_manager')).toBe(true);
    expect(canManageProductCategories('engineer')).toBe(false);
    expect(canManageProductCategories('customer')).toBe(false);
  });

  it('hides role-restricted nav items (users/activity-log/settings)', () => {
    const restricted = ['super_admin', 'website_admin'] as const;
    expect(canViewAdminItem([...restricted], 'content_manager')).toBe(false);
    expect(canViewAdminItem([...restricted], 'website_admin')).toBe(true);
    expect(canViewAdminItem(undefined, 'customer')).toBe(true);
    expect(canViewAdminItem([...restricted], null)).toBe(false);
  });
});
