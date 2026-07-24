'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sun, Sparkles } from 'lucide-react';
import { useArticles } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';

function readingTime(html?: string): string {
  if (!html) return '1 min';
  const text = html.replace(/<[^>]*>/g, '').trim();
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function ArticleCard({ article, featured }: { article: Record<string, unknown>; featured?: boolean }) {
  return featured ? (
    <ScrollReveal variant="scale">
      <Link href={`/articles/${article.slug}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
          <div className="aspect-[2/1] md:aspect-[3/1] relative overflow-hidden">
            {(article as { cover_image_url?: string }).cover_image_url ? (
              <img src={(article as { cover_image_url: string }).cover_image_url} alt={article.title as string} loading="eager" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full"><Sun className="h-16 w-16 text-white/10" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">{(article as { category_title?: string }).category_title || 'Featured'}</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">{article.title as string}</h2>
            <p className="text-sm text-white/50 line-clamp-2 max-w-2xl">{(article as { short_description?: string }).short_description || ''}</p>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  ) : (
    <ScrollReveal variant="slide-up" delay={0.05}>
      <Link href={`/articles/${article.slug}`} className="group block h-full">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden h-full hover:border-white/[0.12] transition-all duration-500">
          <div className="aspect-[16/10] relative overflow-hidden">
            {(article as { cover_image_url?: string }).cover_image_url ? (
              <img src={(article as { cover_image_url: string }).cover_image_url} alt={article.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full"><Sun className="h-12 w-12 text-white/10" /></div>
            )}
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">{(article as { category_title?: string }).category_title || 'Article'}</p>
            <h3 className="font-heading font-semibold text-base text-white mt-1.5 line-clamp-2 group-hover:text-emerald-400 transition-colors duration-300">{article.title as string}</h3>
            <p className="text-xs text-white/35 mt-1.5 line-clamp-2">{(article as { short_description?: string }).short_description || ''}</p>
            <p className="text-xs text-white/20 mt-3">{new Date(article.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} · {readingTime((article as { content?: string }).content)}</p>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ArticlesPage() {
  const { data, isLoading } = useArticles();
  const articles = Array.isArray(data?.results) ? data.results : [];
  const featured = articles.length > 0 ? articles[0] : null;
  const rest = articles.slice(1);

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">
            Insights & Knowledge
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">
            Articles
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">
            Technical knowledge and the latest solar energy industry insights
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <CardLoading count={6} />
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-white/30">No articles published yet</div>
          ) : (
            <div className="space-y-10">
              {featured && <ArticleCard article={featured} featured />}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((a: Record<string, unknown>) => (
                  <ArticleCard key={a.id as string} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
