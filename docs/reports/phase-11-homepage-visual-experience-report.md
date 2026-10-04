# Phase 11 — Homepage Visual Experience / Design Realization Report

**Date:** 2026-09-26
**Scope:** Homepage PRESENTATION ONLY — progressive visual-layer improvement of the existing homepage. No CMS architecture change, no backend change, no migration, no dependency change, no Three.js/R3F change, no next.config.ts change, no destructive DB operation.
**Branch:** `master`, HEAD `342d1da`. No commit made (not requested).

> All 10 listed prerequisite reports were read in full before touching code, and the live homepage source was audited directly. Where reports and source differed, **source won** (notably: `HomepageVisual` carries no frontend `enabled` flag — the public payload only includes enabled rows; homepage max-4 visuals is a frontend `slice(0, 4)` convention; article cover is `cover_image_url`-rendered; no Persian display font exists in the repo).

---

## 1. Status

**Status: COMPLETE.** The homepage keeps its accepted CMS/backend foundation byte-for-byte and gains the premium visual layer: cinematic solar hero identity with display-treated slogan, four-slot floating visual composition, active-product spotlight showcase (2+ products) over the preserved rail, tool-framed calculator teaser, engineering-character services, editorial articles, and labelled contact/projects sections. All gates green (§19–§23). STOP after this report — no Phase 11.1, no deployment.

## 2. Baseline

Phase 10.1 COMPLETE and ACCEPTED — Release Candidate with 0 P0/P1 findings. Session-start verification: backend untouched by this phase (no backend file modified); frontend suite at start matched the 10.1 baseline (51 files / 449 passed; the tree additionally holds uncommitted prior-phase work, left untouched). Working tree was already dirty at session start (65 modified + many untracked from Phases 7→10.1); Phase 11 adds only the files in §4.

## 3. Existing homepage architecture audited

- Assembly: `src/app/[locale]/(public)/homepage-client.tsx` — CMS `sections[].order` authoritative, `FALLBACK_ORDER` (hero → featured → categories (+About) → services → calculator → projects → articles → contact) when no payload. Preserved unchanged.
- CMS: `useHomepage` + `HomepageHero/Section/Teaser/Contact/Visual` types + `homepageCopy` fallbacks. Untouched.
- Sections: `HeroSection` (Hero3D + parallax + TextReveal + CMS CTAs), `FeaturedProductsSection` (rail + `ProductCard` + `ProductPrice`), `ProductRailSection` (`ProductCategoryNavigation`), `ServicesSection` (tilt), `CalculatorSection`, `ProjectsSection`, `ArticlesSection`, `ContactSection`, `FloatingVisuals` (CMS `HomepageVisual`, empty → null). All preserved; only the visual layer was extended.
- Non-negotiables verified intact: Hero3D, R3F/Three versions, CursorGlow, particles, ripple, gradients, ScrollReveal, TextReveal, parallax, tilt, RTL, CMS API/ordering/enabled, SEO metadata, preview routes, media picker. `package.json` / `next.config.ts` untouched.
- Typography: headings `Lexend`, body `Source Sans 3` (Google Fonts import in `globals.css`). No Persian display/Nastaliq font exists locally — per §4 constraints no external font was added; the slogan treatment is scale/weight/line-height/glow/gradient only, and remains accessible HTML text (`h1` + `TextReveal` word spans).
- Pricing: `ProductPrice` consumes backend `price.state` only (`regular/discounted/contact_for_price/scheduled/expired/hidden`; `hidden` → null). No client math anywhere. Reused verbatim in the spotlight.

## 4. Exact files changed

Modified (12):

