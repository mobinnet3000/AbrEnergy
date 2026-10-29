# Phase 12.4 — Frontend Recovery, Homepage Visual Acceptance and Performance Report

Date: 2026-10-11. Scope: frontend recovery only (no backend change, no migration, no CMS rewrite, no Phase 13).

Status: PARTIALLY ACCEPTED — composition, themes, preview, console, and gates verified with real screenshots; owner eyeball pass on real product photography still pending (CMS holds zero products).

Reference images not present in workspace; textual spec used as authority (stated honestly, no pixel comparison claimed).

## 1. Initial root-cause diagnosis

1. Empty CMS, not broken routes: live backend `GET /api/v1/homepage/` 200 with `featured_products: []`, `categories: []`, `visuals: []`; `GET /api/v1/products/featured/` 200 `{"count":0,...}`. Reported `/api/products/featured/` 404 = missing `/api/v1` prefix, not missing view (`ProductFeaturedView` exists at `apps/products/api/v1/urls/products.py:8`).
2. Phase 12.3 changes verified present in tree (slogan restraint, showcase composition, tone props, light rail widths).
3. Slogan separated from showcase by brand-zone stack (eyebrow+H1+lead+chips+CTAs+nav) plus `truncate` clipping lead; Hero3D Canvas mounted synchronously (~600kB three.js) behind content.
4. Category rail conditional on `roots.length > 0` (hidden on empty CMS by design); product rails return null when empty — correct but owner saw blank page.
5. Theme toggle worked (next-themes chain intact) but showcase/cards used hard-coded light surfaces (`bg-white`, `bg-[#f4f5f1]`, `tone="light"`), so dark mode looked identical on homepage.
6. Prior C:\tmp122 PNGs genuine but stale (pre-12.3/12.4 tree, empty states); 12.4 re-captures everything post-fix.
7. Real perf signal: `/api/v1/homepage/` ~2.17s first hit; dev `/fa` ~0.5s warm; owner 9-10s = cold compile + sync WebGL + API wait + 100/hour anon throttle during review bursts.

## 2. Slogan/category/product placement — causes and fixes

- Slogan: kept single H1 `طلوع آفتاب، از خانه شماست`; SSR now plain text, TextReveal upgrades after mount (readable pre-hydration); `truncate` removed from lead (was clipping); motion H1 initial disabled pre-mount (no invisible first paint).
- Showcase: order brand bar, nav strip, showcase preserved; stage gets designed gradient fallback (`hero-showcase-fallback`) for cover-less products so frame never collapses blank.
- Category rail: stays inside showcase under main frame; renders when taxonomy exists; preview taxonomy fills dev-empty case.
- Hidden components: rails returning null on empty CMS is intended CMS-driven behavior; API errors now surface red dev-only banner (`homepage-backend-error`) instead of silent blank.
- Covered/clipped: Hero3D deferred (lazy + idle + desktop-only + reduced-motion off); floating visuals `hidden md:block`, pointer-events-safe; sections `overflow-hidden`.
ENDSEC1

## 3. Theme system — root cause and fix

- Chain audited: toggle (`header.tsx` setTheme) → `ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}` → `.dark` class → CSS vars → components. Toggle/persistence worked; homepage ignored it.
- Root cause: hard-coded light surfaces with no `dark:` variants across HeroSection, HomepageShowcase, FeaturedProductsSection, ProductRailSection, ProductCard, ProductCategoryCard, ProductCategoryNavigation, ProductPrice; `.showcase-light` CSS forced light slogan filter in both modes.
- Fix: `dark:` variants added to every homepage surface (hero `dark:bg-neutral-950`, frames `dark:border-white/20 dark:bg-neutral-900`, rails/pills/cards/prices/nav/CTA); slogan/glow CSS split light vs `.dark`; `tone="light"` kept with dark-adaptive internals (no JS theme branching, no hydration risk); provider unchanged (`defaultTheme="light"`, persistence intact).
- Proof: same viewport measured RGB light ~236 vs dark ~19; screenshots both themes; toggle test asserts setTheme(light→dark).

## 4. Performance — measurements and method

Method: PowerShell `Measure-Command` + `Invoke-WebRequest` timing, Chrome headless `--virtual-time-budget` captures, build route table, console log capture.

