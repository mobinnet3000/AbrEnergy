import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, articlesApi, servicesApi, projectsApi, calculatorApi, contactApi, siteApi, galleryApi, notificationsApi, adminApi, productsApi, adminProductCategoriesApi, adminProductsApi, adminAttributeDefinitionsApi, homepageApi, adminHomepageApi } from '@/api';
import type { CalculatorInput, ContactFormInput, ProjectInquiryInput, ProductCategoryWritePayload, ProductWritePayload } from '@/types';

export const useSiteSettings = () => useQuery({ queryKey: ['site-settings'], queryFn: siteApi.getSettings, staleTime: 5 * 60 * 1000 });

export const useArticles = (params?: Record<string, string>) => useQuery({ queryKey: ['articles', params], queryFn: () => articlesApi.list(params) });
export const useArticle = (slug: string) => useQuery({ queryKey: ['article', slug], queryFn: () => articlesApi.getBySlug(slug), enabled: !!slug });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: articlesApi.getCategories });
export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: articlesApi.getTags });

export const useServices = () => useQuery({ queryKey: ['services'], queryFn: servicesApi.list });
export const useService = (slug: string) => useQuery({ queryKey: ['service', slug], queryFn: () => servicesApi.getBySlug(slug), enabled: !!slug });

export const useProjects = (params?: Record<string, string>) => useQuery({ queryKey: ['projects', params], queryFn: () => projectsApi.list(params) });
export const useProject = (slug: string) => useQuery({ queryKey: ['project', slug], queryFn: () => projectsApi.getBySlug(slug), enabled: !!slug });
export const useFeaturedProjects = () => useQuery({ queryKey: ['projects', 'featured'], queryFn: projectsApi.getFeatured });

export const useGallery = (categorySlug?: string) => useQuery({ queryKey: ['gallery', categorySlug], queryFn: () => galleryApi.list(categorySlug) });

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

export const useAdminDashboard = () => useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.getDashboard });
export const useAdminUsers = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-users', params], queryFn: () => adminApi.getUsers(params) });
export const useActivityLog = (params?: Record<string, string>) => useQuery({ queryKey: ['activity-log', params], queryFn: () => adminApi.getActivityLog(params) });
export const useAdminContacts = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-contacts', params], queryFn: () => adminApi.getContacts(params) });
export const useAdminInquiries = (params?: Record<string, string>) => useQuery({ queryKey: ['admin-inquiries', params], queryFn: () => adminApi.getInquiries(params) });
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

export const useAttributeDefinitions = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ['admin-attribute-definitions', params],
    queryFn: () => adminAttributeDefinitionsApi.list(params),
  });

// ── Public product catalog (AllowAny — no authentication required) ──────────
// Server-side filtering/pagination is delegated to the API via `params`
// (search, category [UUID], is_featured, ordering, page).

export const usePublicProductCategories = () =>
  useQuery({ queryKey: ['public-product-categories'], queryFn: () => productsApi.listCategories(), staleTime: 5 * 60 * 1000 });

export const usePublicProductCategory = (slug: string) =>
  useQuery({ queryKey: ['public-product-category', slug], queryFn: () => productsApi.getCategory(slug), enabled: !!slug, staleTime: 5 * 60 * 1000 });

export const usePublicProducts = (params?: Record<string, string>, options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ['public-products', params], queryFn: () => productsApi.list(params), enabled: options?.enabled ?? true });

export const usePublicProduct = (slug: string) =>
  useQuery({ queryKey: ['public-product', slug], queryFn: () => productsApi.getBySlug(slug), enabled: !!slug });

export const useFeaturedPublicProducts = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['public-products', 'featured', params], queryFn: () => productsApi.getFeatured(params), staleTime: 5 * 60 * 1000 });

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