1. `abr-energy-frontend/src/components/home/HeroSection.tsx` (+33/−) — solar-horizon identity mark, `hero-slogan-display` treatment, `hero-slogan`/`hero-cta-primary`/`hero-cta-secondary` testids, scroll cue. CMS logic untouched.
2. `abr-energy-frontend/src/components/home/FeaturedProductsSection.tsx` (+202/−) — active spotlight (2+ products), wrapped prev/next, dots + live counter, touch-swipe, rail sync, `aria-current` slides. Rail/keyboard/reduced-motion logic preserved verbatim.
3. `abr-energy-frontend/src/components/home/FloatingVisuals.tsx` (+46/−) — four curated slots, glass frames, `floating-visuals`/`floating-visual` testids. Empty → null preserved.
4. `abr-energy-frontend/src/components/home/CalculatorSection.tsx` (+39/−) — three-step tool framing, `calculator-teaser` testid, `homepage-calculator-heading` label. CTA logic untouched.
5. `abr-energy-frontend/src/components/home/ServicesSection.tsx` (+8) — technical ghost numerals (`aria-hidden`). Tilt/links untouched.
6. `abr-energy-frontend/src/components/home/ArticlesSection.tsx` (+23/−) — conditional editorial `<time>` publication line, `articles-editorial` testid.
7. `abr-energy-frontend/src/components/home/ProjectsSection.tsx` (+2/−) — `projects-showcase` testid.
8. `abr-energy-frontend/src/components/home/ContactSection.tsx` (+6/−) — `contact-panel` testid, `homepage-contact-heading` + `aria-labelledby`, decorative icon marked `aria-hidden`.
9. `abr-energy-frontend/src/app/globals.css` (+14) — `.hero-slogan-display` only (weight 800, Persian-safe line-height 1.25, balance, glow; no letter-spacing — it would break joined script).
10.–12. `abr-energy-frontend/locales/{fa,ar,en}.json` (+3 keys each: `home.calculator_step_1/2/3`, fa-first with ar/en parity; files already carried uncommitted prior-phase additions — Phase 11 adds exactly these 3 keys per locale).

Created (2): `src/components/home/phase-11-visual-experience.test.tsx` (22 tests) + this report.

Backend: zero files. Migrations: none. Dependencies: none.

## 5. Hero implementation

- Slogan `طلوع آفتاب، از خانه شماست` remains the single `h1`, rendered through the existing `TextReveal` + emerald gradient, now with `.hero-slogan-display` (800 weight, glow layering). Exact text asserted in tests (whitespace-stripped comparison — `TextReveal` splits words into spans).
- Hierarchy: (1) solar-horizon identity mark (sun disc + horizon line, pure CSS, `aria-hidden`), (2) CMS eyebrow chip, (3) slogan, (4) CMS/subtitle lead, (5) three point chips, (6) primary + secondary CMS CTAs (labels/URLs/enabled from CMS, external-URL handling preserved), (7) scroll cue (`md+`, `aria-hidden`).
- Hero3D canvas, solar-grid overlay, gradient veils, scroll parallax — untouched. Responsive: `max-w-4xl` column, `flex-wrap` chips/CTAs, no fixed widths; floating composition is `hidden md:block` and degrades to the 3D scene on mobile.

## 6. Product showcase implementation

- With 2+ featured products: spotlight panel (`featured-spotlight`) — large `next/image` visual (real `cover_image_url` via `resolveMediaUrl`; established Sun-icon treatment when absent — never a fake render), eyebrow category context, `h3` title, `short_description`, `ProductPrice size="lg"`, detail CTA (`/products/<slug>` with labelled `aria-label`), wrapped prev/next, dot navigation (`aria-current` on active), live counter (`aria-live="polite"`), touch-swipe (40 px threshold, RTL-aware).
- The existing rail stays beneath as adjacent navigation: same `ProductCard`s, same `overflow-x-auto snap-x` + 80%-viewport smooth scroll, same RTL keyboard mapping (`ArrowLeft→next` in RTL), same `role="region" aria-roledescription="carousel"` semantics; rail slides gained `aria-current`/`data-active` (additive).
- Spotlight nav selects + `scrollIntoView({inline:'nearest'})` the active card (guarded for jsdom/SSR). Single-product case keeps the classic rail exactly (no duplicated title text — this also preserves the pre-existing single-product tests byte-for-byte).
- No carousel dependency; framer-motion entrance only (static under `prefers-reduced-motion`); no per-frame React state (index state only on navigation).

