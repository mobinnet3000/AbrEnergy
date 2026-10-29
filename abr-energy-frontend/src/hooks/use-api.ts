import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, articlesApi, servicesApi, projectsApi, calculatorApi, contactApi, siteApi, galleryApi, notificationsApi, adminApi, productsApi, adminProductCategoriesApi, adminProductsApi, adminArticlesApi, adminServicesApi, adminProjectsApi, adminAttributeDefinitionsApi, homepageApi, adminHomepageApi, previewApi, mediaApi, publicDocumentsApi } from '@/api';
import type { MediaListParams } from '@/api';
import type { CalculatorInput, ContactFormInput, ProjectInquiryInput, ProductCategoryWritePayload, ProductWritePayload } from '@/types';

export const useSiteSettings = () => useQuery({ queryKey: ['site-settings'], queryFn: siteApi.getSettings, staleTime: 5 * 60 * 1000 });

export const useArticles = (params?: Record<string, string>, options?: { enabled?: boolean }) => useQuery({ queryKey: ['articles', params], queryFn: () => articlesApi.list(params), enabled: options?.enabled ?? true, staleTime: 5 * 60 * 1000 });
export const useArticle = (slug: string) => useQuery({ queryKey: ['article', slug], queryFn: () => articlesApi.getBySlug(slug), enabled: !!slug, staleTime: 5 * 60 * 1000 });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: articlesApi.getCategories, staleTime: 5 * 60 * 1000 });
export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: articlesApi.getTags, staleTime: 5 * 60 * 1000 });

export const useServices = (options?: { enabled?: boolean }) => useQuery({ queryKey: ['services'], queryFn: servicesApi.list, enabled: options?.enabled ?? true, staleTime: 5 * 60 * 1000 });
export const useService = (slug: string) => useQuery({ queryKey: ['service', slug], queryFn: () => servicesApi.getBySlug(slug), enabled: !!slug, staleTime: 5 * 60 * 1000 });

export const useProjects = (params?: Record<string, string>) => useQuery({ queryKey: ['projects', params], queryFn: () => projectsApi.list(params), staleTime: 5 * 60 * 1000 });
export const useProject = (slug: string) => useQuery({ queryKey: ['project', slug], queryFn: () => projectsApi.getBySlug(slug), enabled: !!slug, staleTime: 5 * 60 * 1000 });
export const useFeaturedProjects = (options?: { enabled?: boolean }) => useQuery({ queryKey: ['projects', 'featured'], queryFn: projectsApi.getFeatured, enabled: options?.enabled ?? true, staleTime: 5 * 60 * 1000 });

export const useGallery = (categorySlug?: string) => useQuery({ queryKey: ['gallery', categorySlug], queryFn: () => galleryApi.list(categorySlug), staleTime: 5 * 60 * 1000 });

export const useCalculate = () => useMutation({ mutationFn: (data: CalculatorInput) => calculatorApi.calculate(data as unknown as Record<string, unknown>) });
export const useCalcHistory = () => useQuery({ queryKey: ['calc-history'], queryFn: calculatorApi.getHistory });

export const useContactSubmit = () => useMutation({ mutationFn: (data: ContactFormInput) => contactApi.submit(data as unknown as Record<string, unknown>) });
export const useInquirySubmit = () => useMutation({ mutationFn: (data: ProjectInquiryInput) => contactApi.submitInquiry(data as unknown as Record<string, unknown>) });

export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: authApi.getMe });
export const useUpdateProfile = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Partial<import('@/types').User>) => authApi.updateProfile(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }) }); };
export const useChangePassword = () => useMutation({ mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string }) => authApi.changePassword(old_password, new_password) });

export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });
export const useUnreadCount = () => useQuery({ queryKey: ['unread-count'], queryFn: notificationsApi.getUnreadCount });
export const useMarkRead = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-count'] }); } }); };
export const useMarkAllRead = () => { const qc = useQueryClient(); return useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-count'] }); } }); };
export const useDeleteNotification = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => notificationsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-count'] }); } }); };

export const useAdminDashboard = () => useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.getDashboard });
export const useAdminDashboardOverview = () =>
  useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: adminApi.getDashboardOverview,
    staleTime: 60 * 1000,
  });
