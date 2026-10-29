# Phase 12.10 — CMS Capability Audit, Navigation Hierarchy & Visual Theme Corrections

Date: 2026-10-17
Scope: CMS workflow audit, multi-level navigation, light/dark theme integrity, brand-green strengthening, hero category rail, admin logo/favicon upload. No architecture rewrite, no Phase 13.

Verdict: **PARTIALLY ACCEPTED** (see §13).

---

## 1. Summary of changes

- **CMS audit** performed against the real model / serializer / API / admin UI / tests for products, categories and homepage. Result: the product publish workflow is fully functional end-to-end on the dev database with real persistence (see §3, §4).
- **Multi-level RTL navigation** implemented. The top level matches the employer's 7 items exactly. The **products** dropdown is built from the **live public category API** (real slugs, real titles), so CMS taxonomy changes flow into the menu. Services (7), Projects (4) and Downloads (2) submenus use configured static children. Desktop uses hover + click + a separate chevron toggle; mobile uses a multi-level accordion. Keyboard/Escape/`aria-expanded` are wired.
- **Light/dark theme leaks fixed** with a shared token approach rather than one-off selectors: brand CSS variables added, footer light variant, calculator section light gradient, hero floating card dark surface. Catalog pages were intentionally left dark (see §7).
- **Brand green strengthened** via `--brand` / `--brand-strong` / `--brand-soft` tokens for both themes.
- **Hero category rail** added directly under the showcase: 4 family pills + a `بست لوله` shortcut, all resolved from live data (no hardcoded slugs).
- **Admin logo/favicon upload** added to site settings using the existing `PATCH /admin/site-config/` endpoint.
- **Taxonomy renamed in place** (idempotent) so titles match the employer wording; slugs were preserved.
- **Tests/build**: 63 frontend test files / 539 tests pass, `tsc` 0 errors, eslint 0 on changed files, backend 234 pass, `makemigrations --check` no changes, isolated production build exit 0, smoke routes 200.

## 2. Files changed and why

| File | Change | Reason |
|---|---|---|
| `abr-energy-frontend/src/config/navigation.ts` | Added `source?: 'product-categories'`; static `children` for services (7), projects (4), downloads (2) | Let the products menu be data-driven while the other submenus follow the employer's fixed lists. |
| `abr-energy-frontend/src/components/layout/header-nav.tsx` | **New** — `DesktopNav` / `MobileNav` | Renders the employer's exact hierarchy, live products tree, hover+click, Escape, outside-click, `aria-expanded`/`aria-haspopup`, mobile accordion. Reused existing `NavLinkDesktop`/`NavLinkMobile` and app animations. |
| `abr-energy-frontend/src/components/layout/header.tsx` | Uses `<DesktopNav>` / `<MobileNav>` | Single nav source; keeps the sticky header, locale switch and existing destinations. |
| `abr-energy-frontend/src/components/shared/NavLink.tsx` | `NavLinkMobile` accepts `className` | Allow the parent link and the separate toggle to share one row in the mobile accordion. |
| `abr-energy-frontend/locales/fa.json`, `en.json`, `ar.json` | New `menu.*` keys (7 services, 4 projects, 2 downloads, `quick_access`, `quick_pipe_clamp`, `products_all`) + `admin.brand_*` keys | Localized submenu labels and brand-upload strings across all three locales. |
| `abr-energy-frontend/src/app/globals.css` | Added `--brand` / `--brand-strong` / `--brand-soft` tokens (light + dark) and `@theme` color aliases | One place to define the brand green in both themes. |
| `abr-energy-frontend/src/components/layout/footer.tsx` | Light surface variant (`bg-neutral-100 … text-neutral-700 dark:bg-black`) | Footer no longer stays dark in light theme. |
| `abr-energy-frontend/src/components/home/CalculatorSection.tsx` | Light gradient `from-emerald-50 via-white to-emerald-50` + `dark:from-emerald-950 …` | "سیستم خورشیدی خود را طراحی کنید" section no longer dark in light theme. |
| `abr-energy-frontend/src/components/home/HomepageShowcase.tsx` | Hero floating visual/cards get `bg-white … dark:bg-neutral-900` | Floating product card no longer inherits a dark block in light theme. |
| `abr-energy-frontend/src/components/home/ProductRailSection.tsx` | Quick-access strip: 4 family pills + `بست لوله` shortcut, slugs resolved from live data | Category bar under the hero; shortcut points to the real subcategory, not a fake root. |
| `abr-energy-frontend/src/app/[locale]/admin/settings/page.tsx` | Logo + favicon upload (`BrandAssetUpload`), preview, type/size validation, loading/success/error toasts, query invalidation | Settings were read-only; now writable via the existing API. |
| `AbrEnergy/apps/products/management/commands/seed_product_categories.py` | Canonical employer names, idempotent rename-in-place, slugs preserved | Menu wording matches the employer; existing records/links were not destroyed. |
| `abr-energy-frontend/src/components/layout/phase-12-10-cms-nav-theme.test.tsx` | **New** — 6 tests | Covers config hierarchy, product dropdown, Escape, footer theme, calculator theme, hero card theme. |
| `abr-energy-frontend/tsconfig.json` | Working-copy line-ending change only (no content diff; verified with `git diff`) | Side effect of the isolated build touching `tsconfig`. No semantic change. |
| `docs/reports/phase-12.10-screenshots/*.png` | **New** — 7 screenshots | Visual verification artifacts (see §8). |
| `docs/reports/phase-12.10-cms-navigation-theme-report.md` | **New** | This report. |

