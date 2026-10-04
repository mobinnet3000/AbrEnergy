# Phase 12 — Homepage Visual Rebuild Report

Date: 2026-09-26. Scope: homepage VISUAL COMPOSITION ONLY (frontend).
No backend, migration, API, permission, i18n, SEO-architecture, preview,
media-picker, dependency, or Three.js change. No commit made (not requested).

> All listed prerequisite reports (§0 of the brief) were read before coding,
> and live homepage source was audited first. The audit is a separate
> document: `docs/reports/phase-12-homepage-visual-gap-audit.md`.
> Where reports and source differed, source won.

## 1. Status

COMPLETE. The homepage keeps its accepted CMS/backend foundation and gains
the recomposed visual composition: 2-zone RTL hero (text right / product
stage left), `HeroShowcase` focal stage with glass info panel, in-hero
floating-visual composition, strengthened featured spotlight stage, and a
designed empty state. All gates green (§12–§16). STOP after this report.

## 2. What was actually changed

1. `src/components/home/HeroShowcase.tsx` (NEW) — focal product stage:
   real `cover_image_url` via `resolveMediaUrl`, radial solar glow,
   technical tick labels, glass info panel (featured badge, title,
   `ProductPrice size="sm"`, detail CTA), `1 / N` counter chip, up to 2 CMS
   floating visuals around the stage, designed solar empty state
   (`hero-showcase-empty`, pure CSS/SVG + catalog CTA — never fake product).
2. `src/components/home/HeroSection.tsx` — recomposed into
   `grid lg:grid-cols-[1.05fr_0.95fr]`: text zone (eyebrow, H1 slogan,
   lead, chips, CMS CTAs — logic untouched) + visual zone (`HeroShowcase`
   with hook fallback when no CMS prop). `FloatingVisuals` now renders
   inside the hero; horizon light line added. Accepts optional `featured`
   + `visuals` props.
3. `src/app/[locale]/(public)/homepage-client.tsx` — passes
   `payload.featured_products` + `payload.visuals` into `HeroSection`;
   page-level `FloatingVisuals` removed (now hero-composed). Preview route
   inherits the same assembly.
4. `src/components/home/FeaturedProductsSection.tsx` — spotlight stage
   craft only (logic untouched): stage glow, `1 / N` + category glass chips
   on the image, shadow, measurement tick. Nav/wrap/dots/counter/swipe/RTL
   behavior byte-identical.
5. `src/components/home/index.ts` — exports `HeroShowcase`.
6. `src/app/globals.css` — `.hero-stage-glow` + `.hero-stage-panel`
   treatment + responsive rule. No palette change, no font change.
7. `src/components/home/phase-12-homepage-visual-rebuild.test.tsx` (NEW,
   12 tests) + audit doc + this report. Backend: zero files.

## 3. Files changed

Modified (5): `HeroSection.tsx`, `FeaturedProductsSection.tsx`,
`homepage-client.tsx`, `components/home/index.ts`, `globals.css`.
Created (3): `HeroShowcase.tsx`, `phase-12-homepage-visual-rebuild.test.tsx`,
`docs/reports/phase-12-homepage-visual-gap-audit.md` + this report.

## 4. CMS data dependencies (all CMS-driven, none hardcoded)

Hero copy/CTA labels/URLs, featured products + pricing + images,
categories, services, projects, articles, floating visuals, SEO,
section order/visibility. Frontend only composes.

## 5. Content population checklist (for the user — real data, no fakes)

1. Pin ≥2 published/public/active products with cover images as
   HomepageFeaturedProduct rows (drives hero stage + spotlight).
2. Upload 2–4 `HomepageVisual` media rows (enabled, with alt) for the
   hero floating composition.
3. Verify category tree active (drives taxonomy rail).
4. Publish services / non-cancelled projects / published articles as needed.
5. Fill hero eyebrow/CTAs, section titles, SEO in Homepage Studio.

## 6. Verification

- Real CMS data during verification: NONE available (no Django running,
  empty backend by data-safety rules) — composed stages asserted via
  CMS-shaped in-memory fixtures + SSR structure; stated honestly.
- Desktop/mobile/RTL: structural audit only — stacked grid, `flex-wrap`
  CTAs/chips, `hidden md:block` floats, `overflow-hidden` sections, no
  fixed widths; 1440/1280/1024/768/430/390 covered by class audit, NOT by
  browser pixels (no automation available).
- Accessibility: exactly 1 H1 (asserted), labelled controls,
  `aria-current` dots, live counter, focus-visible rings, decorative
  `aria-hidden`, reduced-motion static paths, RTL chevron/keyboard.
- Animations preserved: Hero3D, CursorGlow, particles, ripple, gradients,
  ScrollReveal, TextReveal, parallax, tilt — all still mounted, no new lib.
- Tests: 53 files / 483 passed (52/471 baseline + 12 new; 24 homepage +
  22 phase-11 tests unmodified and green).
- tsc: exit 0. Lint: 0 errors / 55 warnings (baseline count; zero in new
  files). Build: PASS (Next 15.5.21, First Load JS 102 kB unchanged).
- Runtime (canonical): dev stopped → :3000 free → build → prod :3100:
  `/fa` 200 (80,767 B, 1 H1, slogan treatment, `dir=rtl`, `hero-showcase`
  + `hero-cta-primary` in SSR) + `/fa/products`, `/sitemap.xml`,
  `/robots.txt` all 200 → prod stopped → ONLY `.next` deleted → exactly
  ONE dev chain → `/fa` :3000 = 200, 1 H1; :3100 free.

## 7. Remaining visual gaps / limitations

1. No browser-pixel or AT walkthrough (no automation) — operator-side.
2. Stage imagery depends on real CMS media (currently empty → designed
   empty states, verified structurally).
3. `HomepageVisual.link_url` still stored-but-unrendered (inherited a11y).
4. Category/services/projects/articles visuals unchanged beyond existing
   Phase 11 treatment (accepted as sufficient).

## 8. Next recommended step

Operator task only: populate real CMS content per §5, then do a
device-lab + screenshot pass (1440/1280/1024/768/430/390, RTL) and
confirm. Do NOT start Phase 13 automatically.
