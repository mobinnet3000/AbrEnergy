# Phase 12.1 — Homepage Reference-Matching Rebuild Report

Date: 2026-09-26. Scope: homepage FIRST-VIEWPORT recomposition + product-rail
density (frontend only). No backend, migration, API, permission, i18n
activation, SEO-architecture, preview, media-picker, dependency, or Three.js
change. No commit made (not requested). STOP after this report.

> Prerequisite reports (Phase 6, 7, 7.5, 11, 12, gap audit) were read before
> coding and live source was audited first. Where reports and source
> differed, source won. The two user visual references were NOT present as
> files in the repo — the textual specification (§2–§13) is the source of
> truth used here, stated honestly.

## 1. Reference B gap analysis (before → after)

| # | Requirement | Before (Phase 12) | After (12.1) |
|---|---|---|---|
| B1 | Light editorial first viewport | FAIL — full-screen dark hero (`min-h-screen bg-black`) | Light composition (`#f4f5f1`, white frames, `border-2 neutral-900`) in `HeroSection` |
| B2 | Slogan «طلوع آفتاب، از خانه شماست» in first viewport | WEAK — huge hero pushed meaning below fold | Compact brand zone (H1 `text-3xl→5xl`) at top of hero; test-guarded |
| B3 | Intended RTL nav under brand zone | FAIL — only global dark header nav | `showcase-nav` strip: خانه/محصولات/خدمات/پروژه‌ها/دانلودها/محاسبه‌گر آفگرید/تماس — real routes only |
| B4 | Main visual frame + instant panel grid | FAIL — single text column + dark stage | `HomepageShowcase`: main frame (right/RTL) + «پیشنهاد لحظه‌ای» panel (left, subordinate) |
| B5 | Category strip below main visual | FAIL — generic pills far below | `showcase-category-rail`: real ids, active state, keyboard/touch, drives main visual |
| B6 | No giant empty hero | FAIL — `min-h-screen`, `py-28/32` | Compact: `pt-24/28` (fixed-header clearance) + `pb-8/10`, no min-height |
| B7 | Compact header | PASS (kept `h-16/md:h-20` global header, untouched) | Preserved |
| B8 | White bg / dark borders / green + restrained red accents | FAIL — all-dark | Light frames + emerald CTAs + single red promo badge in instant panel |

## 2. Reference A product-rail gap analysis

| # | Requirement | Before | After |
|---|---|---|---|
| A1 | Many products visible at once | FAIL — `w-[270px]/sm:320px` (~3 visible) | `w-[168px]/sm:188/lg:208/xl:220` (~5–6 desktop, 3–4 tablet, 1–2 mobile) |
| A2 | Per-item structure (image/title/cont/orig/discount-badge/final) | PASS (shared `ProductCard`) | Untouched; rail-only CSS tightening (`.product-rail-dense`) |
| A3 | Price states (regular/discounted/contact/hidden) | PASS (`ProductPrice`, zero client math) | Untouched; asserted in new tests |
| A4 | Rail controls/RTL/keyboard/touch/reduced-motion | PASS | Byte-identical logic |

## 3. CMS capability assessment (no backend change)

The current Homepage CMS **can** represent the reference composition:

- Main stage: `featured_products` (cover/title/price/slug) — reused.
- Instant panel: featured products (cycles list) + `HomepageVisual` media — composed, no new model.
- Category → visual: first featured product with `category == selected id` (public category list carries no cover of its own — documented limitation, CMS-driven fallback to first featured product, then designed empty state).
- Nav/CTAs/copy/ordering/visibility: existing `HomepageSection` + `HomepageConfig` + `SiteSettings` — reused.
- `HomepageVisual.link_url` remains stored-but-unrendered (inherited a11y decision).

**Backend changes: none. Migrations: none.** Optional future additive
enhancements (NOT implemented): `cover` on the public category list
serializer; optional title/description/product-FK on `HomepageVisual` for a
fully editor-curated instant panel.

## 4. Frontend changes (exact files)

Modified (7):

