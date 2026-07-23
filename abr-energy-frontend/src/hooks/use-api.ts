import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, articlesApi, servicesApi, projectsApi, calculatorApi, contactApi, siteApi, galleryApi, notificationsApi, adminApi } from '@/api';
import type { CalculatorInput, ContactFormInput, ProjectInquiryInput } from '@/types';

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
