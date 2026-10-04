'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Sun } from 'lucide-react';
import { ProductPrice } from '@/components/products/public/ProductPrice';
import { resolveMediaUrl } from '@/lib/media-url';
import { useLocale } from '@/i18n';
import type { HomepageVisual, ProductListItem } from '@/types';

/**
 * Phase 12 — hero product stage.
 *
 * A real visual composition for the hero's focal zone (not a card image):
 * large product visual + radial solar light + shadow + glass information
 * panel + technical labels + product counter. Uses ONLY real CMS/product
 * data. When no product (or no image) exists it renders a deliberately
 * designed solar placeholder motif — never a fake product.
 */
export function HeroShowcase({
  products,
  visuals,
}: {
  products: ProductListItem[];
  visuals?: HomepageVisual[] | null;
}) {
  const { t } = useLocale();
  const active = products.length > 0 ? products[0] : null;
  const count = products.length;
  const floating = (visuals ?? []).filter((v) => v.image_url?.trim()).slice(0, 2);

  return (
    <div data-testid="hero-showcase" className="relative mx-auto w-full max-w-[560px]">
      {/* Radial solar field behind the stage */}
      <div
        aria-hidden
        className="hero-stage-glow absolute -inset-10 rounded-[3rem]"
      />
      {/* Technical measurement ticks */}
      <div aria-hidden className="absolute -top-5 start-0 flex items-center gap-1.5 text-white/25">
        <span className="h-px w-10 bg-gradient-to-l from-amber-300/60 to-transparent" />
        <span className="text-[10px] font-mono tracking-[0.3em]">ABRENERGY / SOLAR</span>
      </div>
      <div aria-hidden className="absolute -bottom-5 end-0 hidden items-center gap-1.5 text-white/25 sm:flex">
        <span className="text-[10px] font-mono tracking-[0.3em]">FIELD 01</span>
        <span className="h-px w-10 bg-gradient-to-r from-emerald-300/60 to-transparent" />
      </div>

      <div className="hero-stage-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        {active?.cover_image_url?.trim() ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={resolveMediaUrl(active.cover_image_url)}
              alt={active.title}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
              priority
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
            />
            {/* Product counter chip */}
            {count > 1 && (
              <p
                dir="auto"
                className="absolute end-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md"
              >
                1 / {count}
              </p>
            )}
            {/* Glass information panel */}
            <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-md">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/90">
                {t('products.featured_badge')}
              </p>
              <p data-testid="hero-product-title" className="font-heading text-lg font-bold leading-snug text-white">
                {active.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <ProductPrice price={active.price} size="sm" />
                <Link
                  href={`/products/${active.slug}`}
                  aria-label={`${active.title} — ${t('products.view_details')}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  {t('products.view_details')}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Designed empty state: solar motif, no fake product. */
          <div data-testid="hero-showcase-empty" className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 p-8 text-center">
            <span aria-hidden className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
              <span className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-gradient-to-l from-transparent via-amber-300/80 to-transparent" />
              <Sun className="relative h-12 w-12 text-amber-300/80" />
            </span>
            <span aria-hidden className="h-px w-40 bg-gradient-to-l from-transparent via-white/25 to-transparent" />
            <p className="max-w-xs text-sm leading-7 text-white/50">{t('home.featured_subtitle')}</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white"
            >
              {t('home.featured_cta')}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-emerald-400/10" />
      </div>

      {/* CMS floating visuals composed around the stage (never fabricated). */}
      {floating.map((v, i) => (
        <div
          key={v.id}
          aria-hidden
          data-testid="hero-floating-visual"
          className={`absolute hidden w-24 md:block ${i === 0 ? '-end-6 -top-8 rotate-3' : '-start-8 -bottom-8 -rotate-3'}`}
        >
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-xl shadow-black/60 backdrop-blur-sm">
            <Image
              src={resolveMediaUrl(v.image_url) || v.image_url}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              className="h-24 w-full object-cover opacity-80"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