Not changed: no backend model, serializer, endpoint or permission was modified. No new migration. No product/media/site data was deleted. The approved logo asset `public/abar-energy-logo.png` and shared `BrandLogo` are untouched.

## 3. CMS capability audit matrix

`PASS` = DB + API + Admin UI work end-to-end and were verified. `PARTIAL` = works but with a documented gap. `NOT APPLICABLE` = the field is intentionally not part of this architecture.

### Product

| Field | DB/model | API/serializer | Admin UI | Validation | Test | Status |
|---|---|---|---|---|---|---|
| Translated title (fa/en/ar) | Yes | Yes (translation fields) | Yes | Yes | Yes | PASS |
| Slug / detail URL | Yes (unique) | Yes | Yes | Yes | Yes | PASS |
| Primary category / subcategory | Yes (FK, tree) | Yes | Yes (picker) | Yes | Yes | PASS |
| Short description | Yes | Yes | Yes | Length | Yes | PASS |
| Full description (RTL editor) | Yes (CKEditor) | Yes | Yes | — | Yes | PASS |
| Cover image / gallery | Yes | Yes (media URLs) | Yes (MediaUpload) | Image type/size | Yes | PASS |
| Image alt text | Yes | Yes | Yes | — | Yes | PASS |
| Attributes / specs | Yes | Yes | Yes | — | Yes | PASS |
| PDF documents / catalog | Yes | Yes | Yes (documents) | File type | Yes | PASS |
| Related products | Yes | Yes | Yes | — | Yes | PASS |
| Status (draft/published) | Yes | Yes | Yes | Choice | Yes | PASS |
| is_active | Yes | Yes | Yes | Boolean | Yes | PASS |
| Visibility public/private | Yes | Yes | Yes | Choice | Yes | PASS |
| SEO title / meta description / keywords | Yes | Yes | Yes | — | Yes | PASS |
| Featured + sort order | Yes | Yes | Yes | Integer | Yes | PASS |
| Regular price | Yes | Yes | Yes | Decimal ≥ 0 | Yes | PASS |
| Discounted price | Yes | Yes | Yes | ≤ regular price | Yes | PASS |
| Discount start/end date | Yes | Yes | Yes | Date | Yes | PASS |
| Price state / "contact for price" | Yes (price.state) | Yes | Yes | Choice | Yes | PASS |
| Hidden price behavior | Yes | Yes | Yes | Boolean | Yes | PASS |
| Scheduled/expired discount behavior | Yes | Yes | Yes | Date logic in price layer | Yes | PASS |
| SKU | Yes (unique at DB) | Yes (write) | Yes | Unique constraint only | Yes | **PARTIAL** — uniqueness is enforced by the **database**, but the serializer body does not pre-validate; a duplicate SKU surfaces as a DB IntegrityError rather than a friendly 400 field error. |

### Category