## 7. Product pricing behavior

Via the reused `ProductPrice` (zero client math): regular → final price + تومان; discounted → emerald final + struck-through original + backend badge (asserted in spotlight); `contact_for_price` → `برای اطلاع از قیمت تماس بگیرید` with no invented number and no تومان figure (asserted); `hidden` → null, no price surface anywhere in the spotlight (asserted). No prices hardcoded; no fake products.

## 8. Floating visual implementation

`src/lib/homepage-visuals.ts` and the `HomepageVisual` model untouched (no second data model). `FloatingVisuals` still renders null when no enabled visual carries media (no broken placeholders, no seeded assets). With 1–4 CMS visuals it composes four curated slots (large top-end, small mid-end `lg+`, medium bottom-start, small top-start `lg+`) with glass frames + horizon ticks, gentle framer float (static under reduced motion), `aria-hidden` + `pointer-events-none`, `link_url` intentionally unrendered (a11y, as before). Accessibility/reduced-motion behavior preserved.

## 9. Categories

Real category data only (`ProductRailSection` + `ProductCategoryNavigation` untouched — pills, hierarchy, slugs, order all backend-driven). CMS-disabled → null; empty → hidden; CTA `ورود به کاتالوگ` → `/products` preserved. No category imagery invented; typographic treatment used throughout. Verified by test (titles + slug hrefs).

## 10. Services

Real `useServices`/CMS items only; loading skeleton, `ErrorState` retry, hide-on-empty preserved — no fallback copy. Visual upgrade is restrained: technical ghost numerals (`01…`, `aria-hidden`) + preserved 3D tilt, PV corner marks, hover glow. Detail links `/services/<slug>` verified.

## 11. Calculator teaser

No calculator logic implemented (phase forbids it). The teaser now reads as a tool: title + description + three honest locale-driven steps (input usage → recommended system → payback estimate; generic tool copy, no numbers invented) + CMS CTA (label/URL, external handling preserved). Verified (`شروع محاسبه` → `/calculator`, steps render).

## 12. Projects

Real featured-project data only; hide-on-empty preserved; no capacities/locations/results fabricated (cover/capacity/type/location from rows). Image-led cards untouched; section gained a stable `projects-showcase` testid. Old fake stats section NOT restored (still unrendered).

## 13. Articles

Editorial treatment: kicker (category or `articles.label`), title, excerpt, plus a conditional publication `<time>` (Persian `fa-IR` medium date, invalid input → null, missing → nothing). CMS list respected as given; drafts never surface (composer-level, untouched). Persian headings asserted; `Latest Articles`/`Insights` absent.

## 14. Contact/footer

Existing contact/footer architecture kept. `ContactSection` gained `aria-labelledby` wiring + testid; CMS title/description/primary/secondary CTAs untouched; no contact details invented or duplicated (they stay in SiteSettings/Footer/contact page).

## 15. Responsive behavior

Source-level audit (no browser automation available — honestly stated in §24): hero column/CTAs `flex-wrap`, chips `flex-wrap`; spotlight `grid lg:grid-cols-2` stacks on mobile; rail `overflow-x-auto` with `270/320px` snap cards (touch-friendly); floating visuals `hidden md:block`; every section root carries `overflow-hidden`; no fixed page widths. Decorative blobs are absolute inside overflow-hidden sections — no page-level horizontal-overflow vector introduced. RTL preserved (`start/end` logical props, RTL-forward `ArrowLeft` chevrons, RTL keyboard mapping).

## 16. Accessibility

One `h1` across the assembled homepage (asserted via `HomepageClient`); `h2` per section with `aria-labelledby` (calculator + contact wired this phase); labelled carousel controls (spotlight labels product-qualified so they never collide with rail `قبلی/بعدی`); dots with `aria-current`; live counter; focus-visible rings on all new buttons; meaningful `alt` on spotlight imagery; decorative layers `aria-hidden`; no hover-only interaction (dots/buttons/swipe are all button- reachable; swipe is progressive enhancement over buttons); reduced-motion fallbacks in hero-adjacent motion, rail scroll (`auto`), spotlight (static), floating visuals (static), plus the global `prefers-reduced-motion` CSS kill. No `dangerouslySetInnerHTML` added.

