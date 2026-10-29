'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  User,
  Tag,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import { useLocale } from '@/i18n';
import type { Article } from '@/types';
import { InternalPageShell, PageLoading, BreadcrumbTrail } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';

function statusOf(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

function calculateReadingTime(html?: string): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins.toLocaleString('fa-IR')} دقیقه مطالعه`;
}

export default function ArticleDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params?.slug as string;

  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Article>({
    queryKey: ['article', slug],
    queryFn: () => axiosInstance.get(`/articles/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  // Related articles: fetch only when article has category, scoped to published
  const { data: allArticles } = useQuery({
    queryKey: ['articles', 'related', article?.category_title],
    queryFn: () =>
      axiosInstance
        .get('/articles/', { params: { status: 'published' } })
        .then((r) => r.data),
    enabled: !!article?.category_title,
    staleTime: 5 * 60 * 1000,
  });

  const related = useMemo(() => {
    if (!allArticles || !article) return [];
    const items = Array.isArray((allArticles as { results?: Article[] })?.results)
      ? (allArticles as { results: Article[] }).results
      : Array.isArray(allArticles)
        ? (allArticles as Article[])
        : [];
    return items
      .filter((a) => a.slug !== article.slug && (a.category_title === article.category_title || !article.category_title))
      .slice(0, 3);
  }, [allArticles, article]);

  if (isLoading) {
    return (
      <InternalPageShell>
        <div className="container-page py-20">
          <PageLoading />
        </div>
      </InternalPageShell>
    );
  }

  if (isError || !article) {
    const status = statusOf(error);
    const is404 = status === 404 || (!isError && !article);
    const is429 = status === 429;
    return (
      <InternalPageShell>
        <div className="container-page py-20">
          {is404 ? (
            <NotFoundState
              title={t('articles.article_not_found')}
              message={t('articles.article_gone_hint')}
            />
          ) : (
            <ErrorState
              title={is429 ? (t('common.rate_limit_title') || 'محدودیت درخواست') : t('common.error')}
              message={is429 ? (t('common.rate_limit_hint') || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.') : t('admin.failed_load_articles')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
            />
          )}
          <div className="flex flex-wrap justify-center gap-3 pb-20">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              {t('articles.back_to_articles')}
            </Link>
          </div>
        </div>
      </InternalPageShell>
    );
  }

  // Extract headings for Table of Contents
  const headings: { id: string; text: string }[] = [];
  const contentWithIds = sanitizeHtml(article.content || '').replace(
    /<h2[^>]*>(.*?)<\/h2>/gi,
    (match, p1, offset) => {
      const id = `heading-${offset}`;
      const text = p1.replace(/<[^>]*>/g, '').trim();
      if (text) {
        headings.push({ id, text });
      }
      return `<h2 id="${id}">${p1}</h2>`;
    },
  );

  const readTime = calculateReadingTime(article.content);
  const displayDate = article.publish_date || article.created_at;

  return (
    <InternalPageShell>
      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 start-0 end-0 h-[3px] z-50 bg-gradient-to-r from-primary via-emerald-500 to-emerald-400 origin-left"
        style={{ scaleX }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pb-8 pt-6 sm:pb-12 sm:pt-8">
        <div className="container-page relative z-10">
          <BreadcrumbTrail
            trail={[
              { label: t('common.back_home'), href: '/' },
              { label: t('articles.title'), href: '/articles' },
              { label: article.title },
            ]}
            className="mb-6"
          />

          <div className="max-w-3xl">
            {article.category_title && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary"
              >
                {article.category_title}
              </motion.p>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]"
            >
              {article.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
            >
              {article.author_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> {article.author_name}
                </span>
              )}
              {displayDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {new Date(displayDate).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              {readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {readTime}
                </span>
              )}
              {typeof article.view_count === 'number' && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" /> {article.view_count}{' '}
                  {t('articles.views')}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {article.cover_image_url && (
        <section className="container-page pb-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border/80 shadow-xs dark:border-white/10 max-w-4xl"
          >
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="aspect-[2/1] w-full object-cover"
              loading="eager"
            />
          </motion.div>
        </section>
      )}

      {/* Content & Table of Contents */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page max-w-4xl">
          {headings.length > 0 && (
            <div className="mb-10 rounded-2xl border border-border/80 bg-card p-5 shadow-xs dark:border-white/10 dark:bg-card/70 sm:p-6">
              <p className="font-heading mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t('articles.table_of_contents')}
              </p>
              <nav className="space-y-2">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="block text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          <div className="prose prose-neutral max-w-none text-base leading-relaxed text-foreground/80 dark:prose-invert [&_h2]:font-heading [&_h3]:font-heading [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:leading-relaxed [&_a]:text-primary [&_a:hover]:underline [&_img]:rounded-xl">
            <div dangerouslySetInnerHTML={{ __html: contentWithIds }} />
          </div>

          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <ScrollReveal variant="fade">
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border/60 pt-8 dark:border-white/[0.06]">
                <Tag className="h-4 w-4 text-muted-foreground me-1" />
                {article.tags.map((tag: { id: string; title: string }) => (
                  <span
                    key={tag.id}
                    className="rounded-lg border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag.title}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* CTA */}
          <ScrollReveal variant="scale">
            <div className="mt-16 rounded-2xl border border-border/80 bg-card/60 p-8 text-center shadow-xs dark:border-white/10 dark:bg-card/40 md:p-10">
              <p className="font-heading mb-2 text-lg font-semibold text-foreground">
                {t('articles.cta_title')}
              </p>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                {t('articles.cta_desc')}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-brand-strong active:scale-[0.98]"
              >
                {t('contact.title')}{' '}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="mt-16 border-t border-border/60 pt-12 dark:border-white/[0.06]">
              <h2 className="font-heading mb-6 text-xl font-bold text-foreground">
                {t('articles.related')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((a) => (
                  <Link key={a.id} href={`/articles/${a.slug}`} className="group block">
                    <div className="flex h-full flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/40 dark:border-white/10 dark:bg-card/70">
                      <div>
                        {a.category_title && (
                          <p className="text-[11px] font-semibold text-primary">
                            {a.category_title}
                          </p>
                        )}
                        <h3 className="font-heading mt-1 text-sm font-semibold text-foreground transition-colors line-clamp-2 group-hover:text-primary">
                          {a.title}
                        </h3>
                      </div>
                      {(a.publish_date || a.created_at) && (
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          {new Date(a.publish_date || a.created_at || '').toLocaleDateString(
                            'fa-IR',
                            { year: 'numeric', month: 'short' },
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}
