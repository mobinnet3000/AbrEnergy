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
};

export const adminApi = {
  getDashboard: async () => {
    const res = await axiosInstance.get('/admin/dashboard/stats/');
    return res.data;
  },
  getUsers: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/users/', { params });
    return res.data;
  },
  getUser: async (id: string) => {
    const res = await axiosInstance.get(`/admin/users/${id}/`);
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
  getInquiries: async (params?: Record<string, string>) => {
    const res = await axiosInstance.get('/admin/project-inquiries/', { params });
    return res.data;
  },
  getCalculationHistory: async () => {
    const res = await axiosInstance.get('/admin/calculator/history/');
    return res.data;
  },
};
