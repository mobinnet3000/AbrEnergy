'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sun } from 'lucide-react';
import { useArticles } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';

function ArticleCard({ article }: { article: Record<string, unknown> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="group"
    >
      <Link href={`/articles/${article.slug}`}>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition-all duration-500 h-full">
          <div className="aspect-[16/9] relative overflow-hidden">
            {(article as { cover_image_url?: string }).cover_image_url ? (
              <img src={(article as { cover_image_url: string }).cover_image_url} alt={article.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/10"><Sun className="h-12 w-12" /></div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest mb-2">
              {(article as { category_title?: string }).category_title || 'Article'}
            </p>
            <h3 className="font-heading font-semibold text-lg text-white leading-snug group-hover:text-emerald-400 transition-colors duration-300">
              {article.title as string}
            </h3>
            <p className="text-sm text-white/40 mt-2 line-clamp-2">
              {(article as { short_description?: string }).short_description || ''}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ArticlesSection() {
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ is_featured: 'true' });
  const articles = Array.isArray(articlesData?.results) ? articlesData.results : (Array.isArray(articlesData) ? articlesData : []);

  if (articles.length === 0) return null;

  return (
    <section data-section="articles" className="relative py-28 md:py-36 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-teal-950/5 to-black" />
      
      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-4">Insights</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Latest Articles</h2>
          </div>
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors duration-300">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {articlesLoading ? (
          <CardLoading count={3} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {articles.slice(0, 3).map((a: Record<string, unknown>) => (
              <ArticleCard key={a.id as string} article={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