## 17. Performance

No new dependencies; no new client data fetching (spotlight derives from the already-fetched list; `useHomepage`/existing hooks reused, no duplicate calls); `next/image` for spotlight + floating visuals with `sizes` + lazy loading; animations limited to entrances + one spotlight transition + decorative floats (all motion-safe); no per-frame state. Build output: homepage is part of the shared public chunk graph — First Load JS shared by all stays **102 kB** (unchanged from baseline).

## 18. CMS compatibility

Every section honors: disabled → null (featured/categories/services/projects/articles/hero/calculator/contact all short-circuit; asserted for featured); empty relations → hidden, never fake content (asserted: empty CMS payload renders hero + copy with no `Powering the`, no stats, no showcase); reordered sections render in CMS `order` (asserted: contact-first payload paints `contact` first, `hero` last); missing media/price/text degrade (Sun-icon visual fallback, null price, locale fallbacks). Public surface still exposes only public rows (composer untouched).

## 19. Tests

- New `src/components/home/phase-11-visual-experience.test.tsx`: **22 tests**, mapping 1:1 to the phase checklist (slogan, CMS CTAs, spotlight rendering, discounted/contact/hidden pricing, spotlight nav + wrap, empty, disabled, CMS ordering, floating visuals, missing media, categories, services, projects, articles count, calculator CTA, RTL chevron, a11y labels, reduced motion, no fake content, single H1).
- Full frontend suite: **52 files / 471 passed** (51/449 baseline intact + 22 new + arithmetic from the added file; zero weakened, zero skipped).
- Pre-existing `homepage.test.tsx` (24 tests) passes unmodified — the spotlight renders only for 2+ products precisely so single-product assertions stay byte-identical.
- Backend suite not re-run (zero backend files changed); backend remains at the 10.1 baseline of 234 passed.

## 20. TypeScript

`npx tsc --noEmit`: **exit 0, 0 errors** (one intermediate `ProductListItem` cast in the new test fixed during the phase).

## 21. Lint

`npm run lint`: **0 errors, 55 warnings** — identical count to the 10.1 baseline; zero warnings in any Phase 11 file (one intermediate unused-import warning in the new test fixed; the `Sun`/`img` warnings in Projects/Articles sections are pre-existing).

## 22. Build

Canonical hazard workflow observed (no `next dev` was running — only unrelated Adobe/router node processes; port 3000 verified free before building): `npm run build` **PASS** (Next 15.5.21, full route table incl. preview routes; First Load JS 102 kB).

## 23. Runtime smoke

Production `next start -p 3100` (started via persistent process + log file after the build): `/fa` **200** (79,485 B) with exactly **1 `<h1>`**, slogan present, `dir="rtl"`, `hero-cta-primary` + `hero-slogan-display` markers in SSR HTML; `/fa/products` **200**; `/sitemap.xml` **200**; `/robots.txt` **200**. (Django `:8000` was not running, so CMS/API-backed slots degrade gracefully by design; with the empty backend the showcase correctly hides — no fake content.) Prod stopped, `:3100` verified free, **ONLY `.next` deleted**, exactly **ONE dev chain** restarted (parent + single server child), `/fa` on `:3000` = **200** with 1 H1.

## 24. Browser/AT limitations

**No browser automation is available in this environment — no click-level, visual-pixel, or assistive-technology walkthrough was performed, and none is claimed.** Verification is source + SSR + jsdom-interaction level: hero CTAs, spotlight next/previous (fireEvent, incl. wrap-around), detail/category/calculator CTAs, rail keyboard mapping, reduced-motion scroll behavior, mobile-viewport class audit, and overflow-constraint audit. WebGL rendering (Hero3D canvas), real touch-swipe physics, and screen-reader traversal remain operator-side.

## 25. Data-safety statement

