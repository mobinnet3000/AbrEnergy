'use client';

import Link from 'next/link';
import { Sun, User, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useArticles } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import { hasValidSlug } from '@/lib/slug';

function calculateReadingTime(html?: string): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins.toLocaleString('fa-IR')} دقیقه مطالعه`;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  content?: string;
  cover_image_url?: string;
  category_title?: string;
  author_name?: string;
  publish_date?: string;
  created_at?: string;
  status?: string;
}

function ArticleCard({ article, featured }: { article: ArticleItem; featured?: boolean }) {
  const readTime = calculateReadingTime(article.content);
  const displayDate = article.publish_date || article.created_at;

  return featured ? (
    <ScrollReveal variant="scale">
      <Link href={`/articles/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70">
          <div className="relative aspect-[2/1] overflow-hidden bg-muted/40 md:aspect-[3/1]">
            {article.cover_image_url ? (
              <img
                src={article.cover_image_url}
                alt={article.title}
                loading="eager"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Sun className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              {article.category_title && (
                <span className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md">
                  {article.category_title}
                </span>
              )}
              <h2 className="font-heading mb-2 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                {article.title}
              </h2>
              {article.short_description && (
                <p className="max-w-2xl text-sm text-white/80 line-clamp-2">
                  {article.short_description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/70">
                {article.author_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> {article.author_name}
                  </span>
                )}
                {displayDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {new Date(displayDate).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {readTime && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {readTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  ) : (
    <ScrollReveal variant="slide-up" delay={0.05}>
      <Link href={`/articles/${article.slug}`} className="group block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
            {article.cover_image_url ? (
              <img
                src={article.cover_image_url}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Sun className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              {article.category_title && (
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {article.category_title}
                </p>
              )}
              <h3 className="font-heading mt-1.5 text-base font-semibold text-foreground transition-colors duration-300 line-clamp-2 group-hover:text-primary">
                {article.title}
              </h3>
              {article.short_description && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {article.short_description}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground/80 dark:border-white/[0.06]">
              {displayDate && (
                <span>
                  {new Date(displayDate).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {readTime && <span>{readTime}</span>}
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ArticlesPage() {
  const { t } = useLocale();
  const { data, isLoading, isError, refetch } = useArticles();

  const raw = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
      ? data
      : [];

  // Exclude unpublished articles and items without valid slug
  const articles: ArticleItem[] = (raw as ArticleItem[]).filter(
    (a) => hasValidSlug(a.slug) && (a.status === 'published' || !a.status),
  );

  const featured = articles.length > 0 ? articles[0] : null;
  const rest = articles.slice(1);

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('articles.title') },
            ]}
            eyebrow={t('articles.label')}
            title={t('articles.title')}
            subtitle={t('articles.subtitle')}
            centered
          />
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <CardLoading count={6} />
          ) : isError ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-card/50 p-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive/80" />
              <p className="mb-4 text-sm font-semibold text-foreground">{t('common.error')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand-strong"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t('products.retry')}
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">{t('articles.not_found')}</div>
          ) : (
            <div className="space-y-10">
              {featured && <ArticleCard article={featured} featured />}
              {rest.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                  {rest.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}
