# Phase 12.9 — AbarEnergy Brand Identity & Logo Integration

Date: 2026-10-17
Scope: brand-integration + visual-quality only. No homepage redesign, no Phase 13 work.

## 1. Source logo asset

| Property | Value |
|---|---|
| Source path | `E:\Ilia Jamali\prog\abar\AbrEnergy\abar logo.png` |
| Filename | `abar logo.png` (extension is part of the name; verified by signature + decoder) |
| Format | PNG (32bpp ARGB — real alpha/transparency, `PixelFormat: Format32bppArgb`) |
| Dimensions | 607 × 246 px |
| Aspect ratio | ≈ 2.468 : 1 (wide wordmark) |
| Transparency | Yes — 30.4 % of pixels opaque |
| Palette (measured) | Opaque pixels are **dark-green dominant**: avg RGB 24/77/49, avg luminance 64 |
| Destination | `abr-energy-frontend/public/abar-energy-logo.png` (byte-identical copy, 72 738 bytes) |

No other candidate `abar logo` file exists in the repo. The original at the repo root was **not** modified, renamed, or deleted. No replacement/faked logo was created.

## 2. Files changed and why

| File | Change | Reason |
|---|---|---|
| `public/abar-energy-logo.png` | **New** — copied from root `abar logo.png` | Version-controlled default brand asset served by Next. |
| `src/components/layout/brand-logo.tsx` | **New** — shared `BrandLogo` component | Single source of truth for header + footer; reuse instead of hardcoding the asset in two places. Renders the logo via `next/image` (`object-contain`, intrinsic 607×246), locale-aware words, focus ring, and a legible-on-dark light chip. |
| `src/components/layout/header.tsx` | Replaced the placeholder `Zap` icon + brand block with `<BrandLogo priority />` | Real logo in the global header; keeps the seven nav destinations and RTL order untouched. |
| `src/components/layout/footer.tsx` | Replaced placeholder block with `<BrandLogo />`; copyright now uses `t('common.site_name')` instead of hardcoded `AbrEnergy` | Same approved logo in footer; removes the stale Latin brand string. |
| `locales/en.json` | `AbrEnergy` → `AbarEnergy` (9 occurrences) | Official English brand per spec. Active UI locale today is `fa`; this corrects the English catalog strings for when `en` is enabled. |
| `src/app/layout.tsx` | Root metadata title/description `AbrEnergy` → `AbarEnergy` | English metadata brand. |
| `src/components/home/HeroSection.tsx` | Eyebrow fallback `'AbrEnergy'` → `'AbarEnergy'` | Bilingual hero eyebrow fallback (`AbarEnergy — ابر انرژی`). |
| `src/components/home/phase-12-2-visual-corrections.test.tsx` | Added `@/hooks/use-api` mock | `BrandLogo` reads `useSiteSettings()`; the header unit test previously rendered `<Header/>` without a QueryClient provider. |
| `docs/reports/phase-12.9-screenshots/*.png` | **New** — 8 rendered screenshots | Verification artifacts (see §7). |
| `docs/reports/phase-12.9-brand-identity-logo-report.md` | **New** | This report. |

Not changed (deliberately): `src/lib/globals.css` comment (`AbrEnergy Design System`) and `src/lib/api-errors.ts` comment referencing the backend path `AbrEnergy/apps/...` — these are internal/technical identifiers, not visible brand copy. Backend code was not touched.

## 3. Where the logo appears

- **Header** — `BrandLogo` links to `/` (homepage for current locale), with localized accessible name from the `next/image` `alt` (`ابر انرژی` in fa). Focus-visible ring + rounded clickable target. Nav destinations unchanged (Home, Products, Services, Projects, Gallery/Downloads, Calculator, Contact — in order).
- **Footer** — same `BrandLogo` component; brand name rendered white; contact info and footer nav intact.
- **Metadata** — no logo image is injected into metadata (no `og:image` set from the asset). Persian homepage title/description and `og:site_name = ابر انرژی` unchanged and verified.
- **Favicon** — **not changed.** See §9.

The logo is not hardcoded in two competing places: both header and footer render the one shared `BrandLogo`.

### Dark-surface treatment (justified, non-destructive)
The measured asset is dark-green on transparency → it would be illegible directly on the dark header/footer. The component wraps the untouched image in an adaptive light chip (`bg-white/85 dark:bg-white/90`, subtle ring + rounded corners). No filter, recolour, or asset modification. This is a wrapper only.

## 4. Brand-name audit (exact)