No flush/reset/drop/migration; no CMS record created, edited, or deleted; no media touched; no fake production content seeded (visual slots render empty-state null when the CMS holds no media — stated honestly in §8). Test fixtures exist only as in-memory jsdom objects. Real `AbrEnergy/media/` content untouched. Django was never started by this phase.

## 26. Known limitations

1. Spotlight appears only with 2+ featured products (deliberate — §6; single product keeps the classic rail).
2. Floating slots depend on real CMS `HomepageVisual` media; on the current empty backend they render nothing (verified structurally, not with real imagery).
3. `link_url` on visuals still stored-but-unrendered (inherited a11y decision).
4. No browser/AT pass (§24). No live-Django CMS round-trip this phase (API layer untouched; covered by prior suites).
5. Services ghost numerals and calculator steps are presentational; article dates render only when the backend supplies `publish_date`.

## 27. Deferred items

Everything in Phase 11 §20 (server metadata overhaul, URL-state redesign, preview locale, DAM, media ownership/counting, cart/checkout/orders/payment, roles, i18n activation, gallery reuse, dependency/Three.js upgrades, CMS/admin redesign, API-docs changes, unrelated P2/P3 fixes) — none started. Phase 10 P2/P3 backlog carries over unchanged. No new P0/P1 introduced.

## 28. Git status

- HEAD `342d1da`; no commit made. Tree was dirty before Phase 11 (prior phases) and remains so; nothing outside §4 was modified by this phase.
- Phase 11 footprint: 12 modified + 1 new test file + this report (§4). Backend: zero. `package.json`/`package-lock.json`/`next.config.ts`: untouched.
- Generated artifacts: `.next/` rebuilt for verification then deleted (absent, as at phase start); `prod3100.log`/`dev3000.log` live outside the repo (temp dir).
- Locale note: `fa/ar/en.json` show 28-line diffs vs HEAD because they already carried uncommitted prior-phase keys; Phase 11 contributes exactly +3 lines per file (`calculator_step_1/2/3`).

## 29. Final recommendation

**ACCEPT Phase 11.** The homepage now presents the intended premium AbrEnergy experience on top of the untouched, accepted CMS foundation: exact slogan preserved as the single H1, CMS-driven copy/CTAs/ordering/visibility throughout, real-data-only showcase with correct pricing states, graceful empty states, full a11y/reduced-motion/RTL discipline, and green gates (471 frontend tests incl. 22 new, tsc 0, lint 0 errors, build PASS, prod + dev smoke 200). **STOP — do not start Phase 11.1, deployment, or any deferred item.**

---

# FINAL REPORT / SUMMARY

- **What changed:** visual-layer-only upgrade — solar-identity hero (`hero-slogan-display`, horizon mark, CTA testids, scroll cue), 2+-product active spotlight over the preserved rail (wrapped nav, dots, live counter, swipe, `aria-current`), 4-slot floating-visual composition, tool-framed calculator teaser (+3 locale keys × fa/ar/en), service ghost numerals, editorial article dates, contact/projects labelling. CMS logic, backend, deps, Three.js, configs untouched.
- **Files changed:** 12 modified + 1 new test file + this report (exact list §4).
- **Frontend tests:** 51 files/449 → **52 files/471 passed** (+22 new; 24 pre-existing homepage tests unmodified and green).
- **tsc:** 0 errors. **lint:** 0 errors / 55 warnings (baseline count). **migrations:** none. **build:** PASS.
- **Runtime:** prod `:3100` — `/fa` 200 (1 H1, slogan, RTL) + `/fa/products`, `/sitemap.xml`, `/robots.txt` all 200, then stopped; ONLY `.next` deleted; dev `:3000` — `/fa` 200 on exactly one dev chain; `:3100` free at end. Django not running — API-backed slots degrade gracefully; empty CMS renders hero + copy with zero fake content.
- **Real CMS data during verification:** none available (no backend running, no seed content per data-safety rules) — visuals asserted structurally + via CMS-shaped fixtures; stated honestly, no browser-pixel claim made.
- **Explicit STOP:** Phase 11 ends here. No 11.1, no deployment, no deferred items.
