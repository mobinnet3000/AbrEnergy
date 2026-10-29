# Phase 12.5 — Homepage UI/UX Redesign Report

**Status: PARTIALLY ACCEPTED** (all 13 acceptance criteria pass except pixel-level
visual review: screenshots captured at all required viewports but this agent cannot
render images, so DOM/marker verification stands in for visual inspection.)

**Date:** 2026-10-11 · **Scope:** frontend homepage only, no backend changes.

## 1. Implementation plan (executed in this phase)

1. Audit source + live `/fa` before editing.
2. Unify global navigation (7 items), delete duplicate hero strip.
3. Recompose first viewport: prominent H1 + showcase grid.
4. Theme every section light/dark; Persian-first typography.
5. Guard motion (reduced-motion, deferred WebGL), keep all animation systems.
6. Verify: tests, typecheck, lint, isolated production build, runtime probes,
   screenshots, report.

No `UI UX Pro Max` skill exists in the available skills list (only
`customize-opencode`, which applies to opencode's own config, not app UI), so no
skill was installed or claimed. Design decisions follow the phase brief's palette
(emerald/solar green, charcoal, white, warm neutrals, restrained amber) using
existing tokens and components.

## 2. Initial defects (with evidence)

| # | Defect | Evidence |
|---|--------|----------|
| 1 | Duplicate navigation: `SHOWCASE_NAV` strip in `HeroSection` repeated global header destinations (7 links) beneath the slogan | `HeroSection.tsx` lines 31–39, 299–319; live SSR contained `showcase-nav` marker (count 1) |
| 2 | H1 shrunk to utility-label size (`text-lg`–`text-2xl`) with 3 chips + lead stacked above showcase; no art direction | `HeroSection.tsx` line 263 |
| 3 | Forced-dark sections (`bg-black`, `text-white`, `bg-black/40`) in About, Services, Projects, Articles, Calculator, Contact, Footer — theme toggle left half the page dark | `AboutSection`, `ServicesSection`, `ProjectsSection`, `ArticlesSection`, `CalculatorSection`, `ContactSection`, `footer.tsx` |
| 4 | Forced-dark header dropdown + mobile drawer (`bg-black/80`, `bg-black/90`) unreadable against light page | `header.tsx` lines 141, 241 |
| 5 | Latin-only fonts (Lexend/Source Sans 3) for Persian UI; no Persian typeface | `globals.css` line 3 |
| 6 | Global type scale too small for Persian display (`h1` capped at `text-5xl`, tight leading breaks joined script) | `globals.css` lines 160–168 |
| 7 | Calculator decorative loops ignored `prefers-reduced-motion` | `CalculatorSection.tsx` lines 30–46 |
| 8 | Empty showcase/instant panel were bare placeholders; CMS empty in dev (homepage API returns 2.9 kB shell, featured/categories return 52 B `[]`) | `GET /api/v1/homepage/` → 2916 B; `products/featured/` → 52 B |
| 9 | `next.config.ts` had no `distDir` isolation; `NEXT_DIST_DIR` env var is not a real Next.js option, so my first production build overwrote shared `.next` and 500'd both dev servers | `.next/BUILD_ID` + `export-marker.json` timestamps 08:59; `/fa` 500 on ports 3000 + 3001 |

## 3. Root causes

1. Phase 12.1 deliberately added the hero nav strip as "intended first-viewport
   navigation" — duplicating the header instead of fixing the header.
2. Phase 12.3 deliberately shrank the slogan into a "restrained masthead" to avoid
   a giant hero — destroying hierarchy instead of composing it.
3. Lower sections were built dark-first (`bg-black` hard-coded); the Phase 12.4 theme
   pass only covered hero/featured/rails and left the rest.
4. Header dropdown/drawer assumed a dark page that no longer exists.
5. Font stack never included a Persian face; scale/leading tuned for Latin.
6. Dev-preview fixtures existed and worked (`homepage-preview.ts`) — the showcase
   problem was composition, not data.
7. Reported "9–10 s homepage" is cold-dev-compile + Warm dev SSR (~2.3 s first hit
   after edit, 200 ms warm); production SSR is 157 ms. No app-level perf defect found.

## 4. Design-system decisions

- **Tokens:** existing CSS vars untouched; sections use `bg-white`/`bg-neutral-50` +
  `dark:bg-neutral-950`/`dark:bg-black` + `dark:` text/border variants. Calculator
  keeps a deliberate deep-emerald teaser in both themes (white text, contrast-kept).
- **Typography:** Vazirmatn (Google Fonts, OFL) prepended to `--font-sans` and
  `--font-heading`; Lexend/Source Sans 3 retained as Latin fallbacks. Global `h1`
  `text-4xl→6xl`, `h2` `text-2xl→4xl`, headings `leading-[1.4]`, no letter-spacing
  on Persian. Slogan `text-4xl sm:text-5xl lg:text-6xl`, `leading-[1.35]`, balanced.
- **Rhythm:** sections unified to `py-16 md:py-24`, `container-page` everywhere,
  `min-w-0` overflow guard, borders between sections instead of theme whiplash.
- **Motion:** all systems preserved (Hero3D lazy + idle + desktop-only,
  CursorGlow/FloatingParticles/MouseRipple mobile+reduced-motion guards,
  GradientMesh, ScrollReveal, TextReveal after-mount only, parallax, tilt, rail
  transitions). Calculator loops + icon now respect reduced-motion. Decorative layers
  remain `pointer-events-none`.
- **No new dependencies** in the app. `puppeteer-core` installed only in
  `C:\...\Temp\opencode` as throwaway verification tooling.

## 5. Files changed and purpose

**Navigation (acceptance §3):**
- `src/config/navigation.ts` — single 7-item nav: `/gallery` labelled
  `nav.downloads`, `/calculator` labelled `nav.calculator_offgrid` (existing routes,
  no invented pages). Articles removed from top nav (still routed + footered).
- `src/components/layout/header.tsx` — language dropdown + mobile drawer themed
  light/dark (were forced `bg-black/*`).
- `src/components/home/HeroSection.tsx` — `SHOWCASE_NAV` + `showcase-nav` strip
  deleted; hero recomposed into RTL grid (text column + stage column); H1
  `text-4xl→6xl`; hero gradient `white→#f4f5f1→white` / `dark` charcoal.

**Sections (acceptance §7–8):**
- `HomepageShowcase.tsx` — `md:grid-cols-2` so stage + instant panel sit
  side-by-side on tablets; fallback gradient contrast-kept.
- `FeaturedProductsSection.tsx` — `py-12/16`, raw category-ID fallbacks removed
  (chips render only on resolved titles), spotlight type contrast-kept.
- `ProductRailSection.tsx` — `py-12/16`, `bg-neutral-50` light.
- `AboutSection.tsx` — forced black → adaptive white/neutral-950; `data-testid`;
  `py-16/24`.
- `ServicesSection.tsx` / `ProjectsSection.tsx` / `ArticlesSection.tsx` /
  `CalculatorSection.tsx` / `ContactSection.tsx` — same forced-black removal,
  adaptive cards, unified rhythm, `data-testid`s; calculator loops respect
  reduced-motion.
- `footer.tsx` — `bg-neutral-950` base with light-readable text in both themes,
  `data-testid="site-footer"`.
- `ProductCard/ProductCategoryCard/ProductCategoryNavigation/ProductPrice` —
  unchanged behavior (verified by existing tests); light tones already correct.
- `globals.css` — Vazirmatn import, Persian-first stacks, Persian heading scale,
  `container-page min-w-0`, slogan wrap.
- `next.config.ts` — `NEXT_DIST_DIR`-gated `distDir` so future builds can isolate
  without touching default behavior.
- `homepage-client.tsx`, locales (3) — untouched from Phase 12.4 (verified via
  `git diff --name-only`: only prior-phase preview keys present, no 12.5 edits).
- Preview fixtures (`lib/homepage-preview.ts`) — unchanged, still dev-only.

**Tests:**
- New `phase-12-5-homepage-redesign.test.tsx` (5 tests): single-nav contract,
  no-duplicate-strip + prominent H1, per-section `dark:` coverage, one-H1
  assembly, reduced-motion paint.
- Updated `phase-12-1` (nav contract → `navigationConfig`, strip → absent),
  `phase-12-3` (H1 prominent `text-4xl`, strip absent, `pt-24`, `py-12`,
  `bg-white`/`bg-neutral-50`), `phase-12-4` (strip absent).

## 6. Screenshots (`docs/reports/phase-12.5-screenshots/`)

Pre-existing dev captures (before 12.5 edits, kept for comparison):
`desktop-light-1440.png`, `desktop-1280.png`, `laptop-1024.png`, `tablet-768.png`,
`mobile-430.png`, `mobile-light-390.png`.
Post-fix dev captures: `after-desktop-1440.png`, `after-tablet-768.png`,
`after-mobile-390.png`.
Production captures: `prod-desktop-1440.png`, `prod-mobile-390.png`,
`prod2-desktop-1440.png`, `prod2-mobile-390.png`.
Theme-toggle captures: `dark-desktop-1440.png`, `dark-mobile-390.png`,
`light-desktop-1440b.png`, `dark-toggle-desktop-1440.png` (real toggle click).

**Limitation (honest):** this agent has no image input — PNGs were captured and
their byte sizes verified, but pixel-level inspection was impossible. Visual
claims below rest on DOM/marker probes, not eyeballing.

## 7. Desktop / tablet / mobile findings (DOM-verified)

- 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844 captured via headless
  Chrome (`--window-size` + `virtual-time-budget`).
- Puppeteer probes (dark desktop, dark mobile, light desktop): exactly 1 `h1`,
  7 header nav links, `showcase-nav` absent, `scrollWidth - clientWidth = 0`
  (no horizontal overflow) in all three.
- `md:grid-cols-2` keeps stage + instant panel composed on tablets (was stacked).
- Rails scroll internally (`overflow-x-auto`); page itself does not overflow.
- Not verified by eye: glyph-level Persian shaping, whitespace balance, glow
  subtlety — needs a human pass over the PNGs.

## 8. Light/dark verification

- New test asserts every section root carries `dark:` surfaces; no `bg-black`
  utility in light mode.
- Live toggle probe: clicked `header button[aria-label="Toggle theme"]` →
  `.dark` class flipped `false → true`, screenshot captured, toggled back.
  Theme persists via existing `next-themes` provider (unchanged).
- Header dropdown, mobile drawer, footer, all sections, cards, prices, badges,
  skeletons adapt (dark: variants added where forced-dark existed).
- Contrast tuned (emerald-700 on white / emerald-300-400 on charcoal) but not
  instrumentally measured — no contrast-meter run; human check advised.

## 9. Navigation and RTL verification

- Live DOM: `header nav` contains exactly 7 links in order
  `/ products services projects gallery calculator contact`; labels خانه،
  محصولات، خدمات، پروژه‌ها، دانلودها، محاسبه‌گر آفگرید، تماس با ما.
- `document.dir = rtl`, `lang = fa`.
- Mobile drawer: correct side per direction, `aria-expanded` on language + menu
  buttons (`false` at rest), Tab reaches nav links with visible focus
  (`outline 3px` on focused anchor).
- Category strip + rails keep RTL arrow-key navigation (existing tests pass).
- Active states unchanged (`isActive` + `layoutId="activeNav"` preserved).

## 10. Animation preservation and optimization

Preserved (none deleted): Hero3D (lazy + `requestIdleCallback`/timeout, desktop
≥1024 px only, `opacity 0.14/0.22`, `pointer-events-none`), CursorGlow,
FloatingParticles, MouseRipple (all mobile + reduced-motion guarded), GradientMesh
(mobile guarded), ScrollReveal, TextReveal (post-mount only; SSR paints plain
slogan text), parallax (`AboutSection`), service-card tilt, rail transitions.
New: calculator ambient loops + icon honor `useReducedMotion`.
Verified: reduced-motion emulation → H1 paints full slogan text, no hero `<canvas>`
mounted; H1 `initial={mounted ? … : false}` never hides first paint.

## 11. Performance measurements (method + honest comparison)

Method: `Measure-Command { Invoke-WebRequest /fa }` (SSR HTML time, not full-page
LCP); API probed directly; production measured on `next start -p 3100`.

| Metric | Before (12.5 start, dev, warm) | After (dev, warm) | Production |
|---|---|---|---|
| `/fa` SSR | 420 ms | 200 ms (repeat 200–272 ms; 2.3 s first hit after edit = recompile) | **157 ms** |
| `/fa` HTML size | 88,369 B | 88,366 B | — |
| `GET /api/v1/homepage/` | — | 117 ms first / 91 ms repeat (2.9 kB shell, empty CMS) | — |
| `products/featured/` | — | 20 ms (52 B `[]`) | — |
| `product-categories/` | — | 19 ms (52 B `[]`) | — |
| Full suite | — | 524/524 in ~15 s | — |

No LCP/CLS/INP claimed (no Web-Vitals instrumentation in this environment).
The "9–10 s" report is consistent with cold dev startup + compile, not with
production serving: warm dev is ~200 ms, production SSR 157 ms, APIs <120 ms.
No new caching layer added (none warranted by evidence). Bundle unchanged in
shape (shared 102 kB); Hero3D stays code-split (~600 kB three.js off first paint).
Font impact: one added Google-Fonts family (Vazirmatn) — render-blocking risk
acknowledged, `display=swap` via CSS2 API default; self-hosting is a follow-up.

## 12. Tests, TypeScript, lint, build, runtime results

- `npm test`: **60 files / 524 tests pass** (519 pre-existing + 5 new 12.5).
- `npm run typecheck`: clean (`tsc --noEmit`, 0 errors).
- `npm run lint`: 0 errors, 55 warnings — identical count before/after 12.5
  (all pre-existing: `<img>` vs `next/image`, unused imports, exhaustive-deps).
- `next build`: success (isolated `.next-prod125` after the shared-dir incident;
  guard added to `next.config.ts`).
- Runtime: production `next start -p 3100` → `/fa` **200**, 1 H1, `showcase-nav`
  0, `preview-` slugs **0** (isolation proven in production HTML).
- Dev `/fa` → 200, 1 H1, strip 0, 7 H2s; exactly one dev server left running.
- Console: headless `--dump-dom` shows only the React-DevTools info notice; no
  errors. Dev log: no hydration warnings. Puppeteer page errors: none; the only
  console errors are backend **HTTP 429** (rate-limit) on `products/featured/`,
  `homepage/`, `services/`, `product-categories/`, `projects/featured/`,
  `articles/`, `site-config/` under rapid automated reloads — dev-only throttling,
  page still renders via empty states + preview fixtures.

## 13. Remaining blockers and content dependencies

1. **Human visual review of the 17 PNGs** — pixel-level acceptance outstanding.
2. **Real CMS content**: homepage API returns an empty shell; featured/categories
   are `[]`. All populated screenshots show dev-preview fixtures (labelled
   پیش‌نمایش). Needs real products, covers, categories, services, projects,
   articles.
3. **Product photography**: no covers exist (`cover_image_url` empty everywhere);
   gradient/Sun fallbacks render by design. Missing photography is a content
   requirement, not a code defect.
4. **Contrast-meter +axe pass** not run in this environment.
5. **Vazirmatn self-hosting** (currently Google Fonts CDN) for offline/perf parity.
6. **Backend 429s** under burst reloads — rate-limit tuning is a backend concern.
7. Unrelated working-tree files (media PDFs, other modified backend files) left
   untouched; only files listed in §5 were modified by this phase.

## 14. Status: PARTIALLY ACCEPTED

All implementation criteria (single nav, prominent H1, showcase composition,
rail order, full-page themes, no overflow, CMS/pricing preserved, preview
isolation proven, animations preserved + deferred, measured perf, 524 tests,
typecheck, lint, production build + runtime) are met and evidenced. Final
ACCEPTED awaits a human eyeball pass over
`docs/reports/phase-12.5-screenshots/` (this agent cannot render images) plus
real CMS content to replace preview fixtures. No Phase 13 started.


