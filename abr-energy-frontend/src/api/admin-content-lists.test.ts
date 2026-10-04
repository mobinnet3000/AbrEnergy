/**
 * Phase 9.2 — admin content-list API contract.
 *
 * The admin lists must consume the EXISTING `/admin/*` endpoints (same view
 * classes as the public catalog, JWT-authenticated) with only
 * backend-supported query params. The public endpoints are untouched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('@/api/axios', () => ({ default: { get: getMock } }));

import {
  adminArticlesApi,
  adminServicesApi,
  adminProjectsApi,
  articlesApi,
  servicesApi,
  projectsApi,
} from '@/api';

beforeEach(() => {
  getMock.mockReset();
  getMock.mockResolvedValue({ data: { results: [], count: 0 } });
});

describe('admin content-list endpoints (Phase 9.2)', () => {
  it('articles admin list hits /admin/articles/ with the given params', async () => {
    await adminArticlesApi.list({ search: 'solar', status: 'draft', page: '1', page_size: '20' });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/admin/articles/', {
      params: { search: 'solar', status: 'draft', page: '1', page_size: '20' },
    });
  });

  it('services admin list hits /admin/services/ with the given params', async () => {
    await adminServicesApi.list({ search: 'panel', status: 'active', is_featured: 'true', page: '2', page_size: '20' });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/admin/services/', {
      params: { search: 'panel', status: 'active', is_featured: 'true', page: '2', page_size: '20' },
    });
  });

  it('projects admin list hits /admin/projects/ (never the public endpoint)', async () => {
    await adminProjectsApi.list({ search: 'tehran', is_featured: 'true', page: '1', page_size: '20' });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/admin/projects/', {
      params: { search: 'tehran', is_featured: 'true', page: '1', page_size: '20' },
    });
    expect(getMock.mock.calls[0][0]).not.toBe('/projects/');
  });

  it('public catalog endpoints are unchanged (no admin leak into public paths)', async () => {
    await articlesApi.list({ search: 'x' });
    await servicesApi.list();
    await projectsApi.list({ search: 'y' });
    expect(getMock).toHaveBeenCalledWith('/articles/', { params: { search: 'x' } });
    // Parameter-less public services request, byte-identical to before.
    expect(getMock.mock.calls.some((c) => c[0] === '/services/' && c.length === 1)).toBe(true);
    expect(getMock).toHaveBeenCalledWith('/projects/', { params: { search: 'y' } });
  });
});
