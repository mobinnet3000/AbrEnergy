/**
 * Central Enum and Label Resolution Dictionary for AbarEnergy.
 * Separates raw API/internal string codes from localized UI display labels.
 * Provides guaranteed SSR/hydration stability across Persian (RTL), Arabic (RTL), and English (LTR).
 */

import type { Locale } from '@/i18n/config';

export interface LocalizedLabel {
  fa: string;
  en: string;
  ar: string;
}

export const ENUM_DICTIONARY: Record<string, LocalizedLabel> = {
  // Global filters
  all: { fa: 'همه', en: 'All', ar: 'الكل' },

  // User Roles
  super_admin: { fa: 'مدیر ارشد سامانه', en: 'Super Administrator', ar: 'المدير العام للنظام' },
  website_admin: { fa: 'مدیر وب‌سایت', en: 'Website Administrator', ar: 'مدير الموقع' },
  content_manager: { fa: 'مدیر محتوا', en: 'Content Manager', ar: 'مدير المحتوى' },
  product_manager: { fa: 'مدیر محصولات', en: 'Product Manager', ar: 'مدير المنتجات' },
  support_manager: { fa: 'مدیر پشتیبانی', en: 'Support Manager', ar: 'مدير الدعم الفني' },
  seo_manager: { fa: 'مدیر سئو', en: 'SEO Manager', ar: 'مدير تحسين محركات البحث' },
  engineer: { fa: 'مهندس فنی', en: 'Technical Engineer', ar: 'مهندس فني' },
  analyst: { fa: 'تحلیل‌گر داده', en: 'Data Analyst', ar: 'محلل بيانات' },
  customer: { fa: 'مشتری', en: 'Customer', ar: 'عميل' },

  // Content / Publication Statuses
  draft: { fa: 'پیش‌نویس', en: 'Draft', ar: 'مسودة' },
  published: { fa: 'منتشر شده', en: 'Published', ar: 'منشور' },
  scheduled: { fa: 'زمان‌بندی شده', en: 'Scheduled', ar: 'مجدول' },
  archived: { fa: 'بایگانی شده', en: 'Archived', ar: 'مؤرشف' },

  // Contact & Inquiry Statuses
  new: { fa: 'جدید', en: 'New', ar: 'جديد' },
  pending: { fa: 'در انتظار بررسی', en: 'Pending Review', ar: 'قيد الانتظار' },
  reviewed: { fa: 'بررسی شده', en: 'Reviewed', ar: 'تمت المراجعة' },
  contacted: { fa: 'تماس گرفته شد', en: 'Contacted', ar: 'تم الاتصال' },
  in_progress: { fa: 'در حال اقدام', en: 'In Progress', ar: 'قيد التنفيذ' },
  completed: { fa: 'تکمیل شده', en: 'Completed', ar: 'مكتمل' },
  cancelled: { fa: 'لغو شده', en: 'Cancelled', ar: 'ملغى' },

  // Contact / Inquiry Form Types
  contact: { fa: 'پیام عمومی', en: 'General Inquiry', ar: 'استفسار عام' },
  consultation: { fa: 'درخواست مشاوره', en: 'Consultation Request', ar: 'طلب استشارة' },
  design_request: { fa: 'درخواست طراحی و مهندسی', en: 'Engineering & Design Request', ar: 'طلب تصميم وهندسة' },

  // Account Statuses
  active: { fa: 'فعال', en: 'Active', ar: 'نشط' },
  inactive: { fa: 'غیرفعال', en: 'Inactive', ar: 'غير نشط' },

  // Notification States
  unread: { fa: 'خوانده نشده', en: 'Unread', ar: 'غير مقروءة' },
  read: { fa: 'خوانده شده', en: 'Read', ar: 'مقروءة' },

  // Solar Calculator: System Types
  off_grid: { fa: 'سیستم منفصل از شبکه (آف‌گرید)', en: 'Off-Grid Solar System', ar: 'نظام منفصل عن الشبكة' },
  on_grid: { fa: 'سیستم متصل به شبکه (آن‌گرید)', en: 'On-Grid Solar System', ar: 'نظام متصل بالشبكة' },
  hybrid: { fa: 'سیستم هیبریدی', en: 'Hybrid Solar System', ar: 'نظام هجين' },

  // Solar Calculator: Battery Types
  lithium: { fa: 'باتری لیتیوم-یون', en: 'Lithium-Ion Battery', ar: 'بطارية ليثيوم أيون' },
  lead_acid: { fa: 'باتری سرب-اسید', en: 'Lead-Acid Battery', ar: 'بطارية رصاص حمضية' },
  tubular: { fa: 'باتری تیوبلار صنعتی', en: 'Tubular Deep Cycle Battery', ar: 'بطارية أنبوبية صناعية' },

  // Media Library File Types
  image: { fa: 'تصویر', en: 'Image', ar: 'صورة' },
  document: { fa: 'سند / فایل', en: 'Document', ar: 'مستند' },
  video: { fa: 'ویدیو', en: 'Video', ar: 'فيديو' },

  // SEO Search Intents
  informational: { fa: 'اطلاعاتی', en: 'Informational', ar: 'معلوماتي' },
  navigational: { fa: 'ناوبری / برند', en: 'Navigational', ar: 'تصفحي' },
  commercial: { fa: 'تحقیق تجاری', en: 'Commercial Investigation', ar: 'تجاري' },
  transactional: { fa: 'تراکنشی / خرید', en: 'Transactional / Purchase', ar: 'معاملاتي' },

  // Priority Levels
  high: { fa: 'بالا', en: 'High', ar: 'عالي' },
  medium: { fa: 'متوسط', en: 'Medium', ar: 'متوسط' },
  low: { fa: 'پایین', en: 'Low', ar: 'منخفض' },

  // Ordering & Sorting
  '-created_at': { fa: 'جدیدترین', en: 'Newest First', ar: 'الأحدث أولاً' },
  'created_at': { fa: 'قدیمی‌ترین', en: 'Oldest First', ar: 'الأقدم أولاً' },
  'price': { fa: 'ارزان‌ترین', en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' },
  '-price': { fa: 'گران‌ترین', en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' },
  'title': { fa: 'عنوان (الف-ی)', en: 'Title: A to Z', ar: 'الاسم: أ إلى ي' },
};

/**
 * Resolves a display label for a given internal enum value and locale.
 * Returns undefined if the value is not in the dictionary.
 */
export function getEnumLabel(value: unknown, locale: Locale = 'fa'): string | undefined {
  if (typeof value !== 'string') return undefined;
  const entry = ENUM_DICTIONARY[value];
  if (!entry) return undefined;
  return entry[locale] || entry.fa || entry.en;
}