export const useAdminUsers = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-users', params], queryFn: () => adminApi.getUsers(params) });
export const useAdminUser = (id: string) => useQuery({ queryKey: ['admin-user', id], queryFn: () => adminApi.getUser(id), enabled: !!id });
export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createUser>[0]) => adminApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; is_active?: boolean; full_name?: string; phone_number?: string; bio?: string } }) =>
      adminApi.updateUser(id, data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user', v.id] });
    },
  });
};
export const useChangeUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.changeUserRole(id, role),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user', v.id] });
    },
  });
};

export const useActivityLog = (params?: Record<string, string>) => useQuery({ queryKey: ['activity-log', params], queryFn: () => adminApi.getActivityLog(params) });
export const useAdminContacts = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-contacts', params], queryFn: () => adminApi.getContacts(params) });
export const useAdminContact = (id: string) => useQuery({ queryKey: ['admin-contact', id], queryFn: () => adminApi.getContact(id), enabled: !!id });
export const useUpdateAdminContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; admin_note?: string; assigned_to?: string | null } }) =>
      adminApi.updateContact(id, data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-contacts'] });
      qc.invalidateQueries({ queryKey: ['admin-contact', v.id] });
    },
  });
};

export const useAdminInquiries = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-inquiries', params], queryFn: () => adminApi.getInquiries(params) });
export const useAdminInquiry = (id: string) => useQuery({ queryKey: ['admin-inquiry', id], queryFn: () => adminApi.getInquiry(id), enabled: !!id });
export const useUpdateAdminInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; admin_note?: string; assigned_admin?: string | null } }) =>
      adminApi.updateInquiry(id, data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      qc.invalidateQueries({ queryKey: ['admin-inquiry', v.id] });
    },
  });
};
export const useAdminCalcHistory = () => useQuery({ queryKey: ['admin-calc-history'], queryFn: adminApi.getCalculationHistory });

export const useAdminProductCategories = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin-product-categories', params], queryFn: () => adminProductCategoriesApi.list(params) });
export const useAdminProductCategory = (id: string) =>
  useQuery({ queryKey: ['admin-product-category', id], queryFn: () => adminProductCategoriesApi.get(id), enabled: !!id });
export const useCreateAdminProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCategoryWritePayload) => adminProductCategoriesApi.create(data as unknown as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product-categories'] }),
  });
};
export const useUpdateAdminProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductCategoryWritePayload> }) =>
      adminProductCategoriesApi.update(id, data as unknown as Record<string, unknown>),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-product-categories'] });
      qc.invalidateQueries({ queryKey: ['admin-product-category', v.id] });
    },
  });
};
export const useDeleteAdminProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminProductCategoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product-categories'] }),
  });
};
// ── Phase 9.4 — duplicate (server-generated copy; returns the NEW detail) ──
export const useDuplicateAdminProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminProductCategoriesApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-product-categories'] });
    },
  });
};

export const useAdminProducts = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin-products', params], queryFn: () => adminProductsApi.list(params) });
export const useAdminProduct = (id: string) =>
  useQuery({ queryKey: ['admin-product', id], queryFn: () => adminProductsApi.get(id), enabled: !!id });
export const useCreateAdminProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductWritePayload) => adminProductsApi.create(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};
export const useUpdateAdminProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductWritePayload> }) =>
      adminProductsApi.update(id, data as unknown as Record<string, unknown>),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', v.id] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};
export const useDeleteAdminProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminProductsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};
// ── Phase 9.4 — duplicate (server-generated copy; returns the NEW detail) ──
export const useDuplicateAdminProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminProductsApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

// ── Phase 9.2 — admin content lists (Articles / Services / Projects) ─────
// Distinct `admin-*` query namespaces (never collide with the public
// `articles` / `services` / `projects` keys). Params flow straight to the
// matching `/admin/*` endpoint; only backend-supported params are passed
// by the list pages. Global `staleTime` policy untouched.
export const useAdminArticles = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin-articles', params], queryFn: () => adminArticlesApi.list(params) });

