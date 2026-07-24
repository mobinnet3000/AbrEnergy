'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Eye, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import type { Article } from '@/types';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', slug],
    queryFn: () => axiosInstance.get(`/articles/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error('Failed to load article'); }, [error]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">Failed to load article</div>;
  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>;
  if (!article) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">Article not found</div>;

  return (
    <div className="bg-black text-white">
      {/* Reading progress */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-gradient-to-r from-emerald-500 to-teal-400 origin-left" style={{ scaleX }} />

      {/* Hero */}
      <section className="relative pt-28 pb-10 md:pt-36 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <Link href="/articles" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> Back to Articles
          </Link>
          <div className="max-w-3xl">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">
              {article.category_title || 'Article'}
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.05]">
              {article.title}
            </motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-wrap gap-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {article.author_name}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(article.publish_date || article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> {article.view_count} views</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {article.cover_image_url && (
        <section className="container-page pb-10 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="rounded-2xl overflow-hidden border border-white/[0.04]">
            <img src={article.cover_image_url} alt={article.title} className="w-full aspect-[2/1] object-cover" loading="eager" />
          </motion.div>
        </section>
      )}

      {/* Content */}
      <section className="pb-20 md:pb-32">
        <div className="container-page max-w-3xl mx-auto">
          <div className="prose prose-invert prose-emerald max-w-none [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h2]:font-heading [&_h3]:font-heading [&_p]:text-white/60 [&_p]:leading-relaxed [&_li]:text-white/60 [&_strong]:text-white [&_a]:text-emerald-400 [&_a:hover]:text-emerald-300 [&_blockquote]:border-emerald-500/30 [&_blockquote]:text-white/50 [&_code]:bg-white/5 [&_code]:text-emerald-300 [&_pre]:bg-white/5 [&_pre]:border [&_pre]:border-white/[0.06] [&_img]:rounded-xl">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>

          {article.tags?.length > 0 && (
            <ScrollReveal variant="fade">
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/[0.04]">
                {article.tags.map((t: { id: string; title: string }) => (
                  <span key={t.id} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs text-white/40">{t.title}</span>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* CTA */}
          <ScrollReveal variant="scale">
            <div className="mt-16 p-8 md:p-10 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm text-center">
              <p className="font-heading font-semibold text-lg text-white mb-2">Interested in Solar Energy?</p>
              <p className="text-sm text-white/35 mb-6">Contact our team to learn how we can help you with your renewable energy project.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
                Contact Us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