- Before: dev `/fa` warm ~0.53s / 82.7kB; API `/homepage/` ~2.17s; featured ~0.02s; shared First Load JS 102kB.
- After: dev `/fa` ~0.25-0.38s / ~111.5kB (preview on, richer DOM); prod `/fa` 200 (81.7kB, 1 H1); shared JS still 102kB.
- Fixes: Hero3D code-split + idle/deferred (desktop ≥1024px, reduced-motion off); H1 plain-text SSR; removed truncate-ellipsis risk; no new deps; `priority` kept only on stage image; instant images lazy.
- Not fixed: first-hit `/homepage/` ~2s Django composer (backend scope, untouched); Google Fonts `@import` render-chain (accepted existing setup); `anon 100/hour` throttle hit repeatedly during screenshot bursts (self-inflicted, documented).
- No LCP/CLS/INP lab numbers claimed (no perf harness in env); document/transfer/console evidence recorded instead.

## 5. API route findings

- Base: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` (correct, verified live).
- `/api/products/featured/` 404 = wrong prefix; canonical `/api/v1/products/featured/` 200 `{"count":0}` (empty, legitimate — zero featured rows, not a bug).
- Homepage composer `apps/homepage/api/v1/serializers/homepage.py` verified: CMS order, public-only filters, preview bypass branch (Phase 8.1 intact).
- No frontend endpoint change needed; no backend change made; error vs empty now distinguished in UI.
ENDSEC2

## 6. Source files changed and why

Modified (15):
- `locales/{fa,ar,en}.json` — +5 keys each (`preview_badge`, `preview_notice`, `backend_error`, `backend_error_hint`, `empty_showcase_hint`), fa-first parity.
- `src/app/[locale]/(public)/homepage-client.tsx` — dev-only backend-error banner; error vs empty distinction.
- `src/app/globals.css` — slogan/glow split light vs `.dark` (replaces always-light `.showcase-light` filter).
- `src/components/home/AboutSection.tsx` — hydration fix: fixed-point string SVG coords (float serialization mismatch).
- `src/components/home/FeaturedProductsSection.tsx` — preview fill, designed spotlight fallback, full `dark:` pass, preview notice.
- `src/components/home/HeroSection.tsx` — lazy/idle/deferred Hero3D, SSR-readable H1 + gated TextReveal, truncate removed, preview wiring + badge, full `dark:` pass.
- `src/components/home/HomepageShowcase.tsx` — designed cover-less stage fallback, empty-copy fix, full `dark:` pass.
- `src/components/home/ProductRailSection.tsx` — preview taxonomy, full `dark:` pass.
- `src/components/home/../../products/public/{ProductCard,ProductCategoryCard,ProductCategoryNavigation,ProductPrice}.tsx` — `dark:` variants on light tones (CSS-only, no JS branching).
Created (4 + report):
- `src/lib/homepage-preview.ts` — dev-only fixtures (2 cats, 6 products: regular/discounted/contact/scheduled, labelled `preview-`, empty covers).
- `src/lib/homepage-preview.test.ts` (4 tests) — off-by-default, opt-in, never-in-prod, coverage/labelling.
- `src/components/home/phase-12-4-frontend-recovery.test.tsx` (6 tests) — H1, order, empty states, fallbacks, hide-on-empty, no-truncate.
- `src/components/home/phase-12-4-theme.test.tsx` (2 tests) — toggle calls setTheme, provider renders.
Backend: zero files changed.

## 7. Preview fixtures — design, activation, isolation proof

- Design: in-memory only (`homepage-preview.ts`); 2 categories, 6 products (regular ×2, discounted ×2 with struck original via canonical ProductPrice, contact ×1, scheduled ×1); covers empty → Sun/gradient fallbacks (no invented image paths; `public/` has no product photography); floating visuals none (no assets to compose); every title carries `پیش‌نمایش`, every slug `preview-`.
- Activation: create `abr-energy-frontend/.env.local` with `NEXT_PUBLIC_HOMEPAGE_PREVIEW=1`, restart dev. Disable: delete line/file, restart. File is gitignored (`.gitignore:32`).
- Isolation proof: `isHomepagePreviewEnabled()` returns false when flag unset OR `NODE_ENV === 'production'`; fixtures never touch Django/SQLite/CMS/sitemap/SEO/public APIs; prod build `/fa` smoke shows no `preview-badge`/`hero-showcase-fallback`; 4 isolation tests green.
- Blocker note: no suitable local product images exist (only `file/globe/next/vercel/window.svg` in `public/`), so photographic stage review needs owner-provided imagery or CMS upload; fallbacks are the honest interim.

## 8. Screenshot paths (C:\tmp124\)

- `light-preview-1440x900.png` (446KB), `light-preview-1280x800.png` (358KB), `light-preview-1024x768.png` (260KB), `light-preview-768x1024.png` (332KB), `light-preview-430x932.png` (166KB), `light-preview-390x844.png` (239KB) — preview+light, all 6 viewports.
- `dark-preview-1440x900.png` (596KB), `dark-preview-1280x800.png` (476KB), `dark-preview-430x932.png` (370KB) — preview+dark (via temporary defaultTheme flip, reverted).
- `light-empty-1440x900.png` (113KB), `light-empty-390x844.png` (184KB) — normal CMS-empty state.
- `prod-1440x900.png` (129KB) — production build smoke.
- Pixel spot-check: light hero band RGB ~(236,236,233) vs dark ~(19,21,24) — clearly distinct themes.
- Limitation (honest): this session cannot view image pixels; paths are real captures (Chrome headless, virtual-time-budget 15s, post-load); human eyeball review of composition still required.
ENDSEC3

## 9. Visual comparison findings and remaining gaps

- Verified via hydrated DOM (`--dump-dom` testids, not SSR alone): `hero-slogan`, `showcase-nav`, `hero-showcase` + `hero-showcase-fallback`, `instant-offer-panel` + `instant-offer-title`, `showcase-category-rail`, `featured-rail` + `featured-spotlight`, `product-rail`, `preview-badge`, `preview-notice` — full composition mounts in preview mode.
- Empty state: `hero-showcase-empty`, no rails (correct hide-on-empty), slogan/nav intact.
- Gaps: (1) real product photography unverified (zero CMS rows + no local images); (2) floating visuals absent (no HomepageVisual rows); (3) lower dark sections vs light hero handoff is editorial-taste call for owner; (4) human pixel/eyeball pass pending (tool cannot view images).

## 10. Animation preservation and optimization

- Preserved (untouched): CursorGlow, FloatingParticles, MouseRipple, GradientMesh, ScrollReveal, TextReveal (gated, not removed), parallax (hero scroll fade), tilt (services), rail transitions.
- Optimized: Hero3D lazy-import + Suspense, idle-callback/deferred mount, desktop-only (≥1024px), skipped under reduced-motion; fails closed (no 3D, content intact).
- Page overlays (`GradientMesh`/`FloatingParticles`/`MouseRipple`/`CursorGlow`) already self-guard mobile/reduced-motion; left mounted.
- Console: hydration mismatch FIXED (AboutSection SVG floats → fixed-point strings); only remaining logs are benign React DevTools hint + THREE.Clock deprecation notice.

## 11. Accessibility and RTL

- 1 H1 (`hero-slogan`), labelled nav/controls, `aria-current/pressed`, live counters, focus-visible rings, decorative `aria-hidden`, reduced-motion static paths — preserved and tested.
- RTL: `dir=rtl` on `<html>`, logical props, RTL chevron/keyboard mapping, `dir="auto"` counters — verified in DOM.
- Contrast: light (dark text on `#f4f5f1`/white) and dark (white/emerald on charcoal) use deliberate tokens; hover/focus/disabled states carry `dark:` variants.