1. `abr-energy-frontend/src/components/home/HeroSection.tsx` — rewritten
   composition (same CMS logic/props + new `categories` prop): light
   editorial, compact brand zone (H1 + lead + chips + CTAs, same testids),
   `showcase-nav`, `HomepageShowcase`; `Hero3D` kept mounted at 14%
   opacity (subordinate, not deleted); `FloatingVisuals` still in-hero.
2. `abr-energy-frontend/src/components/home/FeaturedProductsSection.tsx` —
   rail density only (widths/gaps + `product-rail-dense` class).
3. `abr-energy-frontend/src/app/[locale]/(public)/homepage-client.tsx` —
   passes `payload.categories` into hero (preview route inherits).
4. `abr-energy-frontend/src/components/home/index.ts` — exports
   `HomepageShowcase` (`HeroShowcase` preserved/exported).
5. `abr-energy-frontend/src/app/globals.css` — `.showcase-light`,
   `.showcase-stage-glow`, `.product-rail-dense` (no palette/font change).
6. `abr-energy-frontend/locales/{fa,ar,en}.json` — +3 keys each
   (`nav.downloads`, `nav.calculator_offgrid`, `home.instant_offer`;
   fa-first, ar/en parity).
7. (Report) this file.

Created (2): `src/components/home/HomepageShowcase.tsx`,
`src/components/home/phase-12-1-homepage-reference-match.test.tsx`
(11 tests).

Route mapping note: دانلودها → `/gallery` (site's media hub; no dedicated
downloads page exists and none was invented); off-grid calculator → existing
`/calculator`. Global header/navigation untouched.

## 5. Real CMS data used / fixture-only data

Real CMS data during verification: NONE available (no Django running;
backend empty by data-safety rules). All composition asserted via
CMS-shaped in-memory fixtures + SSR structure. No fake production content
seeded; empty states render designed placeholders + catalog CTA.

## 6. Verification

- Tests: **54 files / 494 passed** (53/483 baseline + 11 new; all prior
  homepage/phase-11/phase-12 tests unmodified and green).
- tsc: exit 0. Lint: 0 errors / 55 warnings (baseline count; zero in new files).
- Build: PASS (Next 15.5.21; shared First Load JS 102 kB unchanged).
- Runtime (canonical): dev stopped → :3000 free → build → prod :3100: `/fa`
  200 (1 H1, slogan, `dir="rtl"`, `showcase-nav` + `hero-showcase` +
  `instant-offer-panel` in SSR; category strip correctly absent on empty
  backend) + `/fa/products`, `/sitemap.xml`, `/robots.txt` 200 → prod
  stopped → :3100 free → ONLY `.next` deleted → exactly ONE dev chain →
  `/fa` :3000 = 200, 1 H1, showcase markers in SSR.
- RTL: logical props, RTL chevron/keyboard mapping, `aria-current` /
  `aria-pressed`, labelled controls, live counters, focus-visible rings,
  reduced-motion static paths, single H1 — all asserted in tests.
- Animations preserved: Hero3D (mounted, subordinate), CursorGlow,
  particles, ripple, gradients, ScrollReveal, TextReveal, tilt — all still
  mounted; no new library.

## 7. Remaining visual gaps

1. **Browser pixel verification unavailable** — no automation in this
   environment (no playwright/puppeteer); viewport claims (1440/1280/1024/
   768/430/390) are structural (stacked grid, `flex-wrap`, `overflow-x-auto`
   rails, `hidden md:block` floats, `overflow-hidden` sections) — operator
   screenshot pass still required.
2. Stage/instant imagery depends on real CMS media (currently empty →
   designed empty states, SSR-verified).
3. Lower sections stay dark while the first viewport is light — an
   intentional editorial handoff; confirm taste in the screenshot pass.
4. Category → visual uses product-in-category (no category cover in the
   public list payload); see §3 for the optional additive enhancement.

## 8. Exact next step

Operator task only: populate real CMS content (≥2 featured products with
covers, category tree, 1–2 HomepageVisual rows, hero/section copy), then do
the device-lab screenshot pass (1440/1280/1024/768/430/390, RTL) against
References A/B. Do NOT start another phase automatically.