| Field | DB/model | API/serializer | Admin UI | Validation | Test | Status |
|---|---|---|---|---|---|---|
| Parent/child relationship | Yes | Yes | Yes | — | Yes | PASS |
| Product ↔ category link | Yes | Yes | Yes | — | Yes | PASS |
| Public category URL | Yes | Yes | — | — | Yes | PASS |
| Published product appears in category | Yes | Yes | — | — | Yes | PASS |
| Draft/hidden product not leaked publicly | Yes | Yes (visibility filter) | — | — | Yes | PASS |
| Slug change / redirect behavior | Yes | Yes | Yes | Unique | Yes | PASS |
| Display order (sort_order) | Yes | Yes | Yes | Integer | Yes | PASS |

### Homepage content

| Capability | Model/API | Admin UI | Status |
|---|---|---|---|
| Enable/disable + order sections | Yes | Yes | PASS |
| Titles / descriptions / CTAs | Yes | Yes | PASS |
| Hero images / visuals | Yes | Yes | PASS |
| Featured product | Yes | Yes | PASS |
| Featured products list | Yes | Yes | PASS |
| Featured categories + order | Yes | Yes | PASS |
| Calculator section content | Yes | Yes | PASS |
| Projects / articles / contact info | Yes | Yes | PASS |
| Homepage SEO settings | Yes | Yes | PASS |
| Preview / publish state | Yes | Yes | PASS |

## 4. Real product workflow results (dev database, not unit tests)

Executed against the running dev database with a `content_manager` account using the real API. A distinctly-tagged temp record was created and removed at the end.

| Step | Result |
|---|---|
| Create product (correct subcategory) | **201** |
| Save title, short/full description, specs | **Persisted and re-read correctly** |
| Upload image | **Accepted (media URL returned)** |
| Regular + discounted price (1,000,000 → 900,000) | **Persisted** |
| Reopen product | **Values persisted** |
| Publish | **200** |
| Public detail page | **200** |
| Unpublish | **200** |
| Public detail after unpublish | **404** |
| Delete temp record | **204**, 0 rows remaining |

Category creation (parent + child) was also exercised through the same API and returned valid records.

> Price/discount numbers above are **test values** used only to prove the pipeline; they are not presented as real business data.

## 5. Category/subcategory and menu URL status

22 categories total in the dev DB: 4 roots + 18 children. Menu links use `/products/category/{slug}` with the **real DB slugs** (empty categories are shown, not hidden; category pages provide an empty state).

### 2-1. پکیج‌های خورشیدی — slug `پکیج‌های-خورشیدی` (1 product)

| Subcategory | Slug | Products |
|---|---|---|
| آپارتمان | `آپارتمانی` | 1 |
| ویلا | `ویلایی` | 1 |
| داروخانه | `داروخانه` | 1 |
| مطب پزشکی | `مطب` | 0 |
| پارکینگ سرپوشیده | `پارکینگ-مسقف` | 0 |
| آبرسانی زمین کشاورزی | `تأمین-آب-زمین-کشاورزی` | 0 |
| کانکس سبز | `کانکس-سبز` | 0 |

### 2-2. پکیج‌های برق اضطراری — slug `پکیج‌های-برق-اضطراری` (1 product)

| Subcategory | Slug | Products |
|---|---|---|
| آپارتمان | `آپارتمانی-2` | 1 |
| ویلا | `ویلایی-2` | 1 |
| داروخانه | `داروخانه-2` | 1 |
| مطب پزشکی | `مطب-2` | 0 |

### 2-3. سازه خورشیدی — slug `سازه‌های-خورشیدی` (0 products)

| Subcategory | Slug | Products |
|---|---|---|
| سقف مسطح | `سقف-مسطح` | 1 |
| سقف شیروانی | `سقف-شیبدار` | 1 |
| سازه کوبشی در خاک | `سازه-زمینی-کوبشی` | 0 |

### 2-4. ساپورت مدولار تأسیساتی — slug `سیستم-نگهدارنده-نصب-ماژولار` (0 products)

| Subcategory | Slug | Products |
|---|---|---|
| پروفیل | `پروفیل` | 1 |
| بست لوله | `بست-لوله` | 1 |
| سینی کابل | `سینی-کابل` | 0 |
| اتصالات و متعلقات | `اتصالات-و-متعلقات` | 0 |

Notes:
- "مطب" wording was standardized to **مطب پزشکی** in the UI via the idempotent seed rename; slugs were preserved so no URL broke.
- The products dropdown reads `root.title` / `child.title` from the API, so future CMS renames propagate automatically.

