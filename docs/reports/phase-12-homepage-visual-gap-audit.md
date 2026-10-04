# Phase 12 — Homepage Visual Gap Audit

Date: 2026-09-26. Type: AUDIT (no code changed for this document).
Method: source read of `HeroSection.tsx`, `FeaturedProductsSection.tsx`,
`FloatingVisuals.tsx`, `homepage-client.tsx`, `globals.css`, plus Phase 6 /
7 / 7.5 / 10 / 10.1 / 11 reports. No browser automation is available in this
environment — visual judgments are structural (rendered-tree + SSR + class
audit), stated honestly per Phase 12 §26.

Conclusion: Phase 11 is TECHNICALLY ACCEPTED but VISUALLY INSUFFICIENT.
The page assembles correct CMS data with correct semantics, but the first
viewport does not read as a premium solar/engineering product hero. A
recompose (not a system rewrite) is required and is feasible purely in the
frontend. No STOP condition is triggered.

## 1. Checklist — Requirement | Current | Required | Action

| # | Requirement (Phase 12) | Current (source-verified) | Required final composition | Action (frontend-only unless noted) |
|---|---|---|---|---|
| H1 | Slogan «طلوع آفتاب، از خانه شماست» is the single H1 | PASS structurally — `HeroSection` renders it as the only `h1` via `TextReveal`, `.hero-slogan-display` | Keep exact text + H1 invariant; give it editorial dominance inside a 2-zone hero | Preserve; enlarge hierarchy via layout, not font swap |
| H2 | Hero is a full RTL composition: text zone (right) + visual zone (left) | FAIL — hero is a single `max-w-4xl` text column; no visual zone; `Hero3D` canvas is the only visual | `grid lg:grid-cols-2`: right = eyebrow/slogan/lead/CTAs; left = product visual stage | RECOMPOSE `HeroSection` into 2-zone grid; pass featured products + visuals in |
| H3 | Hero has a strong focal object (product/solar visual) | FAIL — no focal object; empty-looking when CMS has products | Large product image stage w/ radial light, shadow, glass info panel, technical labels | New `HeroShowcase` stage inside hero using real `cover_image_url` only |
| H4 | CTAs feel designed, not generic buttons | PARTIAL — CTA gradients exist but sit in an empty column with no visual anchor | Same CMS labels/URLs, restyled placement beside the product stage | Reuse CTA logic; adjust layout context only |
| F1 | Featured showcase is a hero element, not a lower generic section | PARTIAL — Phase 11 spotlight exists (2+ products) but image is a plain `<img>` box | Stage: large image + radial light + glass panel + number + category + metadata | Enhance spotlight stage (additive classes/overlays only) |
| F2 | Active product dominant, others subordinate + rail | PASS structurally — spotlight + rail + dots + counter + wrap nav | Keep; strengthen visual subordination (rail cards smaller under stage) | Minor CSS/overlay work only |
| F3 | RTL-aware carousel (prev/next, dots, counter, swipe) | PASS — RTL scroll math, keyboard, swipe, `aria-current`, live counter | Preserve byte-behavior | No logic change; only stage cosmetics |
| P1 | Product image is a visual stage, not `<img>` in a card | FAIL — spotlight image container is `rounded-3xl border` + gradient veil only | Add glow, shadow, glass info bar, technical tick labels, product number | Additive overlays in `FeaturedProductsSection` |
| V1 | 4 floating slots form one composition | FAIL — `FloatingVisuals` is page-level `absolute inset-0`, disconnected from hero/product | Render inside hero, positioned around the product stage | Move render into `HeroSection`; keep empty→null |
| V2 | No fabricated assets | PASS — empty→null, no placeholders with fake imagery | Keep; hero empty state = designed solar motif (CSS only), never fake product | New empty-stage motif (pure CSS/SVG) |
| S1 | Solar/energy visual language (horizon, glow, grid, ticks) | PARTIAL — horizon mark + solar grid exist but are thin and scattered | Coherent language: horizon line + radial field + technical grid + thin lines in hero/stage | CSS/SVG only, restrained |
| S2 | One designed page narrative (hero→featured→categories→…) | PARTIAL — sections render in CMS order but all share identical black + generic headers | Hero visually hands off to featured (same product); section headers gain consistent kicker rhythm | Hero-featured product continuity + header rhythm; no reorder |
| C1 | Categories feel like taxonomy | PASS data, WEAK visual — `ProductCategoryNavigation` untouched, generic pills | Keep data; add section identity via header treatment only | No taxonomy change |
| S3 | Services feel like engineering capabilities | PASS data; ghost numerals help but cards still generic | Keep; no further change this phase (accepted) | None |
| P2 | Projects feel editorial/engineering | PASS data; hide-on-empty correct | Keep; no change | None |
| T1 | Calculator feels like a tool | PASS (Phase 11 3-step framing) | Keep; no logic change | None |
| T2 | Typography hierarchy (H1/H2/labels/price/meta/buttons) | PARTIAL — slogan treatment exists; section headers repetitive; price via `ProductPrice` correct | Hero slogan dominant; product names/prices elevated in stages | CSS scale/weight only; existing fonts |
| C2 | Color/material language (sunlight + tech) | PARTIAL — emerald/amber accents used inconsistently across sections | Consolidate: warm solar accent = hero/stage glow + CTA; technical neutrals elsewhere | CSS tokens only; no new palette |
| R1 | Responsive: deliberate mobile composition | PARTIAL — no overflow vectors (`overflow-hidden`, `flex-wrap`) but hero visual zone has no mobile design | Stacked: text → product stage → CTAs; floating layer `hidden md:block`; stage `aspect` boxes | Grid stacks; verify 1440/1280/1024/768/430/390 structurally |
| D1 | Real CMS data only | PASS — no fake products/prices; empty→hide | Keep; fixtures only in tests (in-memory) | No seed; add content checklist in final report |
| E1 | Empty states preserve design | PARTIAL — sections hide correctly, but hero with no products is just text on canvas | Designed empty stage (solar motif + catalog CTA) | New empty composition |
| A1 | Animations = existing systems only | PASS — framer entrances, parallax, tilt, Hero3D, CursorGlow, particles, ripple | Reuse only; new motion = entrances + stage transition, motion-safe | No new library |
| A2 | Accessibility (1 H1, keyboard, aria, focus, RTL, reduced-motion) | PASS — 1 H1, labelled controls, `aria-current`, live counter, focus rings, reduced-motion | Preserve every rule while recomposing | Assert in new tests |

