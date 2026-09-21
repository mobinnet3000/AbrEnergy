# Phase 6 — Homepage Experience Report

Date: 2026-09-21. Scope: homepage experience only. All seven prerequisite
reports (00, 01, 02, 03, 04, 05.1, 05.2) were read before any change, and the
live homepage code was audited first (§2). No new backend API, no Homepage
CMS, no cart/checkout, no ar/en activation, no animation-system replacement.

## 1. Executive Summary

The AbrEnergy homepage is now a Persian-first company homepage assembled
from real backend content: brand hero («طلوع آفتاب، از خانه شماست»),
featured-products showcase (real `useFeaturedPublicProducts` + shared
`ProductCard`), backend-driven category rail, real Services API preview,
existing calculator teaser, real featured-projects proof, articles preview,
and contact CTA. The entire existing visual/animation system (Hero3D,
CursorGlow, particles, ripple, gradients, ScrollReveal, TextReveal,
parallax, tilt, dark/light theme) is preserved. Two content defects were
removed with documented justification: invented statistics in
`StatsSection` (unrendered, file kept) and invented English fallback
services (deleted). Verification: backend **115 passed**, frontend
**145/145** (121 prior intact + 24 new), `tsc` 0 errors, ESLint 0 errors /
55 warnings (63 → 55; zero warnings in Phase 6 files), `next build`
success, production `next start` smoke test 200 with Persian SSR title +
canonical. Live PostgreSQL/Redis NOT verified (no creds/infra) — same
limitation as Phases 1–5.2.

## 2. Before/After Homepage Architecture

Before (audited live code, `src/app/[locale]/(public)/page.tsx` + 8 sections):

| # | Section | Data source | Defect found |
|---|---------|-------------|--------------|
| 1 | HeroSection | `settings.hero_title` split + en fallback `"Powering the Future"` | No brand slogan; fa `hero_title_suffix` missing → English fallback rendered to fa users |
| 2 | StatsSection | Hardcoded `25 MW+ / 150+ / 10+ / 98%` | Invented statistics, no backend source (§5 violation) |
| 3 | AboutSection | `settings.about_us` + locale mission lines | OK; fa `about_title_prefix/highlight` missing → English fallback in fa heading |
| 4 | ServicesSection | Real API **but** hardcoded English fallback cards when empty | Fake services shown on empty backend |
| 5 | ProjectsSection | Real `useFeaturedProjects` | OK (renders empty shell when empty) |
| 6 | CalculatorSection | Static teaser → `/calculator` | OK |
| 7 | ArticlesSection | Real featured articles | Hardcoded English headings (`Insights`, `Latest Articles`, `View All`); loading skeleton unreachable (returned null while loading) |
| 8 | ContactSection | Static CTA → `/contact` | OK |

After (new information architecture):

| # | Section | Component | Data source |
|---|---------|-----------|-------------|
| 1 | Hero / brand | `HeroSection` (reworked copy, same visuals) | `home.hero_slogan` h1 + `settings.hero_subtitle`/`home.hero_lead` + CTAs `/products`, `/calculator` |
| 2 | Featured products | `FeaturedProductsSection` (NEW) | `useFeaturedPublicProducts` + `ProductCard`; hides when empty |
| 3 | Category navigation | `ProductRailSection` (NEW) | `usePublicProductCategories` + `ProductCategoryNavigation`; hides when empty |
| 4 | About | `AboutSection` (untouched code; locale keys fixed) | `settings.about_us` |
| 5 | Services | `ServicesSection` (fallback removed) | `useServices`; loading/error/hidden-empty states |
| 6 | Calculator teaser | `CalculatorSection` (preserved) | Static → `/calculator`, no logic duplicated |
| 7 | Projects proof | `ProjectsSection` (hide-on-empty) | `useFeaturedProjects`; hides when empty |
| 8 | Articles | `ArticlesSection` (Persian headings) | Featured articles; hides when empty |
| 9 | Contact CTA | `ContactSection` (preserved) | Static → `/contact` |
| — | Footer | `Footer` (untouched) | Existing |

`StatsSection` is no longer rendered (justification §11). Its file is kept
on disk — nothing was deleted.