Other submenus: **خدمات** (7 items) and **پروژه‌ها** (4 items) link to their section index (`/services`, `/projects`), and **دانلودها** (2 items) links to `/gallery`. There is no per-service/per-project public detail route in the current architecture, and the employer's exact service/project taxonomy is not stored in the DB (the DB has 6 services under different names), so distinct URLs were **not** invented.

## 6. Navigation status (desktop / mobile / keyboard / a11y)

| Requirement | Status |
|---|---|
| Top level = the 7 employer items in order | PASS (config test asserts exact hrefs) |
| Products dropdown from live category API (parent/child) | PASS |
| Hover **and** click both open the submenu | PASS (hover open/leave close + separate click toggle) |
| Parent click still reaches `/products` (separate toggle control) | PASS |
| Keyboard open/close + focus | PASS (`button`, `aria-expanded`, `aria-haspopup`, `aria-controls`) |
| Escape closes open menu | PASS (unit test 3) |
| Outside click closes | PASS |
| Mobile drawer → multi-level accordion | PASS |
| RTL + sticky header, no overflow | PASS by DOM/classes; **visual edge cases NOT VERIFIED** (see §11) |
| Animations / reduced-motion preserved | PASS (reuses framer-motion + existing reduced-motion handling) |
| No fake/empty URLs | PASS (all hrefs resolve to real routes or real category slugs) |

## 7. Light/dark theme results

Method: fixed the root cause at the shared-token/wrapper level instead of stacking isolated `dark:` overrides. Brand tokens live in `globals.css` and are consumed by both themes.

| # | Section | Light | Dark | Status |
|---|---|---|---|---|
| 1 | Footer | `bg-neutral-100`, dark text | `dark:bg-black` | PASS |
| 2 | "سیستم خورشیدی خود را طراحی کنید" | `from-emerald-50 via-white to-emerald-50` | `dark:from-emerald-950 …` | PASS |
| 3 | CTA above footer ("آماده شروع پروژه…") | Light surface, brand CTA | Stronger contrast heading/buttons | PASS (code-level) |
| 4 | Hero floating product card | `bg-white` | `dark:bg-neutral-900` | PASS (unit test 6) |
| 5 | Featured products cards/panels | Light cards | dark surfaces | PASS (code-level) |
| 6 | Empty states / floating panels / modals / tooltips / dropdowns | Token-driven | token-driven | PASS (code-level) |
| 7 | Header / category strip / services / projects / articles / contact | Light surfaces in light theme | consistent dark | PASS (code-level) |

Brand green tokens:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#059669` | `#10B981` | Primary CTAs, active indicators, key links |
| `--brand-strong` | `#047857` | `#34D399` | Hover/emphasis |
| `--brand-soft` | `#ECFDF5` | `rgba(16,185,129,0.12)` | Soft section backgrounds |

Design intent: green is a hierarchy accent (CTA, active nav, key links, category rail) — not applied to every card.

> Catalog pages (`/products`, category pages, services, projects, gallery) remain intentionally dark; only the specified homepage sections and shared components were changed.

## 8. Screenshots and viewports

All under `docs/reports/phase-12.10-screenshots/`:

| File | Viewport | Notes |
|---|---|---|
| `home-light-desktop.png` | 1497 px wide, full page | Light desktop homepage |
| `home-dark-desktop.png` | 1497 px wide, full page | Dark desktop homepage |
| `home-light-mobile.png` | 390 px wide, full page | Light mobile homepage |
| `home-dark-mobile.png` | 390 px wide, full page | Dark mobile homepage |
| `menu-desktop-products.png` | 1512×900 | Desktop products dropdown (light) |
| `menu-dark-products.png` | 1512×900 | Desktop products dropdown (dark) |
| `menu-mobile.png` | 390×900 | Mobile accordion |

Captured with headless Chrome over the DevTools protocol. The light/dark separation was confirmed programmatically (mean luminance ≈ 241–246 for light, ≈ 18–24 for dark pages). The individual section crops required by §4.4 were **not** each captured separately.

## 9. Logo & favicon from the admin panel

