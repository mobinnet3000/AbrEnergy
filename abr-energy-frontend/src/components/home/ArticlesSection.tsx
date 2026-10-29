'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun } from 'lucide-react';
import { useArticles } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { CardLoading } from '@/components/shared';
import { homepageCopy } from '@/lib/homepage';
import { hasValidSlug } from '@/lib/slug';
import type { HomepageSection } from '@/types';

function ArticleCard({ article }: { article: Record<string, unknown> }) {
  const { t } = useLocale();
  const publishDate = typeof article.publish_date === 'string' && article.publish_date
    ? formatPublishDate(article.publish_date)
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="group"
    >
      <Link href={`/articles/${article.slug}`}>
        <div className="rounded-2xl border border-neutral-900/10 bg-neutral-50 overflow-hidden hover:border-emerald-700/30 hover:shadow-lg hover:shadow-emerald-700/10 transition-all duration-500 h-full dark:border-white/[0.06] dark:bg-white/[0.02] dark:backdrop-blur-sm dark:hover:border-white/[0.12] dark:hover:shadow-none">
          <div className="aspect-[16/9] relative overflow-hidden bg-neutral-100 dark:bg-white/[0.02]">
            {(article as { cover_image_url?: string }).cover_image_url ? (
              <img src={resolveMediaUrl((article as { cover_image_url: string }).cover_image_url)} alt={article.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-300 dark:text-white/10"><Sun className="h-12 w-12" /></div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-2 dark:text-emerald-400/80">
              {(article as { category_title?: string }).category_title || t('articles.label')}
            </p>
            <h3 className="font-heading font-semibold text-lg text-neutral-900 leading-snug group-hover:text-emerald-800 transition-colors duration-300 dark:text-white dark:group-hover:text-emerald-400">
              {article.title as string}
            </h3>
            <p className="text-sm text-neutral-600 mt-2 line-clamp-2 dark:text-neutral-300">
              {(article as { short_description?: string }).short_description || ''}
            </p>
            {/* Phase 11 — editorial publication line, only when the backend
                provides a date. Missing dates render nothing. */}
            {publishDate && (
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-300">
                <time dateTime={article.publish_date as string}>{publishDate}</time>
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Phase 11 — safe Persian date label; invalid input yields null. */
function formatPublishDate(iso: string): string | null {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('fa-IR', { dateStyle: 'medium' });
  } catch {
    return null;
  }
}

export function ArticlesSection({ cms }: {
  cms?: { items?: Record<string, unknown>[] | null; section?: HomepageSection | null; pending?: boolean } | null;
}) {
  const { t } = useLocale();
  // Phase 12.14 — skip the fallback fetch when the homepage payload supplies
  // article items (request-count hardening; same idiom as HeroSection).
  const hasCmsItems = cms?.items !== undefined && cms?.items !== null;
  const isPending = cms?.pending === true;
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ is_featured: 'true' }, { enabled: !hasCmsItems && !isPending });
  const hookArticles = Array.isArray(articlesData?.results) ? articlesData.results : (Array.isArray(articlesData) ? articlesData : []);

  if (cms?.section && cms.section.enabled === false) return null;

  // Phase 12.13 — drop articles without a slug (no blank/whitespace detail links).
  const articles = (hasCmsItems ? (cms.items as Record<string, unknown>[]) : hookArticles).filter((a: Record<string, unknown>) => hasValidSlug(a.slug));
  const loading = hasCmsItems ? false : articlesLoading;
  const title = homepageCopy(cms?.section?.title, t('home.articles_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.articles_subtitle'));

  if (!loading && articles.length === 0) return null;

  return (
    <section data-section="articles" data-testid="articles-editorial" aria-labelledby="homepage-articles-heading" className="relative py-16 md:py-24 overflow-hidden bg-white border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/[0.06]">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/50 to-transparent dark:from-neutral-950 dark:via-teal-950/10 dark:to-neutral-950" />

      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-[0.2em] mb-4 dark:text-emerald-400/80">{t('articles.label')}</p>
            <h2 id="homepage-articles-heading" className="font-heading text-3xl md:text-4xl font-bold text-neutral-950 dark:text-white">{title}</h2>
            <p className="text-neutral-600 text-base md:text-lg max-w-2xl mt-3 dark:text-neutral-300">{subtitle}</p>
          </div>
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950 transition-colors duration-300 dark:text-neutral-300 dark:hover:text-white">
            {t('common.view_all')} <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>

        {loading ? (
          <CardLoading count={3} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {articles.slice(0, 3).map((a: Record<string, unknown>, idx: number) => (
              <ArticleCard key={(a.id as string) || (a.slug as string) || `art-${idx}`} article={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