| Location | Before | After |
|---|---|---|
| Header visible name (`common.site_name`, fa) | ابر انرژی | ابر انرژی (unchanged) |
| Footer brand | `t('common.site_name')` | `t('common.site_name')` |
| Footer copyright | `© {year} AbrEnergy.` | `© {year} ابر انرژی.` (localized) |
| Hero eyebrow fallback | `AbrEnergy — ابر انرژی` | `AbarEnergy — ابر انرژی` |
| Root metadata | `AbrEnergy …` | `AbarEnergy …` |
| `locales/en.json` (site_name, about, featured, auth, seo, copyright) | `AbrEnergy` | `AbarEnergy` |
| `locales/fa.json` (`common.site_name`, seo, footer) | ابر انرژی | ابر انرژی (unchanged) |
| `locales/ar.json` (`common.site_name`) | `أبر إنيرجي` | `أبر إنيرجي` (unchanged — consistent Arabic transliteration; Latin `AbarEnergy` shown in the bilingual eyebrow) |

Verified in rendered production HTML for `/fa`: 0 occurrences of `AbrEnergy`; Persian brand `ابر انرژی` present; `og:site_name = ابر انرژی`; `title` Persian. No `Hanahoush` / `هاناهوش` found anywhere in the frontend.

Note: the hero eyebrow intentionally renders the bilingual `AbarEnergy — ابر انرژی`, which is the existing design's bilingual masthead, not a conflicting company name.

## 5. CMS logo configurability status

- The backend **already supports a brand logo**: `apps/core/models.py::SiteSettings.logo` and `.favicon` (VersatileImageField), exposed by `SiteSettingsSerializer` / `SiteSettingsPublicSerializer` at `/site-config/`, editable in **Django admin**.
- The frontend **does** consume it: `BrandLogo` reads `useSiteSettings()` → `settings.logo` (via `resolveMediaUrl`) and uses it when present, otherwise the version-controlled default.
- **Can an administrator replace the logo through the product CMS today?** Via **Django admin**: yes (upload to `company/logo/`). Via the **Next.js admin UI**: **no** — `src/app/[locale]/admin/settings/page.tsx` is read-only (displays `company_name`, `company_name_en`, contacts, socials, SEO fields; no logo/favicon upload control).
- No new database schema or migration was introduced (the field already exists). No broad CMS rewrite performed.

**Smallest safe follow-up design (not implemented here):** add logo/favicon upload controls to the existing admin settings page using the already-present `MediaUpload`/`media-upload.tsx` component and `siteApi.getSettings`; submit via the existing `SiteSettings` serializer (writable fields). No model change, no migration, no new endpoint required. Deferred because it is a new admin feature outside this brand-integration phase.

## 6. Light/dark and responsive findings

Measured from isolated production build (`NEXT_DIST_DIR=.next-prod129`, `next start -p 3100`).

- **Header logo renders** in light and dark, desktop and mobile (green logo-mark pixels detected in the header region at 1920/1440/390).
- **Dark theme** is applied correctly (seed via `localStorage.theme=dark` → `<html>` gains `dark`; page luminance mean 26 vs 241 light). Logo remains legible on its light chip over the dark header and dark footer.
- **RTL**: fa is RTL; header uses `justify-between` so the logo sits at the right edge, matched by the footer.
- **Horizontal overflow**: measured via a same-origin iframe helper (`documentElement.scrollWidth vs clientWidth`) at 1920×1080, 1600×900, 1440×900, 1280×800, 768×1024, 390×844 → **overflow = 0 at every viewport** (helper removed afterwards).
- **Nav integrity**: exactly **1** global `<nav aria-label="Main navigation">`, **1** homepage `<h1>`, 7 nav destinations in order.
- **Preview fixture leak**: 0 `preview-badge` occurrences on production `/fa`.
- **Logo URL**: `GET /abar-energy-logo.png` → `200`, `image/png`, 72 738 bytes (matches source).
- Header language dropdown / mobile drawer, sticky-scroll behaviour, and keyboard tab order were **not** exercised in a real browser interaction by the agent; only DOM/structure was verified.

## 7. Screenshot paths

Directory: `docs/reports/phase-12.9-screenshots/`

| File | Viewport | Theme |
|---|---|---|
| `home-1920x1080-light.png` | 1920×1080 | light |
| `home-1600x900-light.png` | 1600×900 | light |
| `home-1440x900-light.png` | 1440×900 | light |
| `home-1280x800-light.png` | 1280×800 | light |
| `home-768x1024-light.png` | 768×1024 | light |
| `home-390x844-light.png` | 390×844 | light |
| `home-1440x900-dark.png` | 1440×900 | dark |
| `home-390x844-dark.png` | 390×844 | dark |

