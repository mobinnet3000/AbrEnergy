# Phase 12.7 — Homepage Product Experience, Visual QA & Theme Consistency Report

Date: 2026-10-12. Scope: frontend homepage only. Backend: zero files changed.
Status: PARTIALLY ACCEPTED (code + DOM/probe verified; human pixel eyeball pass pending — this agent cannot render images).

## 1. Initial defects and evidence

1. Hierarchy inversion: `FALLBACK_ORDER` put `featured_products` before `categories`, and CMS ordering could place anything anywhere. Required order is hero → categories → featured.
2. Duplicate category navigation: `showcase-category-rail` filter strip lived INSIDE `HomepageShowcase` (under main frame) while dedicated `ProductRailSection` rendered separately. Same taxonomy surfaced twice, cramped stage.
3. Rail cards too narrow (`w-[168px]`–`220px`): titles/prices cramped, not premium.
4. Dark contrast gaps: featured badge `text-amber-300` unreadable on light card image area; footer links `dark:text-white/25`, bottom bar `dark:text-white/15`; section body copy `dark:text-white/40` / `/35` washed; project dark card `dark:bg-black/40` vs unified `neutral-950`.
5. Slogan undersized on desktop (`text-4xl→7xl`, container `max-w-4xl`/`88rem`).
6. Categories section visually weak (`bg-neutral-50`, `py-12`, small heading).
7. Preview taxonomy only 2 categories, not covering 8 required families.

## 2. Source files changed and why

- `src/app/[locale]/(public)/homepage-client.tsx` — required hierarchy enforced: `['hero','categories','featured_products',...rest]` regardless of CMS order. Rest keep CMS order.
- `src/components/home/HomepageShowcase.tsx` — inner category strip removed (markup + selection/keyboard logic + unused imports). Showcase = dominant stage + instant panel only. `categories` prop kept optional for API compat.
- `src/components/home/HeroSection.tsx` — wider container (`xl:max-w-[96rem]`), slogan `text-5xl→2xl:text-8xl`, `max-w-5xl`.
- `src/components/home/ProductRailSection.tsx` — premium treatment: white/950 surfaces, `py-14/20`, eyebrow pill, `text-3xl/4xl` heading, emerald CTA.
- `src/components/home/FeaturedProductsSection.tsx` — rail cards `w-[240px]→xl:w-[300px]`.
- `src/lib/homepage-preview.ts` — 8 preview families matching required taxonomy; 10 products covering regular/discounted/contact/scheduled; labelled `پیش‌نمایش`, slugs `preview-`, dev-only guard unchanged.
- `src/components/products/public/ProductCard.tsx` — featured badge dark-adaptive (`amber-700` light / `amber-300` dark).
- `src/components/products/public/ProductCategoryCard.tsx` — child pills dark-adaptive.
- `src/components/layout/footer.tsx` — links `dark:text-neutral-300`, bottom bar `dark:text-neutral-400`.
- `ArticlesSection/ContactSection/ProjectsSection/ServicesSection.tsx` — body copy `dark:text-white/40`→`dark:text-neutral-300`; project card `dark:bg-black/40`→`dark:bg-neutral-900`.
- Tests: new `phase-12-7-homepage-product-experience.test.tsx` (5); updated `phase-12-1` (strip absent, hierarchy, rail width), `phase-12-3` (slogan/cat widths), `phase-12-5` (slogan), `phase-12-6` (masthead), `phase-11` (pinned order + real categories).

## 3. Final hierarchy and category behavior

1. Global header — sole nav (7 items, verified 1 `header nav`).
2. Brand masthead — H1 `طلوع آفتاب، از خانه شماست` (`text-5xl→8xl`), lead, CTAs, chips.
3. Dominant showcase — stage (`2.1fr/0.9fr`, `21/11` xl) + instant panel. No inner strip.
4. Category navigation DIRECTLY BELOW — dedicated `product-rail` section, real ids/slugs, pills + cards, RTL arrows/keyboard, horizontal scroll, no page overflow.
5. Featured rail directly after — spotlight + premium cards, canonical `ProductPrice`, real detail routes.
6. Rest: services/calculator/projects/articles/contact/footer in CMS order.

## 4. Light/dark verification

- Toggle probe: click flips `.dark` false→true, hero gradient light↔charcoal, persists after reload.
- All sections carry `dark:` surfaces; no forced `bg-black` light sections; unified `neutral-950` dark.
- Contrast fixes listed in §2. No instrumental contrast-meter run — human check advised.

## 5. Screenshots (`docs/reports/phase-12.7-screenshots/`, 18 PNGs)

- `light-preview-{1920x1080,1600x900,1440x900,1280x800,1024x768,768x1024,430x932,390x844}.png`
- `dark-preview-{same 8}.png`
- `prod-empty-1440x900.png`, `prod-empty-390x844.png`
- Limitation (honest): this agent cannot render image pixels; composition claims rest on DOM rects/probes below, not eyeballing. Human review required.

Viewport rects (slogan / stage / categories / featured / overflow):
- 1920: 1024x250 / 1216x496 / below-stage / after-cats / 0
- 1600: same as 1920 / 0
- 1440: 1024x94 / 1216x496 / 0
- 1280: same as 1440 / 0
- 1024: 960x94 / 960x453 / 0
- 768: 720x78 / 720x493 / 0
- 430: 398x125 / 398x785 / 0
- 390: 358x125 / 358x738 / 0
- All: 1 H1, 1 header nav, order hero→categories→featured, zero page overflow, zero console errors (excluding 429 bursts).

## 6. Tests, typecheck, lint, build

- `vitest`: 62 files / 533 passed.
- `tsc --noEmit`: 0 errors.
- `eslint` on touched source files: 0 errors/warnings (repo-wide run polluted by stale `.next-prod*` build output — pre-existing, untouched).
- `next build` (isolated `.next-prod127`): success, shared JS 102 kB unchanged.
- Prod smoke (`:3100`): `/fa` 200 (83.6 kB, 1 H1, 0 `preview-` leak, 0 inner strip), `/fa/products` + sitemap + robots 200. Prod stopped after smoke; one dev server left on `:3000`.

## 7. Performance (method + numbers)

Method: `Measure-Command` + `Invoke-WebRequest` SSR timing (HTML document time, not full-page LCP); no LCP/CLS/INP rig in env — not claimed.
- Dev `/fa` warm: ~430–470 ms (preview on, richer DOM).
- Prod `/fa` SSR: 238 ms cold / 96 ms warm.
- Backend `/api/v1/homepage/`: 429 during screenshot bursts (anon 100/hour throttle, self-inflicted); page falls back to preview/empty by design. No throttle weakened.
- Hero3D stays lazy + idle + desktop-only + reduced-motion-off. No new deps. Fonts unchanged (Vazirmatn CDN, `display=swap`).

## 8. Known limitations / deferred

1. Human pixel eyeball pass over 18 PNGs outstanding (agent cannot view images).
2. Zero real CMS content — populated shots are labelled preview fixtures; no product photography exists.
3. No contrast-meter/axe/LCP/CLS/INP runs in this env.
4. Vazirmatn still Google-Fonts CDN (self-host follow-up).
5. Backend 429s under burst reloads (backend rate-limit concern, untouched).
6. Pre-existing uncommitted work from prior phases left intact; only §2 files touched.

## 9. Verdict: PARTIALLY ACCEPTED

Required hierarchy, category nav, rail, themes, tests, build, and runtime verified via DOM/probes. Final ACCEPTED awaits owner eyeball pass + real CMS content. Phase 13 NOT started. STOP.
