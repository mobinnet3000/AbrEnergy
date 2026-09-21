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

export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductVisibility = 'public' | 'hidden';
export type PriceDisplayMode = 'contact' | 'regular' | 'discounted' | 'hidden';
export type PriceState = 'contact_for_price' | 'regular' | 'discounted' | 'scheduled' | 'expired' | 'hidden';

export interface ProductPrice {
  display_mode: PriceDisplayMode;
  regular_price: string | null;
  sale_price: string | null;
  currency: string;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  effective: {
    state: PriceState;
    currency: string;
    regular_price?: string | null;
    sale_price?: string | null;
    final_price?: string | null;
  };
}

export interface ProductCategory {
  id: string;
  title: string;
  slug: string;
  slug_t?: string;
  parent: string | null;
  children?: ProductCategory[];
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
}

export interface ProductCategoryDetail {
  id: string;
  title: string;
  slug: string;
  slug_t: string;
  parent: string | null;
  description: string;
  content: string;
  meta_title: string;
  meta_description: string;
  cover: string | null;
  cover_image_url: string;
  og_image: string | null;
  og_image_url: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryWritePayload {
  translations: Record<string, { title: string; slug?: string; description?: string; content?: string; meta_title?: string; meta_description?: string }>;
  slug: string;
  parent: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  cover: string | null;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
}

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  sku: string;
  category: string | null;
  cover_image_url: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  price: ProductPrice['effective'];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ProductImageItem {
  id: string;
  url: string;
  media_file: string;
  is_cover: boolean;
  sort_order: number;
  alt_text: string;
  caption: string;
}

export interface ProductDocumentItem {
  id: string;
  url: string;
  media_file: string;
  title: string;
  doc_type: string;
  sort_order: number;
  is_active: boolean;
  description: string;
}

export interface ProductSpecificationItem {
  id: string;
  section: string;
  label: string;
  value: string;
  unit: string;
  sort_order: number;
}

export interface ProductAttributeValueItem {
  id: string;
  code: string;
  name: string;
  data_type: 'text' | 'number' | 'boolean' | 'select';
  unit: string;
  value_text: string;
  value_number: string | number | null;
  value_boolean: boolean | null;
  display: string | boolean;
}

export interface ProductRelatedItem {
  id: string;
  slug: string;
  title: string;
  relation_type: string;
}

export interface ProductAttributeDefinition {
  id: string;
  code: string;
  name: string;
  data_type: 'text' | 'number' | 'boolean' | 'select';
  unit: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  features: string;
  images: ProductImageItem[];
  documents: ProductDocumentItem[];
  specifications: ProductSpecificationItem[];
  attribute_values: ProductAttributeValueItem[];
  related: ProductRelatedItem[];
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
  meta_title: string;
  meta_description: string;
  /** Admin-only raw pricing inputs (AdminProductDetailSerializer). Absent on public detail. */
  price_display_mode?: PriceDisplayMode;
  price_is_active?: boolean;
  price_regular?: string | null;
  price_sale?: string | null;
  price_discount_type?: 'none' | 'percentage' | 'fixed';
  price_discount_value?: string;
  price_starts_at?: string | null;
  price_ends_at?: string | null;
  og_image_url?: string;
  relations_admin?: { id: string; to_product: string; title: string; relation_type: string; sort_order: number; is_active: boolean }[];
}

export interface ProductFaTranslation {
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  features?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface ProductPriceInput {
  display_mode: PriceDisplayMode;
  regular_price: string | null;
  sale_price: string | null;
  currency: string;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface ProductWritePayload {
  translations: Record<string, ProductFaTranslation>;
  category: string | null;
  sku: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
  price_data?: ProductPriceInput;
  images_data?: { media_file: string; sort_order: number; is_cover: boolean; alt_text: string; caption: string }[];
  documents_data?: { media_file: string; title: string; doc_type: string; sort_order: number; is_active: boolean; description: string }[];
  specs_data?: { section: string; label: string; value: string; unit: string; sort_order: number }[];
  attributes_data?: { definition: string; value_text?: string; value_number?: string | null; value_boolean?: boolean | null }[];
  relations_data?: { to_product: string; relation_type: string; sort_order: number; is_active: boolean }[];
}

export type ProductRelationType = 'related' | 'similar' | 'accessory' | 'recommended';

export interface ProductListParams {
  search?: string;
  category?: string;
  status?: string;
  visibility?: string;
  is_active?: string;
  is_featured?: string;
  ordering?: string;
  page?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Homepage CMS (Phase 7) ─────────────────────────────────────────────
// Mirrors `GET /api/v1/homepage/` (public) and `GET /api/v1/admin/homepage/`
// (admin). Nested entities reuse the existing list shapes — no duplication.

export type HomepageSectionKey =
  | 'hero'
  | 'featured_products'
  | 'categories'
  | 'services'
  | 'calculator'
  | 'projects'
  | 'articles'
  | 'contact';

export interface HomepageCta {
  label: string;
  url: string;
  enabled: boolean;
}

export interface HomepageHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  primary_cta: HomepageCta;
  secondary_cta: HomepageCta;
  enabled: boolean;
}

export interface HomepageSection {
  key: HomepageSectionKey;
  enabled: boolean;
  order: number;
  title: string;
  subtitle: string;
  content: string;
}

export interface HomepageTeaser {
  title: string;
  subtitle: string;
  description: string;
  cta_label: string;
  cta_url: string;
  enabled: boolean;
}

export interface HomepageContact {
  title: string;
  subtitle: string;
  description: string;
  cta_label: string;
  cta_url: string;
  secondary_cta: { label: string; url: string };
  enabled: boolean;
}

export interface HomepageVisual {
  id: string;
  image_url: string;
  alt: string;
  order: number;
  link_url: string;
}

export interface HomepageSeo {
  title: string;
  description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
}

export interface HomepagePayload {
  hero: HomepageHero;
  sections: HomepageSection[];
  featured_products: ProductListItem[];
  categories: ProductCategory[];
  services: Record<string, unknown>[];
  calculator: HomepageTeaser;
  projects: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  contact: HomepageContact;
  visuals: HomepageVisual[];
  seo: HomepageSeo;
}

export interface HomepageRelationRow {
  order: number;
  enabled: boolean;
}

export interface HomepageAdminPayload {
  hero_eyebrow: string;
  hero_primary_cta_label: string;
  hero_primary_cta_url: string;
  hero_primary_cta_enabled: boolean;
  hero_secondary_cta_label: string;
  hero_secondary_cta_url: string;
  hero_secondary_cta_enabled: boolean;
  calculator_cta_label: string;
  calculator_cta_url: string;
  contact_cta_label: string;
  contact_cta_url: string;
  contact_secondary_cta_label: string;
  contact_secondary_cta_url: string;
  articles_count: number;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
  og_image_url: string;
  updated_at: string;
  sections: HomepageSection[];
  featured_products: ({ product: string } & HomepageRelationRow)[];
  categories: ({ category: string } & HomepageRelationRow)[];
  services: ({ service: string } & HomepageRelationRow)[];
  projects: ({ project: string } & HomepageRelationRow)[];
  articles: ({ article: string } & HomepageRelationRow)[];
  visuals: {
    id: string;
    image: string | null;
    image_url: string;
    alt: string;
    order: number;
    enabled: boolean;
    link_url: string;
  }[];
}

export interface HomepageWritePayload {
  hero_eyebrow?: string;
  hero_primary_cta_label?: string;
  hero_primary_cta_url?: string;
  hero_primary_cta_enabled?: boolean;
  hero_secondary_cta_label?: string;
  hero_secondary_cta_url?: string;
  hero_secondary_cta_enabled?: boolean;
  calculator_cta_label?: string;
  calculator_cta_url?: string;
  contact_cta_label?: string;
  contact_cta_url?: string;
  contact_secondary_cta_label?: string;
  contact_secondary_cta_url?: string;
  articles_count?: number;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  robots?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string | null;
  sections_data?: Partial<HomepageSection>[];
  featured_products_data?: { product: string; order: number; enabled: boolean }[];
  categories_data?: { category: string; order: number; enabled: boolean }[];
  services_data?: { service: string; order: number; enabled: boolean }[];
  projects_data?: { project: string; order: number; enabled: boolean }[];
  articles_data?: { article: string; order: number; enabled: boolean }[];
  visuals_data?: { image: string; alt: string; order: number; enabled: boolean; link_url: string }[];
}