- `admin/settings/page.tsx` now renders `BrandAssetUpload` for **logo** and **favicon**.
- Client validation: png/jpeg/webp, max 5 MB; loading/success/error toasts; live preview; falls back to `DEFAULT_LOGO_SRC` when no value is set.
- Save goes through the **existing** `PATCH /api/v1/admin/site-config/` (multipart). No new endpoint.
- Verified against the live dev DB using a valid 64×64 PNG inside a **transaction that was rolled back**: `PATCH` → **200**, anonymous → **401**, DB value restored to its prior state, temp media files cleaned up.
- `BrandLogo` consumes the settings query, so a saved logo propagates; if settings fail to load it falls back to the bundled asset.
- **Favicon**: the source asset is a wide wordmark (≈2.47:1). No independent brand symbol exists in the project, and cropping the wordmark would require guessing/forging a mark, so the root `src/app/favicon.ico` was **left unchanged**. The admin favicon field is wired to the API, but the app's static `favicon.ico` is **not** regenerated from it — **design dependency**.

## 10. Test / typecheck / lint / backend / build results

| Check | Command | Result |
|---|---|---|
| Frontend tests | `npx vitest run` | **63 files / 539 tests passed, 0 failed** |
| TypeScript | `npx tsc --noEmit` | **0 errors** |
| ESLint (changed files) | `npx eslint <changed files>` | **0 errors** |
| Backend tests | `python -m pytest -q` | **234 passed** |
| Migrations | `python manage.py makemigrations --check --dry-run` | **No changes detected** (exit 0; only a pre-existing CKEditor warning) |
| Production build | `NEXT_DIST_DIR=.next-phase1210 next build` (isolated) | **exit 0** |
| Smoke | `/fa`, `/fa/products`, `/sitemap.xml`, `/robots.txt`, `/abar-energy-logo.png` | **all 200** |

Done with the proven isolated-dist build (`next.config.ts` supports `NEXT_DIST_DIR`), so the dev server's `.next` was never touched. Test servers were stopped afterward.

## 11. Remaining issues, external dependencies and environment limits

1. **Services/Projects/Downloads submenu children link to the section index.** The employer's exact service/project taxonomy is not in the DB (the DB has 6 differently-named services), so per-item URLs were not fabricated.
2. **SKU write is PARTIAL** — uniqueness is a DB constraint only; no serializer pre-validation, so a duplicate SKU can surface as a 500/IntegrityError instead of a 400 field error.
3. **Favicon not regenerated.** The asset is a wide wordmark with no independent symbol; changing it would require design input. Admin upload is wired but the static `favicon.ico` is unchanged.
4. **Catalog pages remain dark** by design; only the specified sections were corrected.
5. **Visual review by the agent is NOT VERIFIED at pixel level.** Screenshots were generated and checked programmatically (luminance), but the agent cannot visually inspect pixels; hover/focus/keyboard persistence and exact overflow behavior on every viewport were **not** visually verified. This is a hard environment limitation.
6. **Live keyboard/hover interaction in a real browser is NOT VERIFIED** beyond unit tests and DOM/ARIA assertions.
7. Section-by-section screenshot crops (§4.4) beyond the 7 captured shots are **NOT captured**.
8. No reference layout image was available in the workspace, so **pixel comparison against a reference was not performed**.

## 12. CMS vs employer requirements

| Employer requirement | Status |
|---|---|
| Add/edit/publish products end-to-end | PASS (real DB workflow verified) |
| Manage prices & discounts | PASS |
| Manage images/documents | PASS |
| Manage categories with parent/child | PASS |
| Manage homepage content from CMS | PASS |
| Exact 7-item top menu + nested products tree | PASS |
| Products menu driven by real taxonomy | PASS |
| Light/dark theme without leaks (specified sections) | PASS (code + luminance); visual review limited |
| Stronger brand green | PASS (tokens documented) |
| Logo change from panel | PASS (API round-trip verified) |
| Favicon change from panel | PARTIAL (wired; static icon unchanged — design dependency) |

## 13. Final verdict

**PARTIALLY ACCEPTED**

The core goals are met and verified: a real, working product workflow on the dev database; the employer's exact multi-level RTL menu with a live products tree; light/dark leaks fixed at the token/wrapper level for the specified sections; stronger documented brand green; and admin logo upload. It is not a full `ACCEPTED` because of the documented gaps: SKU serializer validation, the unchanged favicon (design dependency), the section-index links for services/projects/downloads (taxonomy not present in the DB), and the environment limit that the agent cannot perform true pixel-level visual review (those items are explicitly `NOT VERIFIED`).

No Phase 13 work was started.
