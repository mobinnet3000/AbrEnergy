import axiosInstance from './axios';
import type {
  User, LoginResponse, RegisterInput, LoginInput,
} from '@/types';

export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const res = await axiosInstance.post('/auth/login/', data);
    return res.data;
  },

  register: async (data: RegisterInput): Promise<LoginResponse> => {
    const res = await axiosInstance.post('/auth/register/', data);
    return res.data;
  },

  logout: async (refresh: string): Promise<void> => {
    await axiosInstance.post('/auth/logout/', { refresh });
  },

  refresh: async (refresh: string): Promise<{ access: string; refresh?: string }> => {
    const res = await axiosInstance.post('/auth/refresh/', { refresh });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await axiosInstance.get('/users/me/');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await axiosInstance.patch('/users/me/', data);
    return res.data;
  },

  changePassword: async (old_password: string, new_password: string): Promise<void> => {
    await axiosInstance.post('/auth/password-change/', { old_password, new_password });
  },
};

export const articlesApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/articles/', { params });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await axiosInstance.get(`/articles/${slug}/`);
    return res.data;
  },
  getCategories: async () => {
    const res = await axiosInstance.get('/categories/');
    return res.data;
  },
  getTags: async () => {
    const res = await axiosInstance.get('/tags/');
    return res.data;
  },
};

export const servicesApi = {
  list: async () => {
    const res = await axiosInstance.get('/services/');
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await axiosInstance.get(`/services/${slug}/`);
    return res.data;
  },
};

export const projectsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/projects/', { params });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await axiosInstance.get(`/projects/${slug}/`);
    return res.data;
  },
  getFeatured: async () => {
    const res = await axiosInstance.get('/projects/featured/');
    return res.data;
  },
};

export const calculatorApi = {
  calculate: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/calculator/off-grid/', data);
    return res.data;
  },
  getHistory: async () => {
    const res = await axiosInstance.get('/calculator/history/');
    return res.data;
  },
};

export const contactApi = {
  submit: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/contact/', data);
    return res.data;
  },
  submitInquiry: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/project-inquiry/', data);
    return res.data;
  },
};

export const siteApi = {
  getSettings: async () => {
    const res = await axiosInstance.get('/site-config/');
    return res.data;
  },
};