## 12-14. Tests, gates, runtime

- Frontend: 59 files / 519 passed (was 57/499 baseline incl. flaky services test that passes solo; +12 new: 4 preview + 6 recovery + 2 theme). Prior 12.2/12.3/homepage suites unmodified green.
- Backend: 234 passed (full suite re-run, zero backend files changed).
- tsc: 0 errors. Lint: 0 errors / 55 warnings (baseline; zero in new files after mount-guard fix).
- Build: PASS (Next 15.5.21, First Load JS 102kB unchanged).
- Canonical workflow observed: dev stopped → :3000 free → build → prod :3100 (`/fa` 200 1H1, `/fa/products` 200, sitemap 200, robots 200, no preview leakage) → prod stopped → `.next` deleted → one dev chain → `/fa` 200 1H1, :3100 free.
- No user data touched; no DB reset/flush/seed; media files only listed, never modified.

## 15. Verification limitations (honest)

1. Cannot view screenshot pixels — captured 12 real PNGs but compositional beauty needs owner eyes.
2. No LCP/CLS/INP lab rig — document/API/console/build evidence instead.
3. Backend throttle (`anon 100/hour`) tripped by screenshot bursts; empty-state shots partially overlap throttled windows (banner is itself proof of error-vs-empty path).
4. Reference images absent from workspace — spec-text compliance, not pixel diff.

## 16. Status: PARTIALLY ACCEPTED

Recovery implemented, measured, screenshotted, and gated — but visual acceptance needs the owner's eyes on real photography plus a populated-CMS pass. Do NOT start Phase 13 automatically. Next: owner uploads ≥2 featured products with covers + category tree + 1-2 visuals, reviews `C:\tmp124\` set, confirms taste on light/dark + mobile.
ENDOFFINAL
