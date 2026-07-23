export type UserRole = 'super_admin' | 'website_admin' | 'content_manager' | 'engineer' | 'customer';

export interface User {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  avatar: string | null;
  bio: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterInput {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  phone_number?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SiteSettings {
  company_name: string;
  company_name_en: string;
  logo: string | null;
  favicon: string | null;
  phone_number: string;
  phone_number_2: string;
  email: string;
  address: string;
  instagram: string;
  telegram: string;
  linkedin: string;
  whatsapp: string;
  youtube: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image: string | null;
  about_us: string;
  about_us_en: string;
  default_meta_title: string;
  default_meta_description: string;
  footer_text: string;
  site_url: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  content: string;
  cover_image_url: string;
  category: Category | null;
  category_title: string;
  author_name: string;
  tags: Tag[];
  status: 'draft' | 'published' | 'scheduled';
  publish_date: string;
  view_count: number;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleListData {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  cover_image_url: string;
  category: string | null;
  category_title: string;
  author_name: string;
  tags: Tag[];
  status: string;
  publish_date: string;
  view_count: number;
  is_featured: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  parent: string | null;
  is_active: boolean;
}

export interface Tag {
  id: string;
  title: string;
  slug: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  image_url: string;
  icon: string;
  category: string | null;
  category_title: string;
  features: string[];
  order: number;
  is_featured: boolean;
  status: string;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  location: string;
  capacity: number;
  project_type: 'on_grid' | 'off_grid' | 'hybrid' | 'large_scale';
  status: string;
  is_featured: boolean;
  completion_percentage: number;
  cover_image: string;
  created_at: string;
}

export interface ProjectDetail extends Project {
  description: string;
  service_category: string | null;
  start_date: string;
  end_date: string;
  images: ProjectImage[];
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  image_url: string;
  is_cover: boolean;
  alt_text: string;
  order: number;
}

export interface CalculatorInput {
  daily_consumption: number;
  city: string;
  irradiation: number;
  battery_type: 'lead_acid' | 'lithium' | 'tubular';
  system_type: 'on_grid' | 'off_grid' | 'hybrid';
}

export interface CalculatorResult {
  panel_capacity: number;
  panel_count: number;
  battery_capacity: number;
  inverter_power: number;
  estimated_cost: number;
  roi_years: number;
}

export interface CalculatorResponse {
  result: CalculatorResult;
  history_id: string;
}

export interface ContactFormInput {
  full_name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  request_type: 'contact' | 'consultation' | 'design_request';
}

export interface ProjectInquiryInput {
  name: string;
  phone: string;
  email?: string;
  city: string;
  project_type: string;
  estimated_capacity?: number;
  message?: string;
}

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  message: string;
  notification_type: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface GalleryCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  is_active: boolean;
}

export interface GalleryImage {
  id: string;
  category: string;
  category_title: string;
  image_url: string;
  title: string;
  alt_text: string;
  caption: string;
  order: number;
  is_active: boolean;
  uploaded_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_articles: number;
  total_projects: number;
  total_services: number;
  total_contacts: number;
  total_inquiries: number;
  pending_contacts: number;
  pending_inquiries: number;
}

export interface CalculationHistory {
  id: string;
  city: string;
  system_type: string;
  daily_consumption: number;
  estimated_cost: number;
  roi_years: number;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user: string | null;
  user_email: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, unknown>;
  ip_address: string;
  timestamp: string;
}

export interface ContactRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  request_type: string;
  status: string;
  assigned_to: string | null;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
