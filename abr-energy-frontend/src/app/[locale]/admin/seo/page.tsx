'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Globe,
  ExternalLink,
  Loader2,
  Trash2,
  Sparkles,
  BarChart3,
  Bot,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useLocale } from '@/i18n';
import type { SeoOverviewData, SeoKeyword } from '@/types';

export default function AdminSeoDashboardPage() {
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'integrations' | 'geo' | 'health'>('overview');

  // Filters for keywords
  const [keywordQuery, setKeywordQuery] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<string>('all');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Add keyword modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    locale: 'fa',
    target_country: 'IR',
    target_page: '/',
    search_intent: 'commercial',
    priority: 'high',
  });

  // Fetch SEO Overview
  const { data: overviewData, isLoading: loadingOverview } = useQuery<SeoOverviewData>({
    queryKey: ['seo-overview'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/seo/overview/');
      return res.data;
    },
  });

  // Fetch Keywords
  const { data: keywordsData, isLoading: loadingKeywords } = useQuery<{ results: SeoKeyword[]; count: number }>({
    queryKey: ['seo-keywords', keywordQuery, selectedLocale, selectedIntent, selectedPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keywordQuery) params.set('q', keywordQuery);
      if (selectedLocale !== 'all') params.set('locale', selectedLocale);
      if (selectedIntent !== 'all') params.set('search_intent', selectedIntent);
      if (selectedPriority !== 'all') params.set('priority', selectedPriority);
      const res = await axiosInstance.get(`/admin/seo/keywords/?${params.toString()}`);
      return res.data;
    },
  });

  // Create Keyword Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof newKeyword) => {
      const res = await axiosInstance.post('/admin/seo/keywords/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-keywords'] });
      toast.success('کلمه کلیدی جدید با موفقیت ثبت شد.');
      setShowAddModal(false);
      setNewKeyword({
        keyword: '',
        locale: 'fa',
        target_country: 'IR',
        target_page: '/',
        search_intent: 'commercial',
        priority: 'high',
      });
    },
    onError: () => {
      toast.error('خطا در ثبت کلمه کلیدی.');
    },
  });

  // Delete Keyword Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/admin/seo/keywords/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-keywords'] });
      toast.success('کلمه کلیدی حذف شد.');
    },
    onError: () => {
      toast.error('خطا در حذف کلمه کلیدی.');
    },
  });

  const handleExportCsv = async () => {
    try {
      const res = await axiosInstance.get('/admin/seo/keywords/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'abarenergy-seo-keywords.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('فایل CSV کلمات کلیدی با موفقیت دانلود شد.');
    } catch {
      toast.error('خطا در دریافت خروجی CSV.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">داشبورد سئو و هوش مصنوعی (SEO & GEO)</h1>
          <p className="text-sm text-muted-foreground">
            پایش سلامت فنی، کلمات کلیدی، استنادپذیری در هوش مصنوعی (GEO) و وضعیت اتصال به کنسول گوگل.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
            <Download className="h-4 w-4" />
            <span>خروجی کلمات (CSV)</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>افزودن کلمه کلیدی</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-border pb-px gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>وضعیت کلی و شاخص‌ها</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'keywords'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>مدیریت کلمات کلیدی</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>کنسول گوگل و آنالیتیکس</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('geo')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'geo'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>سئوی مبتنی بر هوش مصنوعی (GEO)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'health'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>امتیاز سلامت و رفع خطاها</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>در حال بارگذاری شاخص‌های سئو...</span>
            </div>
          ) : (
            <>
              {/* Health Score Summary Card */}
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardDescription>امتیاز سلامت داخلی سئو (Health Score)</CardDescription>
                    <CardTitle className="flex items-baseline gap-2 text-3xl font-extrabold text-emerald-600">
                      <span>{overviewData?.health_score.score}</span>
                      <span className="text-base font-normal text-muted-foreground">/ ۱۰۰</span>
                      <Badge variant="outline" className="ml-auto text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
                        سطح {overviewData?.health_score.grade}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      محاسبه بر اساس استانداردهای ساختاری، متادیتا و شاخص‌های فنی سئو.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>صفحات عمومی قابل ایندکس</CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {overviewData?.overview.total_indexable_pages}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">شامل مقالات، محصولات، پروژه‌ها و خدمات فعال</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>صفحات دارای نقص متادیتا</CardDescription>
                    <CardTitle className={`text-3xl font-bold ${overviewData?.overview.pages_missing_metadata ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {overviewData?.overview.pages_missing_metadata}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">عناوین یا توضیحات خالی قبل از انتشار</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>نقشه سایت داینامیک و Robots</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>فعال و معتبر</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      <span>مشاهده sitemap.xml</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              </div>

              {/* Structured Data & Feeds Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">داده‌های ساختاریافته Schema.org</CardTitle>
                    <CardDescription>اسکیماهای فعال در صفحات جهت غنی‌سازی نتایج جستجو (Rich Snippets)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {overviewData?.overview.structured_data_types.map((type) => (
                        <Badge key={type} variant="secondary" className="font-mono text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">آخرین ممیزی فنی و پایش</CardTitle>
                    <CardDescription>زمان‌سنجی دقیق آخرین بررسی خودکار پلتفرم</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>تاریخ ثبت: <span className="font-mono text-foreground" dir="ltr">{overviewData?.overview.last_audited_at}</span></p>
                    <p className="mt-1">وضعیت کرالرهای هوش مصنوعی: <span className="text-emerald-600 font-medium">مجاز در robots.txt</span></p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: KEYWORDS MANAGEMENT */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">جستجو در کلمات کلیدی</label>
                  <Input
                    placeholder="جستجوی عبارت یا صفحه..."
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">زبان (Locale)</label>
                  <Select value={selectedLocale} onValueChange={(val) => setSelectedLocale(val || 'all')}>
                    <SelectTrigger><SelectValue placeholder="همه زبان‌ها" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه زبان‌ها</SelectItem>
                      <SelectItem value="fa">فارسی (fa)</SelectItem>
                      <SelectItem value="en">انگلیسی (en)</SelectItem>
                      <SelectItem value="ar">عربی (ar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">هدف جستجو (Search Intent)</label>
                  <Select value={selectedIntent} onValueChange={(val) => setSelectedIntent(val || 'all')}>
                    <SelectTrigger><SelectValue placeholder="همه اهداف" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه اهداف</SelectItem>
                      <SelectItem value="informational">اطلاعاتی (Informational)</SelectItem>
                      <SelectItem value="navigational">ناوبری (Navigational)</SelectItem>
                      <SelectItem value="commercial">تجاری (Commercial)</SelectItem>
                      <SelectItem value="transactional">تراکنشی (Transactional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">اولویت</label>
                  <Select value={selectedPriority} onValueChange={(val) => setSelectedPriority(val || 'all')}>
                    <SelectTrigger><SelectValue placeholder="همه اولویت‌ها" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه اولویت‌ها</SelectItem>
                      <SelectItem value="high">بالا (High)</SelectItem>
                      <SelectItem value="medium">متوسط (Medium)</SelectItem>
                      <SelectItem value="low">پایین (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keywords Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">کلمات کلیدی هدف تحت پایش ({keywordsData?.count || 0})</CardTitle>
                  <CardDescription>فهرست واژه‌های کلیدی ثبت‌شده جهت ارزیابی استراتژی ارگانیک</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingKeywords ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>در حال خواندن فهرست کلمات...</span>
                </div>
              ) : !keywordsData?.results.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>هیچ کلمه کلیدی با این فیلترها یافت نشد.</p>
                  <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="mt-4 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>افزودن اولین کلمه کلیدی</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-3 text-start font-medium">کلمه کلیدی</th>
                        <th className="pb-3 text-start font-medium">زبان</th>
                        <th className="pb-3 text-start font-medium">صفحه هدف</th>
                        <th className="pb-3 text-start font-medium">هدف جستجو</th>
                        <th className="pb-3 text-start font-medium">اولویت</th>
                        <th className="pb-3 text-start font-medium">رتبه</th>
                        <th className="pb-3 text-start font-medium">میانگین</th>
                        <th className="pb-3 text-start font-medium">کلیک</th>
                        <th className="pb-3 text-start font-medium">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {keywordsData.results.map((kw) => (
                        <tr key={kw.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 font-medium text-foreground">{kw.keyword}</td>
                          <td className="py-3 uppercase text-xs font-mono">{kw.locale}</td>
                          <td className="py-3 text-xs font-mono text-muted-foreground" dir="ltr">{kw.target_page}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-xs capitalize">
                              {kw.search_intent}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              className={`text-xs ${
                                kw.priority === 'high'
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                                  : kw.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20'
                              }`}
                              variant="outline"
                            >
                              {kw.priority}
                            </Badge>
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {kw.current_rank ? `#${kw.current_rank}` : '—'}
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {kw.average_position ? kw.average_position.toFixed(1) : '—'}
                          </td>
                          <td className="py-3 font-mono text-xs">{kw.clicks}</td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(kw.id)}
                              className="text-muted-foreground hover:text-rose-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: GOOGLE INTEGRATIONS (GSC & GA4) */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Google Search Console */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <span>اتصال Google Search Console API</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                    آماده برای دریافت اعتبارنامه
                  </Badge>
                </div>
                <CardDescription>نمایش ایمپرشن، کلیک، CTR و رتبه واقعی کلمات در موتور جستجوی گوگل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg bg-muted/40 p-3.5 border border-border/80">
                  <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      پلتفرم AbarEnergy هیچ رتبه‌ای را بدون استعلام مستقیم از Google Search Console حدس نمی‌زند و داده ساختگی تولید نمی‌کند. برای پایش زنده رتبه‌ها، کلید سرویس‌اکانت Google Cloud را در متغیرهای محیطی قرار دهید.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-foreground uppercase tracking-wider">محدوده‌های دسترسی الزامی (OAuth Scopes):</h4>
                  <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                    <li className="p-2 rounded bg-muted/30 border border-border/60">https://www.googleapis.com/auth/webmasters.readonly</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    پس از ثبت دسترسی، داده‌های ترافیک ارگانیک بر اساس کلمه، صفحه، کشور و دستگاه به صورت خودکار با سیستم همگام‌سازی خواهند شد.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Google Analytics 4 */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span>اتصال Google Analytics 4 (GA4)</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                    آماده برای اتصال
                  </Badge>
                </div>
                <CardDescription>تحلیل رفتار کاربران، صفحات فرود و نرخ تبدیل درخواست‌های تجاری</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg bg-muted/40 p-3.5 border border-border/80">
                  <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      جهت سنجش جلسات ورودی (Sessions)، کانال‌های جذب و تبدیل فرم‌های استعلام قیمت به داده واقعی، شناسه GA4 Property ID در فایل پیکربندی سرور مورد نیاز است.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-foreground uppercase tracking-wider">محدوده‌های دسترسی الزامی (OAuth Scopes):</h4>
                  <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                    <li className="p-2 rounded bg-muted/30 border border-border/60">https://www.googleapis.com/auth/analytics.readonly</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    اطلاعات کاربران طبق استانداردهای امنیتی حفظ شده و هیچ اطلاعات هویتی شخصی (PII) به سرویس‌های تحلیلی ارسال نمی‌گردد.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: GEO & AI SEARCH READINESS */}
      {activeTab === 'geo' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>بهینه‌سازی برای موتورهای پاسخگو و هوش مصنوعی (Generative Engine Optimization)</span>
              </CardTitle>
              <CardDescription>
                مجموعه اقدامات ساختاری برای افزایش استنادپذیری، قابلیت ارجاع و دیده‌شدن محتوای AbarEnergy در مدل‌های زبانی مانند Google Gemini، SearchGPT و Perplexity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-border p-3.5 bg-card">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">داده‌های ساختاریافته Schema.org Organization</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">شناسایی شفاف شرکت، شماره‌های تماس، آدرس فیزیکی و شبکه‌های اجتماعی برای مدل‌های هوش مصنوعی.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border p-3.5 bg-card">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">اطلاعات فنی دقیق و قابل استناد (Citable Content)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">ثبت مشخصات فنی نیروگاه‌ها، فرمول‌های محاسباتی و تجهیزات با استانداردهای مهندسی واقعی.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border p-3.5 bg-card">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">شفافیت نویسندگی و تاریخ انتشار</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">درج نویسنده مسئول، تاریخ به‌روزرسانی و ساختار سلسله‌مراتبی مقالات جهت تقویت اعتبار تخصصی (E-E-A-T).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border p-3.5 bg-card">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">لینک‌سازی داخلی و BreadcrumbList</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">مسیرهای شفاف دسترسی از صفحه اصلی تا سطوح عمیق کاتالوگ و مقالات آموزشی بدون بن‌بست محتوایی.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: INTERNAL HEALTH SCORE BREAKDOWN */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>فرمول شفاف محاسبه امتیاز سلامت سئو (SEO Health Score)</span>
              </CardTitle>
              <CardDescription>
                امتیاز داخلی پلتفرم از ۱۰۰ محاسبه شده و کسر امتیازها کاملاً قطعی، قابل توضیح و همراه با راهکار مستقیم است.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewData?.health_score.deductions.length ? (
                <div className="space-y-3">
                  {overviewData.health_score.deductions.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="font-medium text-sm text-foreground">{item.issue}</span>
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-500/30">
                            اولویت {item.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pr-6">{item.fix}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600 text-sm shrink-0">
                        {item.penalty} امتیاز
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>تمام بررسی‌های فنی سئو در وضعیت عالی قرار دارند و هیچ جریمه امتیازی ثبت نشده است.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Keyword Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold">ثبت کلمه کلیدی جدید</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">عبارت کلیدی</label>
                <Input
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                  placeholder="مثال: خرید اینورتر خورشیدی صنعتی"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">زبان</label>
                  <Select
                    value={newKeyword.locale}
                    onValueChange={(val) => val && setNewKeyword({ ...newKeyword, locale: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fa">فارسی (fa)</SelectItem>
                      <SelectItem value="en">انگلیسی (en)</SelectItem>
                      <SelectItem value="ar">عربی (ar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">کشور هدف</label>
                  <Input
                    value={newKeyword.target_country}
                    onChange={(e) => setNewKeyword({ ...newKeyword, target_country: e.target.value })}
                    placeholder="IR"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">صفحه هدف</label>
                <Input
                  value={newKeyword.target_page}
                  onChange={(e) => setNewKeyword({ ...newKeyword, target_page: e.target.value })}
                  placeholder="/products"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">هدف جستجو</label>
                  <Select
                    value={newKeyword.search_intent}
                    onValueChange={(val) => val && setNewKeyword({ ...newKeyword, search_intent: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">تجاری</SelectItem>
                      <SelectItem value="informational">اطلاعاتی</SelectItem>
                      <SelectItem value="navigational">ناوبری</SelectItem>
                      <SelectItem value="transactional">تراکنشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">اولویت</label>
                  <Select
                    value={newKeyword.priority}
                    onValueChange={(val) => val && setNewKeyword({ ...newKeyword, priority: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">پایین</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                انصراف
              </Button>
              <Button
                onClick={() => createMutation.mutate(newKeyword)}
                disabled={!newKeyword.keyword || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                ثبت کلمه کلیدی
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
