# Phase 12.8 — Homepage Finalization, CMS Completeness and Demo Catalog Report
Date: 2026-10-13. Mode: BUILD. Verdict: PARTIALLY ACCEPTED.
STOP: Phase 13 not started.

## 1. Initial audit findings and evidence
- Tree: `master...origin/master [ahead 1]`; 16 modified files preserved, no reset. Untracked: `AbrEnergy/apps/homepage/management/` (new seed) + test-run `media/**` placeholders + report/shots.
- DB active: PostgreSQL `abrenv_db` (base.py:82-105, local.py), DEBUG=True. No `.env`. All migrations [X]. `makemigrations --check`: No changes. `check`: only ckeditor.W001 warning.
- Data start: products 0, cats 0, sections 8, config 1. Media on disk: products/350 PNG, documents/79 PDF, general/19 PNG — probed files 79-byte/13-37-byte placeholders; MediaFile rows 0. No real photography.
- Homepage: hierarchy already hero-categories-featured pinned, but `categories` case injected unconditional AboutSection breaking adjacency; hero did dead category fetch; slogan whitespace-nowrap clipped narrow viewports (tests enforced it).
- Theme: toggle hardcoded aria-label, no aria-pressed; ProductPrice scheduled/expired fixed dark colors; ProjectsSection fallback invisible on light; ArticlesSection raw img no resolveMediaUrl; fetchHomepage hardcoded fa.
- Nav: pills depth===0 only, children unreachable; useMemoRoots not memoized.
- CSS: duplicate reduced-motion blocks; .hero-stage-glow no .dark override; slogan line-height 1.5 + nowrap.
- CMS backend complete: Studio read/write, relations, visuals, SEO, preview gate. Product write serializer + duplicate + price validation present.

## 2. Source files changed and why
- `homepage-client.tsx`: AboutSection moved from categories case to featured case. Categories-featured adjacency exact now.
- `HeroSection.tsx`: removed dead category fetch/hook/memo; featured fetch enabled only when CMS payload absent (kills duplicate API call).
- `page.tsx` + `lib/homepage.ts`: fetchHomepage(locale) + generateMetadata params. en/ar SEO no longer forced to fa.
- `globals.css`: slogan line-height 1.7 + text-wrap balance (no clip, no nowrap); duplicate reduced-motion block removed; added .dark .hero-stage-glow.
- `header.tsx`: toggle aria-label i18n + aria-pressed.
- `ProductCategoryNavigation.tsx`: real useMemo roots/flat/childPills; active category children render as pills. Depth preserved.
- `ProductPrice.tsx`: scheduled/expired notes theme-aware.
- `ProjectsSection.tsx`: fallback icon visible both themes.
- `ArticlesSection.tsx`: covers via resolveMediaUrl.
- `use-api.ts`: useFeaturedPublicProducts supports enabled skip.
- 5 phase test files: whitespace-nowrap to hero-slogan-display; theme label to Persian.
- New: `AbrEnergy/apps/homepage/management/commands/seed_demo_catalog.py`: idempotent dev demo seed, DEBUG-guarded.

## 3. Final homepage hierarchy and screenshot paths
- Order: header/nav, masthead (brand-slogan-bar, H1 slogan), showcase (homepage-showcase stage 2.1fr/0.9fr + instant-offer-panel), category nav (product-rail, directly below), featured rail (directly after), About, services, calculator, projects, articles, contact, footer.
- DOM probe 1440x900: tops hero 0, categories 1065, featured 1677, services 3661, calculator 4344, projects 5760, articles 6489, footer 7093. 1 H1. 1 header nav. 0 overflow. 0 console errors. Rail 6 cards.
- Shots `docs/reports/phase-12.8-shots/`: 16 PNG light+dark, 1920x1080, 1600x900, 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844. PIL-verified sizes.
- Limit: agent cannot render image pixels; composition claims rest on DOM rects. Human eyeball pass required.

## 4. Light/dark audit results across every section
- Real Edge + playwright-core, localStorage preset + real toggle click, refresh persistence.
- Toggle flips .dark, persists after refresh (darkPersist true).
- Dark: categories/featured/services/projects/articles/contact oklch(0.145) charcoal; instant oklch(0.205); footer black, links oklch(0.87) readable.
- Light: categories/featured/services/articles white; projects/contact oklch(0.985) warm; footer charcoal with light links.
- Hero/calculator transparent (gradient layers) both themes by design; H1 readable via DOM.
- No contrast-meter run (oklch gradients); numeric WCAG not claimed.

## 5. CSS cleanup summary
- Removed duplicate reduced-motion block; single consolidated rule.
- Slogan nowrap to text-wrap balance, line-height 1.7. No clip at 390px.
- Added .dark .hero-stage-glow.
- Kept animations, glass, noise, rail scoping, responsive rules. No global rewrite.
- Left: CalculatorSection forced-dark editorial panel by design; custom RTL utilities duplicate Tailwind natives, untouched (risk over value).