export const useAdminServices = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin-services', params], queryFn: () => adminServicesApi.list(params) });

export const useAdminProjects = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin-projects', params], queryFn: () => adminProjectsApi.list(params) });

export const useAttributeDefinitions = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ['admin-attribute-definitions', params],
    queryFn: () => adminAttributeDefinitionsApi.list(params),
  });

// ── Public product catalog (AllowAny — no authentication required) ──────────
// Server-side filtering/pagination is delegated to the API via `params`
// (search, category [UUID], is_featured, ordering, page).

export const usePublicProductCategories = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-product-categories'], queryFn: () => productsApi.listCategories(), staleTime: 5 * 60 * 1000, enabled: options?.enabled ?? true });

export const usePublicProductCategory = (slug: string, options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-product-category', slug], queryFn: () => productsApi.getCategory(slug), enabled: options?.enabled ?? !!slug, staleTime: 5 * 60 * 1000 });

export const usePublicProducts = (params?: Record<string, string>, options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-products', params], queryFn: () => productsApi.list(params), enabled: options?.enabled ?? true, staleTime: 5 * 60 * 1000 });

export const usePublicProduct = (slug: string, options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-product', slug], queryFn: () => productsApi.getBySlug(slug), enabled: options?.enabled ?? !!slug, staleTime: 5 * 60 * 1000 });

export const useFeaturedPublicProducts = (params?: Record<string, string>, options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-products', 'featured', params], queryFn: () => productsApi.getFeatured(params), staleTime: 5 * 60 * 1000, enabled: options?.enabled ?? true });

// ── Homepage CMS (Phase 7) ───────────────────────────────────────────────
// Public payload is cached 5 min (same policy as the catalog tree). The
// admin detail is fetched on the Studio page only; updates invalidate both
// the admin detail and the public payload (plus the site settings fallback
// chain stays untouched).

export const useHomepage = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['homepage'], queryFn: homepageApi.get, staleTime: 5 * 60 * 1000, enabled: options?.enabled ?? true });

export const useAdminHomepage = () =>
  useQuery({ queryKey: ['admin-homepage'], queryFn: adminHomepageApi.get });

export const useUpdateAdminHomepage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminHomepageApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-homepage'] });
      qc.invalidateQueries({ queryKey: ['homepage'] });
    },
  });
};

// ── Phase 8.1 — homepage preview (token-gated, no-store, never cached) ────
export const useHomepagePreview = (token: string | null) =>
  useQuery({
    queryKey: ['homepage-preview', token],
    queryFn: () => previewApi.getHomepagePreview(token as string),
    enabled: !!token,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

// ── Phase 8.2 — product/category preview (same token model, never cached) ──
export const useProductPreview = (id: string | null, token: string | null) =>
  useQuery({
    queryKey: ['product-preview', id, token],
    queryFn: () => previewApi.getProductPreview(id as string, token as string),
    enabled: !!id && !!token,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useCategoryPreview = (id: string | null, token: string | null) =>
  useQuery({
    queryKey: ['category-preview', id, token],
    queryFn: () => previewApi.getCategoryPreview(id as string, token as string),
    enabled: !!id && !!token,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

// ── Phase 12.20 — Public Documents & CMS Media/Gallery Workflows ──────────
export const usePublicDocuments = (params?: Record<string, string>, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['public-documents', params],
    queryFn: () => publicDocumentsApi.list(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });

export const useAdminGalleryImages = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ['admin-gallery-images', params],
    queryFn: () => galleryApi.listAdminImages(params),
  });

export const useAdminGalleryCategories = () =>
  useQuery({
    queryKey: ['admin-gallery-categories'],
    queryFn: () => galleryApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateAdminGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => galleryApi.createAdminImage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useUpdateAdminGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      galleryApi.updateAdminImage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useDeleteAdminGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => galleryApi.deleteAdminImage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useAdminMediaList = (params?: MediaListParams) =>
  useQuery({
    queryKey: ['admin-media', params],
    queryFn: () => mediaApi.list(params),
  });

export const useUpdateAdminMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { alt_text?: string; subfolder?: string } }) =>
      mediaApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
  });
};