## 2. What exists only structurally

- Spotlight carousel logic (nav/wrap/dots/counter/swipe) — correct, but its
  visual stage is a plain image box.
- Floating-visual data plumbing (`HomepageVisual` → `FloatingVisuals`) —
  correct, but positioned page-level, not composed.
- CMS ordering/visibility, pricing states (`ProductPrice`), SEO, preview,
  permissions — all correct, none needs visual work.

## 3. What exists but is visually weak

- Hero slogan treatment (`.hero-slogan-display`) — good type step, but
  isolated in an empty column.
- Solar-horizon identity mark — 36px dot, too small to carry identity.
- Calculator 3-step tool framing, services ghost numerals, articles
  editorial dates — all correct but thin against generic black sections.

## 4. What exists but is in the wrong hierarchy

- `FloatingVisuals` at page root (`homepage-client.tsx:107`) instead of
  inside the hero composition.
- Featured spotlight lives a full section below the hero with no visual
  handoff (hero shows zero product, featured shows all product).
- `AboutSection` slot after categories breaks the product narrative
  (accepted CMS behavior — not moved; only hero→featured handoff is fixed).

## 5. What is missing

1. Hero 2-zone RTL grid (text right / visual left).
2. Hero product stage (image + glow + glass info + technical labels +
   counter + CTA) driven by the first featured product.
3. Designed hero empty state (solar motif, no fake product).
4. Spotlight stage craft (glow, glass bar, product number, category chip).
5. Coherent floating layer around the stage (not page-scattered).
6. Hero→featured continuity (same product family, shared motifs).

## 6. What is hidden because there is no real CMS content

- Spotlight (needs ≥2 featured products), hero stage image (needs ≥1
  product with `cover_image_url`), floating layer (needs enabled
  `HomepageVisual` rows), categories/services/projects/articles sections
  (all hide on empty). Verified: current dev/CI backends are empty, so all
  of these degrade to hero-copy-only by design. Nothing here is a code bug.

## 7. What requires actual assets/data (cannot be solved in frontend)

- Real product cover images, real category tree, real services/projects/
  articles rows, real `HomepageVisual` media. Frontend can only compose
  stages and empty states; it must never invent these.

## 8. What can be solved purely in frontend (this phase)

- Everything in §5 plus responsive stacking, header rhythm, glow/grid/tick
  motifs, glass panels, and focused tests. No backend, migration, API,
  permission, i18n, SEO, preview, or dependency change is needed.

## 9. Audit decision

REBUILD (recompose). Feasible plan:

1. `HeroSection` gains optional `featured` + `visuals` props with hook
   fallback; renders 2-zone grid + `HeroShowcase` stage + in-hero
   `FloatingVisuals`.
2. New `HeroShowcase.tsx` (small, focused): real image or designed empty
   motif; radial light; glass info panel (`ProductPrice`, detail CTA);
   technical labels; counter; reduced-motion safe.
3. `homepage-client.tsx` passes `payload.featured_products` +
   `payload.visuals` into hero and stops rendering page-level floats.
4. `FeaturedProductsSection` spotlight gains stage overlays (glow, glass
   bar, number chip) — logic untouched.
5. `globals.css` gains stage/glow/horizon utilities + responsive rules.
6. New `phase-12-homepage-visual-rebuild.test.tsx` (frontend-only fixtures).
7. Gates: tests + tsc + lint + build + runtime smoke; honest
   browser-verification statement.