## 3. Homepage Sections

- **Hero** (§4): slogan h1, lead, 3 generic point chips, dual CTA.
- **Featured Products** (§5): rail/carousel of real featured products.
- **Product/Category Navigation** (§6): backend taxonomy rail + cards.
- **Services** (§7): real API cards with tilt, no fallback.
- **Calculator** (§8): preserved teaser, CTA `/calculator`.
- **Projects** (§9): featured grid, hides when empty.
- **Contact CTA** (§10): preserved, dual CTA `/contact`.
- **Footer integration**: untouched; existing contact/consultation links kept.

## 4. Hero Implementation

- **Persian slogan**: `home.hero_slogan` = «طلوع آفتاب، از خانه شماست»,
  rendered as the page's single `h1` with gradient treatment via the
  existing `TextReveal` word animation.
- **Typography**: same `font-heading` scale as before
  (`text-5xl→lg:text-8xl`); slogan set with `leading-[1.05]` for Persian
  readability. No external/Nastaliq font was added — no suitable local
  font exists in the repo and a heavy external dependency was rejected
  per the brief.
- **Supporting copy**: `settings.hero_subtitle` first (CMS-driven), else
  `home.hero_lead` (safe generic wording: professional solar solutions,
  design/installation, home/business energy independence). Three chips
  (`hero_point_1/2/3`) communicate solar energy, energy independence,
  professional design & installation. No statistics, certifications,
  guarantees, or numbers invented.
- **Visuals**: `Hero3D` canvas, solar-grid overlay, gradient veils, and
  scroll parallax (`heroOpacity/heroScale/heroY`) all preserved. CTA
  change only: primary → `/products` («مشاهده محصولات»), secondary →
  `/calculator`. Forward chevron uses `ArrowLeft` (correct RTL forward,
  consistent with `ProductCard`).
- **Responsive**: `max-w-4xl` copy column, `flex-wrap` chips and CTAs —
  no overflow vectors; hero remains readable at 360px by inspection.
- **Asset architecture**: `src/lib/homepage-visuals.ts` isolates the
  floating-imagery slots (`HERO_FLOATING_SLOTS = []`,
  `hasHeroFloatingVisuals() === false`). No filenames invented; the hero
  renders the 3D scene until real assets land.

## 5. Featured Products

- **API/hook**: `useFeaturedPublicProducts` (existing, `productsApi.getFeatured`),
  `staleTime` 5 min inherited. Category titles resolved from the shared
  `usePublicProductCategories` cache (same query key as the rail —
  one network request for both sections).
- **ProductCard reuse**: the existing `ProductCard` (with Phase 5.2
  `next/image` cover) is rendered verbatim — no second card exists.
- **Pricing**: `ProductPrice` inside the card consumes only
  `price.effective` (`state/currency/final_price`); zero client math.
  Tests cover regular, discounted (line-through + badge, no `%`
  computed), and contact states.
- **Empty state**: loading → `CardLoading`; empty/error → section
  returns `null` (layout unbroken, no fake products).
- **Navigation**: scrollable rail (`overflow-x-auto snap-x`), desktop
  prev/next buttons + mobile swipe (native scroll, controls remain
  rendered and reachable). Scroll step = 80% viewport, `smooth` unless
  reduced motion (`auto` via `useReducedMotion`).
- **RTL behavior**: logical next = inline-end (negative `scrollBy` in
  RTL); keyboard `ArrowLeft→next / ArrowRight→prev` in RTL (mirrors
  `ProductGallery`); chevron icons chosen per direction without rotation
  hacks; counter-free (count conveyed by visible cards, not color).
- **CTA**: «مشاهده همه محصولات» → `/products`.
- **Accessibility**: `role="region" aria-roledescription="carousel"`,
  per-slide `role="group" aria-label=<title>`, buttons labeled
  `common.previous/next`, focus-visible rings, `aria-busy` while loading.
  (One duplicate-landmark trap was found during testing — the wrapping
  `<section>` also carried the same accessible name — and fixed by
  leaving the landmark name on the carousel region only.)

## 6. Product Categories

