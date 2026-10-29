# Phase 12.6 — Homepage Art Direction Report

Date: 2026-10-11. Status: PARTIALLY ACCEPTED (code + DOM verified; human eyeball pass pending — this agent cannot render images).

Reference images: absent from repo. No pixel comparison claimed. Spec-driven work only.

## 1. Defects found

1. Header transparent + white text on light hero — unreadable at top. Dead `solidHeader`/`scrolled` branches.
2. Hero split 2-column: H1 squeezed beside showcase, small on wide screens.
3. Showcase grid 1.65fr/0.85fr — stage not dominant. Titles sm, price sm.
4. Slogan drop-shadow tuned for dark only — muddy on light.
5. Lower dark sections mixed `dark:bg-black` vs `dark:bg-neutral-950`.
6. Duplicate `.hero-slogan-display` CSS block.

## 2. Design decisions

- Header always solid, h-14/md:h-16, single 7-item nav, no hero duplicate strip.
- Hero: centered masthead (eyebrow, H1 4xl-7xl, lead, CTAs, chips) above full-width dominant showcase.
- Showcase grid 2.1fr/0.9fr, stage aspect 21/11 on xl, titles lg:text-2xl, price md.
- Dark surfaces unified to neutral-950. Light slogan shadow softened. No new deps. All animations kept.
- Preview fixtures untouched (dev-only, labelled, prod-isolated).

## 3. Files changed

- `src/components/layout/header.tsx` — always-solid, slimmer, dead branches removed.
- `src/components/home/HeroSection.tsx` — centered masthead + dominant stage.
- `src/components/home/HomepageShowcase.tsx` — wider ratio, taller stage, bigger type.
- `src/app/globals.css` — light slogan shadow, duplicate block merged.
- `ArticlesSection/ContactSection/ProjectsSection.tsx` — dark:bg-neutral-950.
- New `phase-12-6-homepage-art-direction.test.tsx` (4 tests).

## 4. Preview

Unchanged from 12.4: 2 cats, 6 products (regular/discounted/contact/scheduled), labelled, slug `preview-`, dev-only flag, NODE_ENV guard. Prod HTML has zero `preview-` strings. Empty CMS renders designed empty states (verified prod-empty shots).

## 5. Viewports (DOM rects, prodempty + dev-preview)

| Viewport | H1 rect | Stage rect | Overflow |
|---|---|---|---|
| 1920x1080 | 896x94 @y154 | 1216x523 @y485 | 0 |
| 1600x900 | 896x94 | 1216x523 | 0 |
| 1440x900 | 896x94 | 1216x523 | 0 |
| 1280x800 | 896x94 | 1216x523 | 0 |
| 1024x768 | 896x78 | 960x411 | 0 |
| 768x1024 | 720x62 | 720x241 | 0 |
| 430x932 | 398x94 | 398x482 | 0 |
| 390x844 | 358x94 | 358x473 | 0 |

Stage now widest element on desktop. Mobile stacks cleanly. Pixel beauty unverified by eye.

## 6. Themes

Toggle click flips `.dark` false->true and back. All sections carry `dark:` surfaces, unified neutral-950. No forced `bg-black` light-mode sections. Contrast not instrumentally measured.

## 7. Tests / build / perf

- `npm test`: 61 files / 528 pass (524 + 4 new).
- `npm run typecheck`: clean. `npm run lint`: 0 errors, 55 warnings (pre-existing).
- `next build` isolated `.next-prod126`: success, shared JS 102 kB unchanged.
- Prod SSR `/fa`: cold 233ms / warm 122ms, 83.6 kB, 1 H1, 0 preview leak. Routes /fa /fa/products /sitemap.xml /robots.txt all 200.
- Dev warm `/fa`: ~332ms.
- Homepage API under burst: 429 (anon throttle, dev-only, page falls back to preview/empty — by design).
- No LCP/CLS/INP rig in env — not claimed. Hero3D stays lazy + idle + desktop-only + reduced-motion-off. No new deps.
- UX probes: 7 nav links correct order, dup strip absent, RTL, instant next changes title, category select changes stage, Tab focus outline 3px, reduced-motion H1 painted + no canvas.

## 8. Screenshots

`docs/reports/phase-12.6-screenshots/` (13 PNGs): 8 dev-preview light viewports, 3 dev-preview dark (1920/1440/390), 2 prod-empty (1440/390). Captured via headless Chrome, byte sizes verified. Pixel inspection NOT done by this agent — owner eyeball pass required.

## 9. Limitations / remaining

1. Human visual review of 13 PNGs outstanding.
2. Zero real CMS content — all populated shots are labelled preview fixtures; no product photography exists.
3. No contrast-meter / axe run. No LCP/CLS/INP numbers.
4. Vazirmatn still Google-Fonts CDN (self-host follow-up).
5. Backend 429s under burst reloads (backend rate-limit concern, untouched).
6. 25 modified files include 12.5 leftovers — only §3 files touched by 12.6.

Phase 13 NOT started. STOP.