Dark shots were produced by seeding `localStorage.theme=dark` on the same origin and rendering the site in an iframe, then screenshotting (Chrome headless could not be scripted to toggle the in-page control). No "before" screenshots were captured (baseline source state had already been edited); this is an "after" set.

**Pixel inspection caveat:** the agent cannot view image pixels directly. Screenshots are artifacts for **human** review; automated checks were limited to luminance/colour sampling (non-blank pages, dark vs light, logo-mark colour present in header) and DOM assertions. No visual approval is claimed from DOM checks alone.

## 8. Test, typecheck, lint, build, runtime results

| Check | Command | Result |
|---|---|---|
| Frontend tests | `npx vitest run` | **PASS** — 62 files, 533 tests |
| TypeScript | `npx tsc --noEmit` | **PASS** (exit 0) |
| ESLint (changed files) | `npx eslint <changed files>` | **PASS** (exit 0, no warnings) |
| ESLint (source tree) | `npx eslint src` | **PASS** — 0 errors, 55 pre-existing warnings |
| ESLint (repo-wide `eslint .`) | `npx eslint .` | exit 1 — **pre-existing config gap**: `.next-prod126/` and `.next-prod127/` (custom dist dirs) are not in `globalIgnores`, so minified build output is linted. Unrelated to this phase; not modified. |
| Isolated prod build | `NEXT_DIST_DIR=.next-prod129 npx next build` | **PASS** (exit 0) — build-time ESLint (`ignoreDuringBuilds:false`) also passed |
| Runtime smoke | `/fa`, `/fa/products`, `/sitemap.xml`, `/robots.txt`, `/abar-energy-logo.png` | **200** for all; `/abar-energy-logo.png` = `image/png` 72 738 B |
| SEO safety | `/fa` robots meta `index, follow`; canonical `/fa`; sitemap/robots unchanged | **PASS** |
| Django checks | — | Not run: no backend files touched; `SiteSettings.logo`/`favicon` already migrated. |

Build-safety: the running dev server occupies `.next`; the build used the isolated `.next-prod129`, no existing build dir was deleted or overwritten.

## 9. Remaining issues / human visual review required

1. **Human visual review required** — confirm the actual logo artwork looks correct in the header/footer on light and dark surfaces, at the light chip size used (`h-7 sm:h-8`). The agent cannot see pixels.
2. **Favicon unchanged** — `src/app/favicon.ico` remains the framework default. The supplied asset is a **wide wordmark** (2.47:1), not a square mark; cropping it to a favicon would likely be poor. A proper favicon/apple-touch-icon requires a square icon variant or human design decision → left as a documented follow-up rather than a forced crop.
3. **No OG/social image from the logo** — no square/large-format suitable asset; left unchanged to avoid breaking existing SEO/OpenGraph behaviour.
4. **Frontend CMS logo upload** not implemented (design documented in §5). Logo replacement today is via Django admin only.
5. **Repo-wide `eslint .`** fails on pre-existing generated build dirs (`.next-prod*`); recommend adding `.next-prod*/**` to `globalIgnores` in a separate, unrelated cleanup.
6. **Bilingual hero eyebrow** deliberately shows `AbarEnergy — ابر انرژی` (English fallback when CMS settings are unavailable). Confirm this is acceptable in the Persian UI (it is the pre-existing bilingual masthead).

## 10. Final verdict

**PARTIALLY ACCEPTED**

- Logo integration (header + footer), shared component, localized brand names, tests/typecheck/lint/build/runtime all pass; dark/light and overflow verified programmatically.
- Partial because: (a) **pixel-level visual approval is not possible for the agent** and needs a human look; (b) the **favicon was not updated** (source is a wide wordmark, not a square icon); (c) **frontend CMS logo replacement** is not wired (backend supports it, frontend admin UI is read-only).

## Summary

The genuine `abar logo.png` (607×246 PNG, transparent, dark-green) is now the version-controlled brand asset at `public/abar-energy-logo.png`, rendered through one shared, accessible, RTL-aware `BrandLogo` component in both the global header and footer with a justified light chip for dark surfaces. Official names are consistent: `ابر انرژی` (fa), `AbarEnergy` (en/metadata/eyebrow); stale `AbrEnergy` strings removed from visible copy. Backend CMS already stores a logo; the agent did not touch backend schema. All 533 frontend tests, typecheck, source lint, the isolated production build, and production smoke tests pass; zero horizontal overflow measured at all required viewports. Remaining: human visual sign-off, a square favicon/OG asset, and an admin-UI logo upload control. STOP — Phase 13 not started.
