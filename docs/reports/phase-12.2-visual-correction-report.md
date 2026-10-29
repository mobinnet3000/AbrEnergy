# Phase 12.2 — Homepage Visual Verification & Reference Correction Report

Date: 2026-10-07. Scope: visual verification + scoped corrections
(frontend only). No backend, migration, API, CMS-model, dependency, or
Three.js change. No fake data. No Phase 13.

## 1. Audit result

`docs/reports/phase-12.2-visual-verification-audit.md` — 17 areas:
9 PASS (code), 8 PARTIAL (3 fixed, 5 data-gated). Zero FAIL.

## 2. Browser availability

Chrome headless USED: 12 screenshots (6 viewports × pre/post) in
`C:\tmp122\`. Pre-fix pixel analysis proved the header defect
(header-band brightness 225–238 + white text). Post-fix SSR confirms
solid header + 1 H1 + all markers.

## 3. Mismatches found (real)

1. Header transparent + white text over light hero — unreadable brand/nav.
2. Instant-panel `ProductPrice` white/amber on white — washed out.
3. Promo badge always rendered, even for regular-price product.
4. Brand-zone vertical rhythm loose (~6 gaps push showcase down).

## 4. Corrections made

1. `header.tsx` — `solidHeader = scrolled || isHome`; solid surface +
   foreground text on home at top; behavior elsewhere byte-identical.
2. `ProductPrice.tsx` — additive `tone?: 'dark'|'light'` (default dark);
   light tone = neutral-900 final, neutral-400 struck, emerald-700 badge.
3. `HomepageShowcase.tsx` — `tone="light"` in instant panel; red promo
   badge gated on `state === 'discounted'`.
4. `HeroSection.tsx` — brand-zone spacing tightened; no copy/logic change.

## 5. Files changed

Modified (4): `components/layout/header.tsx`,
`components/products/public/ProductPrice.tsx`,
`components/home/HomepageShowcase.tsx`,
`components/home/HeroSection.tsx`.
Created (3): `phase-12-2-visual-corrections.test.tsx` (5 tests),
audit doc, this report.

## 6. Real data vs fixtures

Real CMS: NONE (Django down, db 0 bytes). Live verification = empty
states (designed, no fakes). Populated states verified via CMS-shaped
in-memory fixtures in tests only.

## 7–9. Desktop / mobile / RTL verification

SSR+DOM verified at all 6 viewports via screenshots + HTML probes:
slogan H1 first, nav strip, showcase grid, rails scroll, `dir=rtl`,
chevrons/keyboard/touch logic asserted in tests. Dense rail
(`w-[168px]/xl:220px`) structurally 5–6/desktop. Pixel-density sign-off
with real data = operator step.

## 10. Accessibility

1 H1, labelled controls, `aria-current/pressed`, live counters,
focus-visible rings, decorative `aria-hidden`, reduced-motion static
paths — all preserved + tested.

## 11. Animations preserved

Hero3D (mounted 14%), CursorGlow, particles, ripple, gradients,
ScrollReveal, TextReveal, parallax, tilt — untouched.

## 12–16. Gates

Tests 55/499 passed (5 new). tsc 0. Lint 0 errors / 55 warnings
(baseline; zero in changed files). Build PASS (102 kB).
Runtime: prod :3100 `/fa` 200 → stopped → `.next` deleted → dev :3000
200 (1 H1, solid header marker).

## 17. Remaining visual gaps

1. Real product/category/visual imagery unverified (no CMS data).
2. Rail density pixel-count with real cards (structural only).
3. Operator eyeball sign-off on the 12 PNGs.

## 18. Reference match

Reference B composition: MATCHED structurally (order, frames, panel,
strips, colors, type). Reference A density: MATCHED structurally.
Pixel-with-real-data confirmation pending operator content + eyeball.

## 19. Next step

Operator only: populate real CMS (≥2 featured products with covers,
category tree, 1–2 visuals, hero copy), eyeball the PNG set + live
device pass. Do NOT start Phase 13 automatically. STOP.