`ProductRailSection` wraps the existing `ProductCategoryNavigation`
(horizontal pill rail + root category cards with child pills). Labels,
slugs (`/products/category/<slug>`), hierarchy, and order all come from
the backend tree — no taxonomy constant was created; the four conceptual
groups from the brief resolve dynamically. Loading → skeleton;
empty → hidden. CTA «ورود به کاتالوگ» → `/products`. Unlimited depth is
inherited from `flattenCategoryTree`.

## 7. Services

Existing `servicesApi.list` / `useServices` consumed unchanged — no new
Services CMS, no admin redesign, no backend adjustment (the public list
endpoint was already suitable). Changes: (1) deleted the hardcoded
English fallback cards (they rendered fake services whenever the backend
was empty — a Persian-first and no-fake-data violation); (2) added
proper states — loading skeleton, `ErrorState` with retry
(`products.retry`), empty → hidden; (3) real rows link
`/services/<slug>` with backend `title`/`short_description`. Tilt hover,
`ScrollReveal` entrance, and card visuals preserved.

## 8. Calculator

`CalculatorSection` preserved as-is (motion teaser + CTA `/calculator` →
locale middleware resolves `/fa/calculator`). Terminology verified
against `locales/fa.json` calculator namespace (`title` = «محاسبه‌گر
خورشیدی», existing homepage copy already references system sizing,
battery, inverter, ROI). No calculator logic duplicated; no second
calculator created.

## 9. Projects

`ProjectsSection` consumes `useFeaturedProjects` unchanged. Changes:
hide-on-empty early return (previously rendered an empty shell section),
`aria-labelledby` on the section, and the `projects_subtitle` line now
renders under the heading. No capacities, locations, dates, or results
fabricated — cover/capacity/type/location all come from the backend row.
If the public projects API ever yields nothing, the homepage simply
skips this proof block.

## 10. Contact

`ContactSection` preserved: consultation CTA + quote CTA both → `/contact`
(middleware resolves locale). Contact details themselves live in the
existing contact page/Footer — nothing was duplicated or hardcoded into
the homepage.

## 11. Animation / Motion

- **Reused**: Hero3D, CursorGlow, FloatingParticles, MouseRipple,
  GradientMesh, ScrollReveal, TextReveal, parallax (`useScroll /
  useTransform` in hero + about), Services 3D tilt, ScrollProgress,
  PageTransition — all untouched and still mounted on the homepage.
- **Preserved with config addition**: `CursorGlow` section-color map
  gained `featured`/`categories` entries (additive; existing colors
  unchanged) so the glow stays section-aware on the new blocks.
- **New motion**: only existing primitives — `motion.div` entrances and
  the rail `scrollBy` transition. No new animation library, no second
  architecture.
- **Reduced-motion**: FloatingParticles and CursorGlow already bail on
  `prefers-reduced-motion`/mobile (verified by code read); carousel uses
  `useReducedMotion` (instant scroll); `globals.css` kills CSS
  animations/noise/ripple under `prefers-reduced-motion`.
- **Obsolete ruling — StatsSection**: hardcoded `25 MW+ / 150+ / 10+
  / 98%` with no backend source directly violates §5 ("do NOT invent
  technical claims, statistics…"). The component is unrendered from the
  homepage but its file is kept (no deletion), so a future CMS-backed
  stats block can reuse the visual design with real numbers.

## 12. Responsive Design

- Desktop (1280+): full hierarchy — hero, rail, 4-col category grid,
  3-col services/projects, CTA panels (verified via build + smoke test).
- Tablet (768/1024): grids collapse (`md:2 / lg:3-4`), rails scroll
  horizontally, section headers stack (`flex-col md:flex-row`).
- Mobile (360/390): rails `overflow-x-auto snap-x`; cards fixed
  `w-[270px]→sm:320px` snap targets (touch-friendly); CTAs `flex-wrap`;
  no fixed page widths; `overflow-hidden` on sections prevents bleed.
- Device-lab pass remains operator-side (§31 [O] items).

## 13. RTL / Persian

- `/fa` RTL preserved; exactly one `h1` (slogan); `h2` per section with
  `aria-labelledby` where no nested landmark exists.
- Fixed 4 English leaks into Persian: `hero_title_suffix`, 
...[truncated 7375 chars]