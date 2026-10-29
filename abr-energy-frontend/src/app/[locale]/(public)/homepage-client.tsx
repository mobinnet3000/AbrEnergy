'use client';
import { Fragment } from 'react';
import {
  CursorGlow, HeroSection, AboutSection,
  FloatingParticles, MouseRipple, GradientMesh,
  ServicesSection, ProjectsSection, ArticlesSection,
  CalculatorSection, ContactSection, FeaturedProductsSection,
  ProductRailSection,
} from '@/components/home';
import { useHomepage } from '@/hooks/use-api';
import { homepageSection } from '@/lib/homepage';
import { useLocale } from '@/i18n';
import type { HomepagePayload, HomepageSectionKey } from '@/types';

// Pre-CMS section order (matches the Phase 6 assembly). Once the CMS
// payload arrives, `sections[].order` takes over; AboutSection (settings-
// driven, not a CMS section) keeps its slot right after categories.
const FALLBACK_ORDER: HomepageSectionKey[] = [
  'hero',
  'categories',
  'featured_products',
  'services',
  'calculator',
  'projects',
  'articles',
  'contact',
];

function sectionKeyOf(s: { key: string }): HomepageSectionKey | null {
  return (FALLBACK_ORDER as string[]).includes(s.key) ? (s.key as HomepageSectionKey) : null;
}

/**
 * Phase 7 — CMS-driven homepage assembly. Each section receives its CMS
 * slice when the payload is available and falls back to its pre-CMS data
 * source otherwise, so the page renders identically before editors
 * publish anything. Overlays and animation components are untouched.
 *
 * Phase 8.1 — optional `previewPayload` reuses this exact assembly for the
 * token-gated preview route (`/[locale]/preview/homepage?token=...`). When
 * provided, it takes precedence over the public `useHomepage` query; when
 * omitted, behavior is byte-identical to Phase 7.
 */
export function HomepageClient({ previewPayload }: { previewPayload?: HomepagePayload | null }) {
  const { data, isLoading } = useHomepage({ enabled: !previewPayload });
  const payload = (previewPayload ?? data) as HomepagePayload | undefined;
  const isCmsPending = !previewPayload && isLoading;

  const orderedKeys: HomepageSectionKey[] = payload?.sections?.length
    ? [...payload.sections]
        .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
        .map((s) => sectionKeyOf(s))
        .filter((k): k is HomepageSectionKey => k !== null)
    : [...FALLBACK_ORDER];
  // Phase 12.11 — required hierarchy: hero (masthead + showcase) first,
  // featured products DIRECTLY BELOW the showcase, THEN the solutions /
  // category navigation ("راهکارها، متناسب با نیاز شما"). Remaining
  // sections keep CMS order.
  const keys = (() => {
    const base = (orderedKeys.length > 0 ? orderedKeys : [...FALLBACK_ORDER]).filter(
      (k) => k !== 'hero' && k !== 'categories' && k !== 'featured_products',
    );
    return ['hero', 'featured_products', 'categories', ...base] as HomepageSectionKey[];
  })();

  const renderSection = (key: HomepageSectionKey) => {
    switch (key) {
      case 'hero':
        return (
          <HeroSection
            hero={payload?.hero ?? null}
            featured={payload ? payload.featured_products : undefined}
            visuals={payload ? payload.visuals : undefined}
            categories={payload ? payload.categories : undefined}
          />
        );
      case 'featured_products':
        return (
          <FeaturedProductsSection
            cms={payload ? { items: payload.featured_products, section: homepageSection(payload, key) } : (isCmsPending ? { items: null, pending: true, section: null } : null)}
          />
        );
      case 'categories':
        // Phase 12.11 — About follows the solutions/category section so the
        // featured rail sits directly above "راهکارها، متناسب با نیاز شما".
        return (
          <Fragment>
            <ProductRailSection
              cms={payload ? { items: payload.categories, section: homepageSection(payload, key) } : (isCmsPending ? { items: null, pending: true, section: null } : null)}
            />
            <AboutSection />
          </Fragment>
        );
      case 'services':
        return (
          <ServicesSection
            cms={payload ? { items: payload.services, section: homepageSection(payload, key) } : (isCmsPending ? { items: null, pending: true, section: null } : null)}
          />
        );
      case 'calculator':
        return <CalculatorSection cms={payload?.calculator ?? null} />;
      case 'projects':
        return (
          <ProjectsSection
            cms={payload ? { items: payload.projects, section: homepageSection(payload, key) } : (isCmsPending ? { items: null, pending: true, section: null } : null)}
          />
        );
      case 'articles':
        return (
          <ArticlesSection
            cms={payload ? { items: payload.articles, section: homepageSection(payload, key) } : (isCmsPending ? { items: null, pending: true, section: null } : null)}
          />
        );
      case 'contact':
        return <ContactSection cms={payload?.contact ?? null} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col noise-overlay">
      <GradientMesh />
      <FloatingParticles />
      <MouseRipple />
      <CursorGlow />
      {/* Phase 12 — floating visuals are composed inside the hero
          (HeroSection), not scattered at page level. */}

      {keys.map((key) => (
        <Fragment key={key}>{renderSection(key)}</Fragment>
      ))}
    </div>
  );
}
