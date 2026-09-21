'use client';
import { Fragment } from 'react';
import {
  CursorGlow, HeroSection, AboutSection,
  FloatingParticles, MouseRipple, GradientMesh,
  ServicesSection, ProjectsSection, ArticlesSection,
  CalculatorSection, ContactSection, FeaturedProductsSection,
  ProductRailSection, FloatingVisuals,
} from '@/components/home';
import { useHomepage } from '@/hooks/use-api';
import { homepageSection } from '@/lib/homepage';
import type { HomepagePayload, HomepageSectionKey } from '@/types';

// Pre-CMS section order (matches the Phase 6 assembly). Once the CMS
// payload arrives, `sections[].order` takes over; AboutSection (settings-
// driven, not a CMS section) keeps its slot right after categories.
const FALLBACK_ORDER: HomepageSectionKey[] = [
  'hero',
  'featured_products',
  'categories',
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
 */
export function HomepageClient() {
  const { data } = useHomepage();
  const payload = data as HomepagePayload | undefined;

  const orderedKeys: HomepageSectionKey[] = payload?.sections?.length
    ? [...payload.sections]
        .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
        .map((s) => sectionKeyOf(s))
        .filter((k): k is HomepageSectionKey => k !== null)
    : FALLBACK_ORDER;
  const keys = orderedKeys.length > 0 ? orderedKeys : FALLBACK_ORDER;

  const renderSection = (key: HomepageSectionKey) => {
    switch (key) {
      case 'hero':
        return <HeroSection hero={payload?.hero ?? null} />;
      case 'featured_products':
        return (
          <FeaturedProductsSection
            cms={payload ? { items: payload.featured_products, section: homepageSection(payload, key) } : null}
          />
        );
      case 'categories':
        return (
          <Fragment>
            <ProductRailSection
              cms={payload ? { items: payload.categories, section: homepageSection(payload, key) } : null}
            />
            <AboutSection />
          </Fragment>
        );
      case 'services':
        return (
          <ServicesSection
            cms={payload ? { items: payload.services, section: homepageSection(payload, key) } : null}
          />
        );
      case 'calculator':
        return <CalculatorSection cms={payload?.calculator ?? null} />;
      case 'projects':
        return (
          <ProjectsSection
            cms={payload ? { items: payload.projects, section: homepageSection(payload, key) } : null}
          />
        );
      case 'articles':
        return (
          <ArticlesSection
            cms={payload ? { items: payload.articles, section: homepageSection(payload, key) } : null}
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
      <FloatingVisuals visuals={payload?.visuals ?? null} />

      {keys.map((key) => (
        <Fragment key={key}>{renderSection(key)}</Fragment>
      ))}
    </div>
  );
}