export const galleryApi = {
  list: async (categorySlug?: string) => {
    const url = categorySlug ? `/gallery/${categorySlug}/` : '/gallery/';
    const res = await axiosInstance.get(url);
    return res.data;
  },
  listAdminImages: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/gallery/images/', { params });
    return res.data;
  },
  createAdminImage: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/admin/gallery/images/', data);
    return res.data;
  },
  updateAdminImage: async (id: string, data: Record<string, unknown>) => {
    const res = await axiosInstance.patch(`/admin/gallery/images/${id}/`, data);
    return res.data;
  },
  deleteAdminImage: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/gallery/images/${id}/`);
    return res.data;
  },
  getCategories: async () => {
    const res = await axiosInstance.get('/admin/gallery/categories/');
    return res.data;
  },
};

export const notificationsApi = {
  list: async () => {
    const res = await axiosInstance.get('/notifications/');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await axiosInstance.get('/notifications/unread-count/');
    return res.data;
  },
  markRead: async (id: string) => {
    await axiosInstance.patch(`/notifications/${id}/read/`);
  },
  markAllRead: async () => {
    await axiosInstance.patch('/notifications/read-all/');
  },
  delete: async (id: string) => {
    await axiosInstance.delete(`/notifications/${id}/`);
  },
};

export const publicDocumentsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/products/documents/', { params });
    return res.data;
  },
};

export const productsApi = {
  listCategories: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/product-categories/', { params });
    return res.data;
  },
  getCategory: async (slug: string) => {
    const res = await axiosInstance.get(`/product-categories/${slug}/`);
    return res.data;
  },
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/products/', { params });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await axiosInstance.get(`/products/${slug}/`);
    return res.data;
  },
  getFeatured: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/products/featured/', { params });
    return res.data;
  },
};

export const adminProductCategoriesApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/product-categories/', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await axiosInstance.get(`/admin/product-categories/${id}/`);
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/admin/product-categories/', data);
    return res.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await axiosInstance.patch(`/admin/product-categories/${id}/`, data);
    return res.data;
  },
  remove: async (id: string) => {
    await axiosInstance.delete(`/admin/product-categories/${id}/`);
  },
  // Phase 9.4 — server-side node-only duplicate (same parent). The server
  // generates SKU/slugs/titles; the body carries no overrides.
  duplicate: async (id: string) => {
    const res = await axiosInstance.post(`/admin/product-categories/${id}/duplicate/`, {});
    return res.data;
  },
};

export const adminProductsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/products/', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await axiosInstance.get(`/admin/products/${id}/`);
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.post('/admin/products/', data);
    return res.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await axiosInstance.patch(`/admin/products/${id}/`, data);
    return res.data;
  },
  remove: async (id: string) => {
    await axiosInstance.delete(`/admin/products/${id}/`);
  },
  // Phase 9.4 — server-side duplicate (draft/hidden/inactive copy). The
  // server generates SKU/slugs/titles; the body carries no overrides.
  duplicate: async (id: string) => {
    const res = await axiosInstance.post(`/admin/products/${id}/duplicate/`, {});
    return res.data;
  },
};

// ── Phase 9.2 — admin content lists (Articles / Services / Projects) ─────
// These consume the EXISTING `/admin/*` endpoints (same view classes as the
// public catalog, JWT-authenticated). Only backend-supported query params
// are ever passed (search / status / is_featured / page / page_size /
// ordering where the view declares it). Public `articlesApi` /
// `servicesApi` / `projectsApi` are untouched.
export const adminArticlesApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/articles/', { params });
    return res.data;
  },
};

export const adminServicesApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/services/', { params });
    return res.data;
  },
};

export const adminProjectsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/projects/', { params });
    return res.data;
  },
};

export const adminAttributeDefinitionsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/product-categories/attributes/', { params });
    return res.data;
  },
};

export const homepageApi = {
  get: async () => {
    const res = await axiosInstance.get('/homepage/');
    return res.data;
  },
};

export const adminHomepageApi = {
  get: async () => {
    const res = await axiosInstance.get('/admin/homepage/');
    return res.data;
  },
  update: async (data: Record<string, unknown>) => {
    const res = await axiosInstance.patch('/admin/homepage/', data);
    return res.data;
  },
};

// ── Phase 8.1 — token-gated preview (saved-but-hidden only) ──────────────
// Issue requires IsContentManager JWT (Bearer interceptor). Consume uses the
// signed token itself (`?token=...`, no auth needed, `no-store` server-side).
export const previewApi = {
  issue: async (data: { resource_type: string; resource_id?: string; locale?: string }) => {
    const res = await axiosInstance.post('/admin/homepage/preview-tokens/', data);
    return res.data as import('@/types').PreviewTokenIssueResponse;
  },
  getHomepagePreview: async (token: string) => {
    const res = await axiosInstance.get('/admin/homepage/preview/', { params: { token } });
    return res.data as import('@/types').HomepagePayload;
  },
  getProductPreview: async (id: string, token: string) => {
    const res = await axiosInstance.get(`/admin/products/${id}/preview/`, { params: { token } });
    return res.data as import('@/types').ProductDetail;
  },
  getCategoryPreview: async (id: string, token: string) => {
    const res = await axiosInstance.get(`/admin/product-categories/${id}/preview/`, { params: { token } });
    return res.data as import('@/types').ProductCategoryDetail;
  },
};

// ── Phase 9.5 — reusable media discovery (reference-based reuse) ────────
// Read-only browse over the EXISTING `/media/` endpoints (same
// `MediaFileListSerializer` shape the CMS already consumes). Uploads keep
// using `/media/upload/` directly; no new upload path, no delete here.
export interface MediaListParams {
  file_type?: 'image' | 'document';
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export const mediaApi = {
  list: async (params?: MediaListParams) => {
    const res = await axiosInstance.get('/media/', {
      params: Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
      ),
    });
    return res.data;
  },
  retrieve: async (id: string) => {
    const res = await axiosInstance.get(`/media/${id}/`);
    return res.data;
  },
  update: async (id: string, data: { alt_text?: string; subfolder?: string }) => {
    const res = await axiosInstance.patch(`/media/${id}/`, data);
    return res.data;
  },
  upload: async (formData: FormData) => {
    const res = await axiosInstance.post('/media/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// Phase 12.15 — staff-gated aggregate counts for the CMS dashboard. Every
// value is a real database COUNT computed server-side (see
// `apps/core/api/v1/views/site.py::dashboard_overview`); no demo metric.
export interface DashboardOverview {
  products: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    hidden: number;
    featured: number;
    without_image: number;
    without_document: number;
    without_seo_title: number;
  };
  product_categories: { total: number; active: number; inactive: number };
  articles: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    without_cover: number;
  };
  services: { total: number; active: number; inactive: number };
  projects: { total: number; featured: number };
  gallery: { images: number; images_active: number; categories: number };
  media: { total: number; images: number; documents: number };
  documents: { total: number };
  generated_at: string;
}

export const adminApi = {
  getDashboard: async () => {
    const res = await axiosInstance.get('/admin/dashboard/stats/');
    return res.data;
  },
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const res = await axiosInstance.get('/admin/dashboard/overview/');
    return res.data;
  },
  getUsers: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/users/', { params });
    return res.data;
  },
  createUser: async (data: { email: string; password: string; full_name: string; phone_number?: string; role?: string; is_active?: boolean }) => {
    const res = await axiosInstance.post('/admin/users/', data);
    return res.data;
  },
  getUser: async (id: string) => {
    const res = await axiosInstance.get(`/admin/users/${id}/`);
    return res.data;
  },
  updateUser: async (id: string, data: { role?: string; is_active?: boolean; full_name?: string; phone_number?: string; bio?: string }) => {
    const res = await axiosInstance.patch(`/admin/users/${id}/`, data);
    return res.data;
  },
  changeUserRole: async (id: string, role: string) => {
    await axiosInstance.patch(`/admin/users/${id}/change-role/`, { role });
  },
  getActivityLog: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/activity-log/', { params });
    return res.data;
  },
  getContacts: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/contact-requests/', { params });
    return res.data;
  },
  getContact: async (id: string) => {
    const res = await axiosInstance.get(`/admin/contact-requests/${id}/`);
    return res.data;
  },
  updateContact: async (id: string, data: { status?: string; admin_note?: string; assigned_to?: string | null }) => {
    const res = await axiosInstance.patch(`/admin/contact-requests/${id}/`, data);
    return res.data;
  },
  getInquiries: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/project-inquiries/', { params });
    return res.data;
  },
  getInquiry: async (id: string) => {
    const res = await axiosInstance.get(`/admin/project-inquiries/${id}/`);
    return res.data;
  },
  updateInquiry: async (id: string, data: { status?: string; admin_note?: string; assigned_admin?: string | null }) => {
    const res = await axiosInstance.patch(`/admin/project-inquiries/${id}/`, data);
    return res.data;
  },
  getCalculationHistory: async () => {
    const res = await axiosInstance.get('/admin/calculator/history/');
    return res.data;
  },
};