## 6. CMS capabilities verified end-to-end
- Studio PATCH as content manager JWT: 200; public payload reflected eyebrow STUDIO-PROBE-128, articles 3 to 5; restore 200. Anon admin 401. Manager products 200.
- Existing API covers: hero copy/CTAs/enabled, featured/category/service/project/article relations+order+enabled, visuals upload/choose, sections enable/order, calculator/contact CTAs, SEO 7-field + OG, token preview. Product editor: fa title/slug/desc, category, SKU, gallery, PDFs, attrs/specs, relations, order/featured, status/visibility/active, SEO, translations, duplicate.
- Browser-click proof not redone; API-level proof above.

## 7. Product/category detail route verification
- Test client: product detail 200, category detail 200.
- Slug history + canonical redirect preserved, untouched.
- Rail hrefs are real category routes (no invented ids).

## 8. Price/discount behavior and validation
- Demo states: regular 5, discounted 4, contact_for_price 2, hidden 1.
- Invalid sale_gt_regular raises ValidationError (model + DB constraints).
- Public cards/spotlight/detail share backend get_effective; no React math. Strikethrough only on discounted.

## 9. Active database identification and migration state
- PostgreSQL abrenv_db localhost:5432, DEBUG True, dev only. SQLite file unused. No .env committed.
- All migrations applied. makemigrations --check: No changes. check: ckeditor.W001 only.

## 10. Demo seed command, idempotency, counts, verification
- Command: `python manage.py seed_demo_catalog` (refuses when not DEBUG unless --allow-production).
- Reruns: `categories created: 0`, `products=12 featured=6 cats=22`. No duplicates. Never deletes unrelated rows.
- Counts: DEMO products 12; cats 22; hfp/hc/hs/hp/ha = 6/8/3/2/3; MediaFile 0 (no fake image links).
- Payload: featured 6, cats 8, svc 3, prj 2, art 3. preview_leak False.
- Prices labeled [نمونه], descriptions state sample not official quote.
- PowerShell: verify DB via settings print; `python manage.py showmigrations --plan`; `python manage.py migrate`; `python manage.py seed_demo_catalog`; admin via `python manage.py seed_data` (admin@abrenv.com / content@abrenv.com); backend `python manage.py runserver 127.0.0.1:8000`; frontend `npm run dev -- --port 3000`.

## 11. Real records vs demo vs preview fixtures
- Real records: none in catalog (all 12 products are DEMO-). Homepage sections/config are shipped defaults.
- Demo DB rows: DEMO-001..012 + demo services/projects/articles, wired to homepage relations. Clearly marked [نمونه]. Dev DB only, never production.
- Preview fixtures: in-memory `preview-` slugs/titles, dev-only flag + NODE_ENV guard, never in build. Payload leak check False. Prod smoke /fa 200 with 0 preview leak (prior phase evidence; rebuild unchanged shape).

## 12. Tests, typecheck, lint, Django checks, build, runtime
- Frontend vitest: 62 files / 533 passed.
- Backend pytest: 234 passed.
- tsc --noEmit: exit 0.
- eslint touched files: 0 errors, 4 pre-existing warnings (img vs Image x2, unused Sun import).
- Django check: 1 ckeditor warning. makemigrations --check: No changes.
- next build isolated .next-phase128: exit 0, shared JS 102 kB. Prod smoke :3000 /fa 200 (88749 B), /fa/products 200, sitemap 200, robots 200. Build dir removed, tsconfig build artifact reverted.

## 13. Performance measurements and method
- Backend /api/v1/homepage/ via Django test client composition: fast (payload 6/8/3/2/3). HTTP timing polluted by anon 429 throttle during screenshot bursts (100/hour); no throttle weakened. Dev SSR /fa ~1011 ms during burst window (compilation + throttle fallback); prod SSR prior-phase 238 cold / 96 warm (unchanged code shape, not re-claimed as improvement).
- React Query: homepage/catalog 5-min staleTime; preview no-store. Hero3D lazy + idle + desktop-only + reduced-motion-off. Fonts unchanged Vazirmatn CDN display=swap. Images: next/image cover with sizes; article raw img kept (warning noted). No LCP/CLS/INP rig; not claimed.

## 14. Remaining limitations
- No real photography: MediaFile 0, all disk files placeholders. Frontend Sun/gradient fallbacks intentional. Owner must supply product photos.
- Screenshots are files only; no pixel eyeball by this agent. Human review required.
- No contrast-meter; oklch surfaces need manual WCAG spot-check.
- Anon throttle 429 self-inflicted during bursts; page falls back by design.
- Test-run media/** untracked placeholders (79 docs, 200+ products, 8 general) are backend test artifacts, not demo content. Left untouched per no-delete rule.
- Dead HeroShowcase export still present (unused); removal deferred to avoid test churn.

## 15. Verdict: PARTIALLY ACCEPTED
- Hierarchy, theme toggle+persist, CMS persist+permissions, routes, pricing, seed idempotency, gates, build, smoke all verified.
- Downgraded from ACCEPTED only by: human pixel eyeball pending + missing photography + contrast-meter unavailable.