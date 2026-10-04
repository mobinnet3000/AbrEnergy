# Phase 9.4-Preflight — Duplicate / Clone Architecture Audit Report

## 1. Status

**Status: PREFLIGHT COMPLETE — READ-ONLY, NO CODE CHANGED.**

This phase is an architecture audit ONLY. No duplicate/clone endpoint, UI
button, migration, model, serializer, hook, permission, role, dependency,
generator, media-copy logic, or background job was added. No Phase 9.4
implementation has started. Phase 9.3-B (Admin Dashboard Hub) is COMPLETE
and ACCEPTED and remains the baseline.

Verdict on the primary question: **Product and Category duplication CAN be
implemented safely as a small additive CMS feature** — zero schema changes
required, all relations have a safe copy/reference/omit assignment, and the
only genuinely load-bearing traps are (a) the Product SKU `unique=True`
column with no generator, and (b) the Product translation slug having NO
uniqueness constraint (collisions are silent ambiguity, not a 400). Both
are handled by the deterministic strategies in §7, with the exact suffix
schemes left as explicit OPEN DECISIONS (§25).

## 2. Date/time

Date: 2026-09-23 (UTC session, continuation directly after the accepted
Phase 9.3-B). Scope: audit + this report + STOP. No backend change, no
frontend change, no migration, no dependency change, no new locale keys,
no database writes of any kind.

## 3. Baseline

Accepted Phase 9.3-B baseline (re-stated from
`docs/reports/phase-09.3b-dashboard-hub-report.md`, not re-run — re-running
suites is unnecessary for a read-only audit and backend re-runs create
`media/` byproducts; no verification value would be added):

- Backend `python -m pytest apps/`: **163 passed**
- Frontend `npm run test` (vitest): **411 passed / 48 files**
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors, 54 warnings
- Production build: successful
- Runtime smoke: green
- Phase 9.3-A URL-persisted list state: accepted
- Phase 9.3-B Dashboard Hub: accepted
- No Phase 9.4 implementation has started

## 4. Files inspected

### 4.1 Prior reports (read completely before any inspection)

1. `docs/reports/phase-09-preflight-report.md`
2. `docs/reports/phase-09.1-list-efficiency-report.md`
3. `docs/reports/phase-09.2-content-lists-dirty-guards-report.md`
4. `docs/reports/phase-09.3a-url-persisted-list-state-report.md`
5. `docs/reports/phase-09.3b-dashboard-hub-report.md`
6. `docs/reports/phase-08.1-preview-architecture-report.md`
7. `docs/reports/phase-08.2-product-category-preview-report.md` — note:
   the phase brief names this file
   `phase-08.2-product-category-preview-ui-report.md`; no file exists under
   that name. The existing `phase-08.2-product-category-preview-report.md`
   was read instead (filename variance only; content is the authoritative
   8.2 record). Its load-bearing facts for this audit (preview =
   saved-state-only, edit-only Preview buttons, token flow) were
   additionally re-verified in current source (§4.3).
8. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
9. `docs/reports/phase-08.5-error-mapping-report.md`

No report line numbers were trusted; every claim below was re-located in
current source with exact `file:line` evidence.

### 4.2 Backend source (read in full for the audited models)

- `AbrEnergy/apps/products/models.py` — `ProductCategory` (:10–91),
  `SlugHistory` + `record_slug_history` (:93–180), `Product` (:183–252),
  `ProductImage` (:254–280), `ProductDocument` (:282–311),
  `ProductAttributeDefinition` (:313–338),
  `ProductAttributeValue` (:341–376), `ProductSpecification` (:379–392),
  `ProductPrice` (:395–493), `RelatedProduct` (:496–527)
- `AbrEnergy/apps/products/translation_models.py` — full file (:1–75):
  `ProductCategoryTranslation` (:5–30), `ProductTranslation` (:33–75)
- `AbrEnergy/apps/products/api/v1/serializers/products.py` —
  `ProductWriteSerializer` (:354–466),
  `CategoryWriteSerializer` (:469–495), read serializers (:23–351)
- `AbrEnergy/apps/products/api/v1/views/products.py` — public views
  (:39–154), admin views (:188–256), preview views (:267–339)
- `AbrEnergy/apps/products/admin.py` — `ProductAdmin` (:88–114),
  `ProductCategoryAdmin` (:73–85), `ProductPriceAdmin` (:124–128)
- `AbrEnergy/apps/products/api/v1/urls/admin_urls.py`,
  `admin_category_urls.py`, `products.py`, `categories.py`
- `AbrEnergy/config/api_v1.py` — public/admin mounts (:17–18, :45–46)
- `AbrEnergy/apps/homepage/models.py` — `HomepageFeaturedProduct`
  (:153–167), sibling relation tables (:170–223)
- `AbrEnergy/apps/media_manager/models.py` — `MediaFile` (:14–70)
- `AbrEnergy/apps/users/api/v1/permissions.py` — full file (:1–54)
- `AbrEnergy/apps/core/mixins.py` — `TranslatedSlugDetailMixin` (:4–17)
- `AbrEnergy/apps/products/migrations/0001_initial.py` — SKU column (:64)

### 4.3 Frontend source (inspected with `file:line` evidence)

- `abr-energy-frontend/src/app/[locale]/admin/products/page.tsx` — list,
  filters, row actions, toggles, delete flow
- `abr-energy-frontend/src/app/[locale]/admin/products/categories/page.tsx`
  — list, tree, row actions, add-child, delete flow
- `abr-energy-frontend/src/components/products/product-editor.tsx` —
  props, save modes, dirty guard, preview, error wiring, pickers
- `abr-energy-frontend/src/app/[locale]/admin/products/new/page.tsx` —
  create flow
- `abr-energy-frontend/src/app/[locale]/admin/products/[id]/edit/page.tsx`
  — update/delete/preview flows
- `abr-energy-frontend/src/app/[locale]/admin/products/categories/new/page.tsx`
  — create + Save & Continue
- `abr-energy-frontend/src/app/[locale]/admin/products/categories/[id]/edit/page.tsx`
  — update/delete/preview flows
- `abr-energy-frontend/src/hooks/use-api.ts` — all product/category hooks
  (:43–108), preview hooks (:184–205)
- `abr-energy-frontend/src/api/index.ts` — `adminProductCategoriesApi`
  (:163–183), `adminProductsApi` (:185–205), `previewApi` (:262–279)
- `abr-energy-frontend/src/lib/admin-permissions.ts` — full file (:1–33)
- `abr-energy-frontend/src/lib/product-form.ts` — payload builder
  (:266–324), section map (:390–436)
- `abr-energy-frontend/src/components/products/product-seo-fields.tsx` —
  full SEO field set
- `abr-energy-frontend/src/components/products/product-media-manager.tsx`,
  `product-documents-manager.tsx`, `src/components/shared/media-upload.tsx`,
  `document-upload.tsx` — attach-by-id semantics
- `abr-energy-frontend/src/app/[locale]/admin/content/homepage/page.tsx`
  + `homepage-relation-picker.tsx` + `src/lib/homepage-form.ts` —
  homepage relation shape
- `abr-energy-frontend/src/lib/api-errors.ts` — shared error normalizer
- Repo-wide case-insensitive grep for `duplicate|clone`,
  `sku|product_code|barcode`, `view_count`, `ManyToMany.*Product`

## 5. Product duplication matrix

Conventions: **Copy** = duplicate carries the same value / references the
same shared row; **Deep-copy** = new owned rows are created;
**Reset** = set to the safe default in §9; **Regenerate** = server-computed
fresh value per §7/§8; **Omit** = no row created on the duplicate.

| Field / Relation | Copy? | Reset? | Regenerate? | Reason |
|---|---|---|---|---|
| `id` UUID PK (`models.py:194`) | — | — | **Regenerate** (DB `default=uuid4`) | New resource; never reuse PK |
| `category` FK (`models.py:195-198`, `SET_NULL`) | **Copy reference** | — | — | Preserves catalog placement; `SET_NULL` means no cascade danger |
| `sku` (`models.py:199`, `unique=True`, required) | NO | — | **Regenerate** (OPEN DECISION §25.1) | Unique column; identical SKU = `IntegrityError`/400. No generator exists today |
| `status` (`models.py:200`) | NO | **Reset → `draft`** | — | Editorial safety: duplicate must never be publicly visible (§9) |
| `visibility` (`models.py:201`) | NO | **Reset → `hidden`** | — | Defense-in-depth alongside `draft`; public gate needs `public` (`views/products.py:40-51`) |
| `is_active` (`models.py:203`, default `True`) | NO | **Reset → `False`** (confirmable, §25.4) | — | Third leg of the public gate; one toggle to re-enable in editor |
| `is_featured` (`models.py:202`) | NO | **Reset → `False`** | — | Duplicate must not inherit front-page/list boost |
| `sort_order` (`models.py:204`) | **Copy** | — | — | Ties are harmless: `Meta.ordering=[sort_order,-created_at,id]` (`models.py:219-225`) breaks them deterministically; draft+hidden hides it publicly anyway |
| `published_at` (`models.py:205`, `null/blank`) | NO | **Reset → `NULL`** | — | `save()` re-stamps on first publish (`models.py:240-243`); inheriting it would falsify history |
| `seo_title` (`models.py:206`) | **Copy** | — | — | Advisory text; harmless pre-review |
| `seo_description` (`models.py:207`) | **Copy** | — | — | Same as above |
| `canonical_url` (`models.py:208`) | NO | **Reset → `""`** | — | MUST NOT duplicate canonical URLs (§12); absolute URL would point at the original |
| `robots` (`models.py:209`) | **Copy** | — | — | Draft+hidden keeps it out of public; editor adjusts |
| `og_title` (`models.py:210`) | **Copy** | — | — | Advisory text |
| `og_description` (`models.py:211`) | **Copy** | — | — | Advisory text |
| `og_image` FK (`models.py:212-215`, `SET_NULL`, reusable) | **Copy reference** (same `MediaFile` row) | — | — | Media reuse, not file copy (§11); `SET_NULL` so media deletion can't cascade to product |
| `created_at` / `updated_at` (`models.py:216-217`) | — | — | **Regenerate** (`auto_now_add`/`auto_now`) | New-resource timestamps (§16) |
| `translations` (all `fa`/`ar`/`en` rows present) | **Deep-copy** (new PKs, `product`→duplicate) | — | per-locale `slug` regenerated (§7); `title` gets copy suffix (§25.3) | Preserves translation-table design (§15); `unique_together=[product,language]` (`translation_models.py:47`) holds per new product |
| Translation `short_description`/`description`/`features` | **Copy** | — | — | Editorial content; `save()` re-sanitizes HTML (`translation_models.py:53-58`) |
| Translation `meta_title`/`meta_description` | **Copy** | — | — | Advisory SEO text |
| `images` (`ProductImage`, `CASCADE`, `models.py:254-280`) | **Deep-copy rows** (new PKs, SAME `media_file` FK) | — | — | Row duplication + media reuse (§11); single-cover invariant (`uniq_product_cover`, `models.py:269-274`) preserved naturally since exactly one cover row is copied; `save()` sibling-demotion (`models.py:276-279`) unaffected |
| `documents` (`ProductDocument`, `CASCADE`, `models.py:282-311`) | **Deep-copy rows** (new PKs, SAME `media_file` FK) | — | — | Same media-reuse rationale; `clean()` PDF-type rule (`models.py:307-310`) re-passes since same files |
| `attribute_values` (`CASCADE`, `models.py:341-376`) | **Deep-copy rows** (SAME `definition` FK) | — | — | Definitions are globally shared and MUST NOT be copied; `uniq_product_attribute` (`models.py:353-358`) holds per new product; `clean()` type-column rule (`models.py:360-367`) re-passes |
| `attribute_definitions` (shared table) | **Reference only — NEVER copy** | — | — | Global reusable catalog; copying would fork shared semantics (§8 W) |
| `specifications` (owned, `CASCADE`, `models.py:379-392`) | **Deep-copy rows** | — | — | Free-form owned data, no shared table |
| `price` (`OneToOne`, `CASCADE`, `models.py:395-493`) | **Deep-copy** (all fields incl. `display_mode`, amounts, `currency`, schedule, `is_active`) | — | — | Copy-then-review; `OneToOne` guarantees at most one row so no cardinality hazard; `CheckConstraints` (`models.py:468-493`) re-pass on identical values |
| `related_from` (outgoing `RelatedProduct`, `models.py:496-527`) | NO | **Omit (clear)** (confirmable, §25.5) | — | Safest default: avoids graph explosions and unintended storefront cross-links; editor re-adds deliberately |
| `related_to` (incoming, other products → original) | **Untouched** | — | — | Owned by other products; duplication must not rewrite third-party rows |
| No auto-link original ↔ duplicate | **Do NOT create** (confirmable, §25.5) | — | — | Inventing a visible relation is editorial, not mechanical |
| `SlugHistory` rows of original | **NEVER copy; create ZERO rows** | — | — | §13: first-owner-wins triple-unique (`models.py:129-134`) would collide or steal redirects; creation records no history by construction (empty `old_slug` no-op, `models.py:152-155`) |
| `homepage_feature` (`OneToOne`, `homepage/models.py:153-167`) | NO | **Omit** | — | §11 homepage strategy; a copy would place unreviewed content on the homepage |
| `view_count` | N/A | — | — | **Does not exist** in the Product domain (repo-wide grep: only `Article` has `view_count` — `apps/articles/models.py:77`) |
| Reverse `products` of a category / children | N/A (product-side) | — | — | Product duplication never moves or touches siblings |

Title/name note: `Product` has NO `title`/`name` column (`models.py:183-252`
full read; `__str__` falls back to fa title else SKU, `models.py:227-229`).
All naming lives in `ProductTranslation.title`.

## 6. Category duplication matrix

| Field / Relation | Copy? | Reset? | Regenerate? | Reason |
|---|---|---|---|---|
| `id` UUID PK (`models.py:18`) | — | — | **Regenerate** | New resource |
| `parent` FK (`models.py:19-22`, self-`CASCADE`) | **Copy reference (same parent)** — RECOMMENDED Option A (§6.1, confirmable §25.2) | — | — | Preserves tree position with zero new UX; deleting the parent cascades to both (expected tree semantics, must be documented to editors, not engineered around) |
| `slug` (`models.py:23`, `unique=True`, required) | NO | — | **Regenerate** `<slug>-copy[-N]` (§7) | DB-unique; identical slug = 400 via DRF unique validator |
| `sort_order` (`models.py:24`) | **Copy** | — | — | Ties broken by `[sort_order,created_at,id]` ordering (`models.py:46`); harmless |
| `is_active` (`models.py:25`) | NO | **Reset → `False`** | — | Inactive categories are excluded from public list/detail/composer (`views/products.py:54-68`, `serializers/homepage.py:126` per 8.1 §6); duplicate must not appear unreviewed |
| `is_featured` (`models.py:26`) | NO | **Reset → `False`** | — | Same visibility rationale |
| `cover` FK (`models.py:27-30`, `SET_NULL`, reusable) | **Copy reference** | — | — | Media reuse (§11) |
| `seo_title` / `seo_description` (`models.py:31-32`) | **Copy** | — | — | Advisory text |
| `canonical_url` (`models.py:33`) | NO | **Reset → `""`** | — | Never duplicate canonicals (§12) |
| `robots` (`models.py:34`) | **Copy** | — | — | Inactive keeps it out of public |
| `og_title` / `og_description` (`models.py:35-36`) | **Copy** | — | — | Advisory text |
| `og_image` FK (`models.py:37-40`, `SET_NULL`) | **Copy reference** | — | — | Media reuse |
| `created_at` / `updated_at` (`models.py:41-42`) | — | — | **Regenerate** | New-resource timestamps |
| `translations` (all rows present; note: category translation slug has NO auto-history — public resolves the MODEL slug, `models.py:74-90`) | **Deep-copy** (new PKs, `category`→duplicate; title suffix §25.3; translation `slug` copied with same `-copy` treatment for consistency) | — | — | `unique_together=[category,language]` (`translation_models.py:18`); translation `save()` only sanitizes + auto-slugifies (`translation_models.py:24-30`), records no history |
| `products` (reverse FK `related_name="products"`) | **NEVER move/copy** | — | — | Products stay in the original category; moving membership is editorial |
| `children` (reverse FK `related_name="children"`, cascade subtree) | **NEVER copy** (node only) | — | — | §14: copying the subtree risks exponential blowup and SKU/slug collisions per descendant; deep-tree clone is a separate feature, not this slice |
| Homepage category relation (`HomepageCategory`, `homepage/models.py:170-181`) | NO | **Omit** | — | Same homepage-safety rationale as products |
| `SlugHistory` rows of original | **NEVER copy; ZERO new rows** | — | — | Triple-unique first-owner-wins (§13); category history uses `language=""` (`models.py:90,105-107`) — a copy would collide on `(product_category,"",old_slug)` |
| `attribute_definitions` grouped under this category (`related_name="attribute_definitions"`, `SET_NULL`, `models.py:326-329`) | **Reference only — untouched** | — | — | Optional grouping survives category delete by design; duplication must not re-parent or fork definitions |

### 6.1 Category parent recommendation (Option A/B/C)

- **Option A — duplicate into the SAME parent (RECOMMENDED).** Evidence:
  the model imposes no sibling-slug uniqueness (slug is globally unique,
  `models.py:23`), the admin list renders a tree over a flat page
  (`buildCategoryTree`, `categories/page.tsx:143`) so a same-parent sibling
  appears adjacently and is immediately discoverable, and the Add-child flow
  (`new?parent=:id`, `categories/page.tsx:261-265`) proves same-parent
  placement is the CMS's native mental model. No new UX, no migration, no
  selector state.
- **Option B — duplicate as root: REJECTED.** Loses tree context, surprises
  editors (a nested category surfacing at top level), and still needs the
  same slug/SKU-equivalent regeneration — all cost, no safety gain.
- **Option C — duplicate with explicit parent selector: REJECTED for this
  slice.** A picker is new UX + new validation (self-parent check
  `productcategory_no_self_parent`, `models.py:50-55`, only guards
  self-parent, not cycles) with no proven need; the editor can move the
  duplicate with the existing parent dropdown afterwards. **Do NOT build a
  selector.** Revisit only if editors report misplacement pain.
- Hence: **Option A, marked OPEN DECISION §25.2 for explicit sign-off**
  (the safety properties are equivalent; this is a UX-positioning call).

## 7. Slug strategy (mandatory)

### 7.1 Where slugs live and how uniqueness is enforced (current source)

- **Product slug lives in `ProductTranslation.slug`** (`translation_models.py:37`):
  `SlugField(allow_unicode, max 500, blank, default="")` — **NOT unique,
  NO index, NO per-locale constraint.** Only `unique_together=[product,
  language]` (`translation_models.py:47`). Two products CAN hold the same
  `(language, slug)` pair with zero database error.
- **Product slug auto-generation:** empty slug → `slugify(title)` on
  `save()` (`translation_models.py:70-71`).
- **Category public slug lives on the MODEL** `ProductCategory.slug`
  (`models.py:23`): `SlugField(unique=True, allow_unicode, max 255)` —
  **globally unique at the DB level** (no per-locale dimension; category
  translation slugs in `translation_models.py:9` are NOT used for public
  resolution — confirmed by `CategoryDetailView.lookup_field="slug"`
  and `ProductCategory.save()` docstring `models.py:74-90`).
- **Public resolution is canonical-first, then history, else 404:**
  `ProductSlugResolveView` (`views/products.py:111-154`) checks
  `public_product_qs().filter(translations__slug)` (`views/products.py:134-138`)
  before history; `CategorySlugResolveView` (`views/products.py:157-185`)
  checks `ProductCategory(is_active, slug)` first. History targets are
  re-gated through the public filters, so drafts/hidden/inactive rows NEVER
  leak via history (`views/products.py:151,182`).
- **History triple-unique:** `(target_type, language, old_slug)`
  (`models.py:129-134`), first-owner-wins, never shadows canonical
  (`record_slug_history`, `models.py:143-180`, incl. race-safe
  `IntegrityError` re-read `:176-180`).

### 7.2 Consequences for duplication

- **Product translation slugs:** because there is NO constraint, copying a
  slug verbatim produces silent storefront ambiguity (two live products,
  one slug — winner is query-order-dependent), NOT a clean 400. The
  duplicate MUST therefore get a fresh slug by construction, even though
  the database would accept a copy.
- **Category model slug:** copying verbatim produces a deterministic 400
  (DRF unique validator on the write serializer); the duplicate MUST get a
  fresh slug or creation always fails.
- **Original slugs must NEVER be reused** by the duplicate: for categories
  the unique constraint forbids it; for products reuse creates the
  ambiguity above AND would poison future `record_slug_history` ownership
  (first-owner-wins keeps the original as history owner — correct — but
  canonical resolution would then be ambiguous).
- **The duplicate must create ZERO history rows** (§13).

### 7.3 Deterministic duplicate slug strategy (recommended)

Per language (product translations) / model slug (category):

1. `base = "<original-slug>-copy"` (ASCII suffix `-copy` regardless of
   locale — rationale below, confirmable §25.6).
2. If `base` is taken (product: exists in that language on another
   product; category: exists as a model slug), try `base-2`, `base-3`, …
   (i.e. `<original-slug>-copy-2`).
3. Bound the loop (recommended cap: 50 attempts for products, where the
   check is a cheap `EXISTS`; the category path additionally relies on the
   DB unique constraint + DRF validator as backstop). On exhaustion return
   400/409 — never loop unbounded.
4. Whole operation inside `transaction.atomic` (§20); concurrent-duplicate
   races resolve via the category unique constraint (one wins, loser
   retries to the next suffix) and via `record_slug_history`'s existing
   race-safe pattern as the model to imitate.
5. Empty-source-slug edge: if the original translation slug is `""`
   (allowed, `blank=True`), do NOT copy `""` — let `save()` auto-generate
   from the suffixed duplicate title (`slugify`, `translation_models.py:70-71`),
   then apply the `-copy` check on the generated value.

Why `-copy` and not a localized suffix or title-derived slug:

- The slug column is script-agnostic (`allow_unicode=True`) but URL
  behavior is most predictable with one ASCII machine suffix across
  `fa`/`ar`/`en`; a localized suffix (e.g. Persian) would triple the
  test matrix and complicate the bounded-collision loop for zero
  user-facing gain (slugs are barely user-visible in the fa CMS).
- Title-derived regeneration alone is fragile: identical titles
  `slugify` identically, re-introducing the ambiguity the strategy must
  eliminate. The `-copy` family is deterministic AND collision-checked.
- Aesthetics were not a factor; constraint-satisfaction was.

This strategy needs NO "try until the database accepts" open loop: the
bounded candidate walk + existence checks (+ DB unique backstop for
categories) terminates deterministically.

## 8. SKU audit

**SKU EXISTS in the Product domain.** (`"SKU does not currently exist"`
would be FALSE — the audit proves the opposite.)

- **Definition:** `Product.sku = CharField(max_length=64, unique=True,
  db_index=True)` (`models.py:199`). Required: NO `blank=True`/`null=True`
  — every product MUST supply a non-empty unique SKU. Migration:
  `0001_initial.py:64`.
- **Uniqueness enforcement:** DB `UNIQUE` (+ `db_index`).
- **API exposure:** write serializer field (`serializers/products.py:366`);
  list/detail/admin serializers (`serializers/products.py:168,176,180,249,346`);
  public + admin `search_fields` include `sku` (`views/products.py:76,220`);
  Django admin `list_display` + `search_fields` + `product__sku` on price
  admin (`admin.py:90,92,128`).
- **Frontend exposure:** `ProductFormState.sku` (`product-form.ts:67`),
  required client-side (`product-editor.tsx:170-173`), trimmed on submit
  (`product-form.ts:294`), list column (`products/page.tsx:377`), payload
  subtitle (`homepage/page.tsx:145-148` uses `sku` as picker subtitle),
  locale keys `sku_label`/`sku_field`.
- **Generation rules:** NONE exist. No generator, no sequence, no
  `default`. SKU is typed by the editor and validated required.
- **`product_code` / `barcode`:** definitively ZERO hits repo-wide
  (case-insensitive grep over backend, frontend, docs, tests).
- **Consequence:** duplication MUST regenerate SKU server-side (client
  cannot be trusted to invent uniqueness). The scheme is **OPEN DECISION
  §25.1** — recommended candidate `<SKU>-COPY` + bounded `-COPY-2…`
  walk inside the transaction, mirroring §7.3. No SKU system is invented
  in this preflight; a future human-friendly SKU sequence remains
  **deferred architecture** (noted, not designed).

## 9. Publication / visibility reset strategy (safety semantics)

Current public gate (backend source of truth):
`public_product_qs()` = `status="published" AND visibility="public" AND
is_active=True` (`views/products.py:40-51`), mirroring
`is_publicly_visible` (`models.py:246-251`). Categories: `is_active=True`
(`views/products.py:54-68` + composer). A row is public ONLY if ALL legs
hold — so resetting any single leg hides the duplicate; the recommendation
resets ALL of them (defense in depth, one editor pass to re-enable):

| Signal | Original | Duplicate | Why |
|---|---|---|---|
| `status` | any | **`draft`** | Unpublished = invisible under every public filter; matches model default (`models.py:200`) |
| `visibility` | any | **`hidden`** | Second leg; public needs `public` |
| `is_active` | any | **`False`** (confirmable §25.4) | Third leg; one toggle to re-enable |
| `is_featured` | any | **`False`** | No featured/list boost inheritance |
| `published_at` | any | **`NULL`** | Re-stamped on first publish (`models.py:240-243`) |
| `category` | X | **X (preserved)** | Placement is not visibility; `SET_NULL` FK, no leak |
| `prices` | present | **Copied** | Price data is invisible until publication; copy-then-review |
| `related products` | present | **Cleared** (§10) | No storefront cross-link inheritance |
| `homepage_feature` | may exist | **Omitted** | Never auto-feature (§11) |
| Category `is_active` | `True` | **`False`** | Inactive hidden from public + composer |
| Category `is_featured` | any | **`False`** | Same as product |

Net guarantee: a duplicate can reach the storefront ONLY after an editor
explicitly re-publishes it (status → published, visibility → public,
is_active → true). There is NO path where creation alone publishes.

## 10. Relation graph (Product)

```
Product (new UUID, regenerated SKU, reset publication per §9)
├── translations (fa/ar/en as present) .... DEEP-COPY (new rows; slug regenerated §7; title suffix §25.3)
├── images (ProductImage rows) ............ DEEP-COPY rows / REFERENCE same MediaFile (§11)
├── documents (ProductDocument rows) ...... DEEP-COPY rows / REFERENCE same MediaFile (§11)
├── attribute_values ...................... DEEP-COPY rows / REFERENCE same ProductAttributeDefinition (definitions NEVER copied)
├── specifications ........................ DEEP-COPY rows (fully owned, no shared table)
├── price (ProductPrice 0..1) ............. DEEP-COPY row (all fields)
├── related_from (outgoing RelatedProduct)  OMIT (clear; §25.5 confirmable)
├── related_to (incoming, owned by others)  UNTOUCHED (never rewrite third-party rows)
├── original ↔ duplicate auto-link ........ NEVER create (§25.5 confirmable)
├── homepage_feature (OneToOne) ........... OMIT (§11)
├── SlugHistory ........................... ZERO rows (§13)
├── og_image / category cover refs ........ REFERENCE same MediaFile rows (§11)
└── category FK ........................... REFERENCE same ProductCategory row
```

Shared-mutable-state rule applied: the only shared rows after duplication
are `MediaFile` (immutable-by-convention binary blobs — safe to share),
`ProductAttributeDefinition` (global catalog — safe to reference, dangerous
to fork), and the parent `ProductCategory` (placement — safe). Every
mutable owned row (images, documents, values, specs, price, translations)
is a fresh copy, so editing the duplicate can never mutate the original.

## 11. Media strategy

Current architecture (`media_manager/models.py:14-70`,
`product-media-manager.tsx:24-38`, `product-documents-manager.tsx:21-37`,
`media-upload.tsx:33-46`):

- `MediaFile` is a **reusable binary store**: all attachments are plain
  `FK`s (`ProductImage.media_file` `CASCADE`, `ProductDocument.media_file`
  `CASCADE`, `Product/Category og_image` + `Category.cover` `SET_NULL`).
  No `ManyToMany`, no per-product file ownership. The same `MediaFile` row
  MAY be referenced by many products by construction.
- CMS attach flow is **id-first**: `addImage`/`addDocument` return early
  without a `fileId` (`product-media-manager.tsx:25`,
  `product-documents-manager.tsx:22`); single-image fields store the
  `(url, id)` pair and submit only the id. Upload-then-attach, never
  attach-without-id.

Duplication semantics (three levels kept distinct as required):

- **A. Database relation duplication: YES.** Deep-copy `ProductImage` /
  `ProductDocument` rows (new PKs, copied `sort_order`/`is_cover`/
  `alt_text`/`caption`/`title`/`doc_type`/`is_active`/`description`) with
  the SAME `media_file_id`. Copy `og_image`/`cover` FK ids. The single-cover
  partial-unique (`uniq_product_cover`) holds because exactly one cover row
  is copied.
- **B. Physical file duplication: NO.** Zero new files, zero storage cost,
  zero cleanup liability. Explicitly out of scope for the implementation
  phase too.
- **C. Media reuse: YES — this IS reuse.** The duplicate references the
  same `MediaFile` rows, which is precisely the "reference existing media"
  shape the future Media Reuse Picker (Phase 9.3-B §25, still pending the
  `IsAdminUser`-vs-`IsContentManager` permission decision) will produce.
  **No conflict:** the picker attaches `media_file` ids to new rows; the
  duplicate path attaches `media_file` ids to new rows. Same shape, same
  endpoint family, no competing ownership model. One caveat to document in
  the implementation phase: `ProductImage.media_file` is `CASCADE`, so
  deleting a shared `MediaFile` removes the image rows on BOTH products —
  expected FK semantics, but editors should know shared media has shared
  fate (a picker-era concern, not a duplicate-phase blocker).

## 12. Related-product strategy

Semantics (`models.py:496-527`): **directed, non-symmetric** edges with
`UniqueConstraint[from_product,to_product]` (`models.py:514-517`), a
no-self-reference check (`models.py:518-526`), and public prefetch of
`is_active` edges only (`views/products.py:50,298`). No signal creates the
reverse edge; CMS dedupe is client-side (`product-relations-editor.tsx:49`).

Recommendation — **Option C: clear all outgoing relations on the duplicate;
touch nothing else** (confirmable, §25.5):

- A (preserve outward refs): rejected as default — inherits storefront
  cross-links to unreviewed destinations; each copied edge is an editorial
  claim the editor never made.
- B (duplicate reciprocal relations): rejected — writes rows owned by
  OTHER products (`related_from` = someone else), the one operation the
  audit forbids; doubles graph size per duplication.
- D (preserve-only-references): identical to A mechanically; same rejection.
- E/F (auto-link original ↔ duplicate): rejected — invents a visible
  merchandising relation; the editor can add it in one picker action.
- C (clear): zero graph explosion, zero third-party writes, zero invented
  relations; `sort_order`/`relation_type` choices remain the editor's.
  Incoming edges (`related_to`) are untouched by construction.

## 13. Homepage relation strategy

`HomepageFeaturedProduct`: `product OneToOne(CASCADE,
related_name="homepage_feature")` + `order` + `enabled`
(`homepage/models.py:153-167`); payload carries only FK + order + enabled
(`homepage-form.ts:122-175`); placement is via `HomepageRelationPicker`
which blocks duplicates client-side
(`homepage-relation-picker.tsx:63-68`).

Decision: **OMIT completely — the duplicate gets NO homepage row, inherits
NO placement/order/enabled state, and is NEVER auto-featured.** Rationale:
homepage placement is the highest-visibility editorial act in the CMS;
auto-featuring an unreviewed draft-equivalent contradicts every safety
rule in §9. (Mechanically a copy would even be legal — fresh product, no
`OneToOne` clash — which is exactly why the prohibition must be explicit,
not assumed.) Sibling tables (`HomepageCategory`, `HomepageService`,
`HomepageProject`, `HomepageArticle`) follow the same omit rule for
category duplication.

## 14. SEO strategy

Product SEO surface: model-flat `seo_title/seo_description/canonical_url/
robots/og_title/og_description/og_image` (`models.py:206-215`) + per-locale
`meta_title/meta_description` (`translation_models.py:41-42`), edited in
`product-seo-fields.tsx` (+ category parity pages) and mapped in
`buildProductPayload` (`product-form.ts:300-306`).

| SEO field | Duplicate behavior |
|---|---|
| `seo_title`, `seo_description`, `og_title`, `og_description`, `robots` | **Copy** — advisory text, invisible until publication |
| Translation `meta_title`, `meta_description` | **Copy** |
| `og_image` | **Copy reference** (same `MediaFile`) |
| `canonical_url` | **CLEAR → `""`** — never duplicate canonicals; an inherited absolute URL (which typically embeds the ORIGINAL slug) would assert false identity and split ranking signals |
| Absolute URLs embedding the old slug | **None auto-rewritten** — with `canonical_url` cleared there is no known slug-bearing absolute field left; document in implementation review that editors must re-check SEO after rename |

## 15. SlugHistory strategy

Implementation (`models.py:93-180`, writers `ProductCategory.save()`
`models.py:74-90` + `ProductTranslation.save()`
`translation_models.py:53-75`):

Decision: **the duplicate creates ZERO history rows and inherits NONE of
the original's rows.** Verification, not blind acceptance:

- Creation path records nothing by construction: `record_slug_history`
  no-ops on empty `old_slug` (`models.py:152-155`), and a new translation
  row has no prior slug to remember.
- Copying the original's rows is actively harmful: the
  `(target_type, language, old_slug)` triple is unique WITHOUT the owner
  (`models.py:129-134`) — re-pointing them at the duplicate would either
  `IntegrityError` or, via first-owner-wins (`models.py:162-168`), silently
  keep pointing at the original while suggesting otherwise. Either outcome
  corrupts redirect semantics.
- The invariant holds: the duplicate is a new resource with no past URLs,
  hence no redirects owed. History accrues naturally afterwards: when the
  editor renames the duplicate, `save()` records ITS OWN old slug with
  itself as owner — exactly the designed flow.

## 16. Category duplication semantics (products / children / misc)

Strong default CONFIRMED against the model (not assumed):

- **Products are NOT copied, moved, or re-pointed.** `Product.category`
  is `SET_NULL` (`models.py:195-198`); membership changes are editorial.
  The duplicate starts with ZERO products.
- **Children/descendants are NOT copied (node-only clone).** `parent` is
  self-`CASCADE` (`models.py:19-22`): copying the subtree would recursively
  multiply slug regenerations (each descendant needs §7 treatment) and SKU
  pressure (none for categories, but product membership questions compound).
  Deep-tree clone is a separate feature proposal, not this slice.
- **Parent is NOT copied** (a category's parent is an ancestor, not owned
  data) — the duplicate REFERENCES the same parent (Option A, §6.1).
- **Homepage category relation: omitted** (§13 logic applies).
- **Category images (`cover`, `og_image`): reference-copied** (§11).
- **Translations: deep-copied** (§6 table).
- **Slug history: zero rows** (§13).
- **`is_active`→`False`, `is_featured`→`False`** (§9); **`sort_order`:
  copied** (deterministic tiebreak, §6 table).

## 17. Translation strategy

Architecture: `fa`/`ar`/`en` rows in `ProductTranslation` /
`ProductCategoryTranslation` with `unique_together` per owner
(`translation_models.py:18,47`); active UI is Persian, `ar`/`en` dormant
but structurally live; frontend payload is fa-only
(`buildProductPayload`, `product-form.ts:282-292`).

- **Copy ALL translation rows present on the source** (fa + ar + en as
  found), each as a new row pointed at the duplicate. Rationale: preserve
  the translation-table design and never destroy dormant-locale investment.
- **Missing locales stay missing** (gaps preserved, not backfilled).
- **No locale activation, no i18n change, no copy-from-fa helper.**
- **Per-locale slug regeneration** (§7.3) applies to EVERY copied row
  (ar/en slugs collide just as silently as fa ones).
- **Title suffix** (§25.3) applies per copied row in its own language
  (exact suffix strings are the open decision; mechanics are not).

## 18. Timestamp / counter strategy

| Signal | Behavior | Evidence |
|---|---|---|
| `created_at` | New (`auto_now_add`) | `models.py:41,216` |
| `updated_at` | New (`auto_now`) | `models.py:42,217` |
| Translation `created_at`/`updated_at` | New (same auto semantics) | `translation_models.py:14-15,43-44` |
| `Product.published_at` | Reset `NULL`; re-stamped on first publish | `models.py:205,240-243` |
| `SlugHistory.created_at` | N/A — zero rows created | §13 |
| `view_count` | N/A — field does not exist on Product/Category | §5 table (Article-only: `apps/articles/models.py:77`) |
| `sort_order` | Copied (NOT a counter) | §5/§6 tables |
| `HomepageFeaturedProduct.order` / relation `order` | N/A — rows omitted | §13 |
| `RelatedProduct.sort_order` | N/A — rows omitted | §10 |

No usage counters, no audit-metadata columns, no `published_at` inheritance
anywhere in the duplicate path.

## 19. Permission strategy

- Backend: all product/category admin views require
  `[IsAuthenticated, IsContentManager]` (`views/products.py:188-256`
  pattern); `IsContentManager` = super_admin / website_admin /
  content_manager (`permissions.py:23-33`).
- Frontend: `canManageProducts` delegates to
  `canManageProductCategories` = `MANAGER_ROLES.includes(role)`
  (`admin-permissions.ts:5,13-21`) — one CMS gate for products+categories;
  lists gate create buttons and row actions on it
  (`products/page.tsx:47-48,258-262,421-423`,
  `categories/page.tsx:42-43,284-288`).
- **Recommendation: duplicate reuses the EXISTING create/manage capability
  — no new permission, no new role, no backend authorization change.**
  `POST .../duplicate/` requires `[IsAuthenticated, IsContentManager]`
  exactly like `POST .../` (create); frontend Duplicate actions gate on
  `canManageProducts` / `canManageProductCategories` exactly like the
  existing create/edit/delete actions. Backend stays authoritative (all
  list create buttons except products/categories are already ungated with
  backend authority — 9.3-B §4.7 precedent).
- **Do NOT create permissions now** (nothing was created — read-only phase).

## 20. Proposed backend API (DESIGN ONLY — not implemented)

Smallest additive contract (two actions, no new app, no new serializer
family for v1):

```
POST /api/v1/admin/products/<uuid:pk>/duplicate/
POST /api/v1/admin/product-categories/<uuid:pk>/duplicate/
```

- **Naming:** `duplicate` (verb matching the CMS concept; zero existing
  `duplicate|clone` entity hits repo-wide, so no collision). Mounted on the
  existing admin routers (`admin_urls.py`, `admin_category_urls.py`) as
  `@action(detail=True, methods=["post"])`-style detail routes — same file
  family as the `preview/` detail routes (`admin_urls.py:6-9` precedent).
- **Request body:** none required (empty `{}` accepted). Server generates
  SKU/slugs/naming; accepting client-supplied slug/SKU would re-introduce
  the uniqueness races this design eliminates. (Whether to accept an
  OPTIONAL `{}` for future extensibility: no — YAGNI; add only on proven
  need.)
- **Permissions:** `[IsAuthenticated, IsContentManager]` — identical to the
  sibling admin views (§19).
- **Response:** `201 Created` with the full admin detail representation
  (`AdminProductDetailSerializer` / admin category detail) of the NEW
  resource, so the frontend can navigate to its edit page without a second
  fetch (the new `id` is already part of the detail).
- **Serializer strategy:** NO new write serializer. Implement as a
  service-level copy function (new `duplication.py` module under
  `apps/products/`, unit-testable without HTTP) that builds the copy with
  the ORM (reusing model `save()` so slug-history no-ops, HTML sanitizing,
  and cover-demotion behaviors run unmodified), then serializes the result
  with the EXISTING admin detail serializers. The `ProductWriteSerializer`
  nested-write machinery (`_save_nested`, delete+recreate on update,
  `serializers/products.py:402-466`) is for editor payloads, NOT for
  duplication — duplication writes rows directly and never round-trips
  through editor semantics.
- **Atomicity:** entire copy wrapped in `transaction.atomic` (product +
  translations + images + documents + values + specs + price). Any failure
  (validation, integrity, media-FK check) rolls back to zero rows.
- **Idempotency:** deliberately NON-idempotent — each call creates a new
  resource (like create). No idempotency key; document it. Double-click
  protection is a FRONTEND concern (disable while pending, §21).
- **Errors:** `404` unknown `pk` (same envelope `{status, errors}`);
  `403` wrong role; `400`/`409` when bounded SKU/slug generation exhausts
  (§7.3, §8); nested-row validation failures surface through the standard
  `custom_exception_handler` envelope (`apps/core/exceptions.py` per 8.5
  §5.1) so the existing `normalizeApiError` path renders them with zero new
  error architecture.
- **Validation:** source must exist and be readable via admin detail
  queryset; NO extra state preconditions (duplicating a draft is legal —
  the copy is a draft too).
- **Conflict behavior:** deterministic, no silent sharing: SKU/slug
  candidates walked boundedly; DB constraints (SKU unique, category-slug
  unique) are the backstop, mapped to 400/409, never 500 (`_save_row`'s
  `IntegrityError`→`ValidationError` pattern, `serializers/products.py:390-400`,
  is the model to imitate).

## 21. Proposed frontend UX (DESIGN ONLY — not implemented)

Placement and flow (all within existing architecture):

- **List row action (primary):** a "Duplicate" item in the existing
  overflow `DropdownMenu` on product rows (`products/page.tsx:406-419`)
  and category rows (`categories/page.tsx:251-271`), gated by the same
  `canWrite` that gates the menu today. No new menu component, no toolbar
  redesign. (Edit-page duplication button: OPTIONAL follow-up, not in the
  minimal slice — the list action covers the workflow and the editor's
  dirty-guard interactions stay untouched.)
- **Flow:** click Duplicate → menu item shows pending/disabled state →
  `POST .../duplicate/` via a new `useDuplicateAdminProduct` /
  `useDuplicateAdminProductCategory` hook (same `use-api.ts` pattern, keys
  under existing `admin-products` / `admin-product-categories` namespaces,
  invalidating list queries on success like the create hooks
  `use-api.ts:77-86,47-53`) → success toast (one new locale key per entity,
  fa/ar/en parity — same pattern as `product_created`/`category_created`) →
  `router.push` to the new resource's edit page
  (`/admin/products/<newId>/edit`,
  `/admin/products/categories/<newId>/edit`).
- **Why open the edit page:** the duplicate is a draft-like unreviewed
  resource (§9); landing in its editor (whose dirty latch starts clean,
  `product-editor.tsx:96-109`, category `edits={}`) is the review funnel.
  Auto-save nothing; the copy is already persisted server-side.
- **Dirty-state behavior:** none involved — list pages own no dirty state;
  the target edit page loads clean from the server. The 8.3 guard
  (`useDirtyNavigationGuard`) needs zero changes; its dialog copy needs
  zero changes.
- **Loading state:** per-item pending (menu item disabled + spinner);
  double-submit blocked while pending (idempotency is frontend-held, §20).
- **Success toast:** new keys (e.g. `product_duplicated`,
  `category_duplicated`) — the ONLY new locale keys this feature should
  ever need.
- **Error mapping:** `normalizeApiError` →
  permission(403)→`permission_denied`, network→`server_connection_failed`,
  validation→`mapProductErrors`-style section box (product) or inline
  `role="alert"` summary (category) — the exact 8.5 patterns
  (`api-errors.ts`, `product-form.ts:380-436`, category pages `:111-126`).
  No new error architecture; a `400 {sku…}` / `{slug…}` surfaces under
  Identity like any validation error.
- **No confirm dialog** (recommended): duplication is a non-destructive
  create; a confirm adds a click to the highest-frequency repetitive op
  (9.0 P2-3 motivation). Confirmable if review prefers safety theater —
  recorded as a non-blocking choice, not an open decision.

## 22. Transaction / concurrency strategy (DESIGN ONLY)

- **Boundary:** one `transaction.atomic()` per duplication request covering
  the product/category row + ALL nested rows (translations, images,
  documents, values, specs, price). Read of the source happens inside the
  same transaction (`select_for_update` on the source row RECOMMENDED to
  serialize concurrent duplicates of one source competing for the same
  `-copy` suffix chain).
- **Concurrent duplicate requests (same source):** both walk the suffix
  chain; the row-level lock serializes the walks; the loser sees the
  winner's slug/SKU via its existence check and advances to `-copy-2`.
  Residual races (TOCTOU between check and insert) are caught by the DB
  unique backstops (SKU unique everywhere; category slug unique) and mapped
  to next-suffix retry, bounded (§7.3). Products' translation slugs have NO
  backstop — hence `select_for_update` serialization is load-bearing there,
  not optional.
- **Uniqueness conflicts:** never 500. `IntegrityError` → next candidate
  (bounded) → 400/409 with field context on exhaustion.
- **Nested relation creation failure** (e.g. dangling `media_file` FK,
  `definition` FK, price check-constraint): whole transaction rolls back;
  zero partial rows; error surfaces via the standard envelope.
- **No background jobs, no locks beyond the row lock, no new isolation
  level.** Expected contention is near-zero (human-rate CMS actions).

## 23. Test plan (DESIGN ONLY — no tests written)

Backend (new `test_phase94_duplicate.py`-family, isolated test DB only):

1. Permission: anonymous 401, customer/engineer 403, content_manager +
   website_admin + super_admin 201 (both endpoints).
2. Duplicate product happy path: all §5 Copy/Deep-copy fields equal,
   §9 resets hold, category preserved, price copied.
3. Duplicate category happy path: §6 table holds, same-parent placement.
4. UUID regeneration: `id` differs; all nested-row PKs differ.
5. SKU uniqueness: duplicate SKU differs, matches `<SKU>-COPY` family;
   repeated duplication yields `-COPY-2…`; no `IntegrityError` escapes.
6. Slug uniqueness: per-locale product slugs differ and are suffixed;
   category slug differs; original slugs untouched.
7. Slug-history isolation: ZERO new `SlugHistory` rows after duplication;
   original rows still point at the original (`object_id` unchanged).
8. Publication reset: duplicate invisible to `public_product_qs()`,
   public detail 404, slug-resolve misses; category `is_active=False`
   excluded from public tree.
9. Media relation behavior: `ProductImage`/`ProductDocument` row counts
   copied, `media_file_id` identical (reuse), zero new `MediaFile` rows,
   zero files created; cover preserved exactly once.
10. Translation copying: all locales copied, gaps preserved, no ar/en
    activation side effects.
11. Nested relation copying: values reference SAME definitions (definition
    count unchanged), specs deep-copied, price deep-copied 1:1.
12. Related-product behavior: duplicate `related_from` count = 0; original
    relations unchanged; no reverse rows created.
13. Homepage isolation: no `HomepageFeaturedProduct`/`HomepageCategory` row
    for the duplicate; homepage payload unchanged.
14. Atomic rollback: forced mid-copy failure (e.g. broken media FK) leaves
    zero product/translation/nested rows.
15. Repeated duplicate: N duplicates of one source → N distinct SKUs/slugs,
    all drafts, all hidden.
16. Conflict behavior: exhausted suffix walk → 400/409 envelope (not 500);
    unknown UUID → 404.

Frontend (vitest, mocked transport, real components):

1. Action visibility: Duplicate menu item renders iff `canWrite`; hidden
   for read-only roles (lists still render).
2. API call: click → exactly one `POST <id>/duplicate/`; button disabled
   while pending (no double-submit).
3. Loading state: spinner/disabled; menu closes or holds per existing menu
   behavior (assert exact, don't invent).
4. Success navigation: `router.push` to `/edit` with the RETURNED id (not
   the source id); success toast shown.
5. Error mapping: 403 → `permission_denied` toast; 400 validation →
   inline/section errors via existing mappers; network → connection toast.
6. Dirty-guard interaction: none triggered (list has no dirty); target edit
   page loads clean (no Stay/Leave dialog on immediate leave).
7. Duplicate placement: category duplicate appears under the same parent
   node; product duplicate appears in the list (draft badge).

## 24. Migration assessment

**No migration required.** Duplication creates ROWS with the existing
schema (ORM `create()` on current models); it adds no column, no table, no
constraint, no index. Verified: every §5/§6 assignment maps to an existing
field; the bounded suffix walks need no new uniqueness (they work WITH
current constraints); `makemigrations --check` impact is nil by
construction. If a future SKU-sequence system is ever approved (§8
deferred note), THAT would need a migration — explicitly out of this scope.

## 25. Risks

1. **Product translation slug has no uniqueness backstop** (§7.1) — a bug
   in the suffix walk silently creates ambiguous storefront slugs instead
   of failing loudly. Mitigation: `select_for_update` serialization (§22)
   + per-language `EXISTS` checks + test §23.6 asserting suffix presence.
2. **SKU race under concurrency** — mitigated by transaction + bounded
   retry + unique backstop (§22); exhaustion returns 400/409, never 500.
3. **`ProductImage.media_file` CASCADE with shared rows** (§11): deleting a
   shared `MediaFile` removes image rows on both products. Expected FK
   semantics, but must be editor-documented (picker-era concern).
4. **Category `parent` CASCADE** (§6): deleting a parent deletes the
   duplicate too. Expected tree semantics; same-parent placement (§6.1)
   makes this visible, not hidden.
5. **Category admin-URL shadowing (pre-existing, discovered, NOT touched):**
   `admin_category_urls.py:6-10` lists `<uuid:pk>/` before `attributes/` —
   a literal `attributes/` path would match `<uuid:pk>/` first if ever
   routed without a UUID. New `duplicate/` DETAIL routes
   (`<uuid:pk>/duplicate/`) nest UNDER the pk prefix and are unaffected,
   but the file's ordering should be eyeballed during implementation.
6. **Title-suffix locale copy** (§25.3) is the only user-visible string
   invention; keep it to the two toast keys + title suffix, all with
   fa/ar/en parity, or the 9.x locale discipline breaks.
7. **`save()` side effects run on every copied row** (HTML sanitizing,
   auto-slugify, cover-demotion, `published_at` stamping) — desired
   (identical values re-pass identically), but the implementation must call
   `save()`/`full_clean()` per row rather than `bulk_create` (which
   bypasses `save()` AND history recording per `models.py:109-112`).

## 26. Open decisions

Explicitly UNDECIDED — implementation must not silently choose:

- **§25.1 SKU regeneration scheme.** Candidates: `<SKU>-COPY`,
  `<SKU>-COPY-2…` (recommended for symmetry with §7.3) vs server sequence.
  No generator exists; any choice is new behavior.
- **§25.2 Category parent behavior.** Recommended Option A (same parent,
  §6.1); needs explicit sign-off because B/C are defensible UX positions.
- **§25.3 Duplicate title suffix + language.** Candidates:.fa `«<title>
  (کپی)»` vs `(copy)` vs none (identical titles are DB-legal but
  undiscoverable in lists). Per-locale application to ar/en rows also
  undecided. Only the mechanics (suffix-then-slugify ordering) are fixed.
- **§25.4 Product `is_active` reset to `False`.** Recommended (third gate
  leg, §9) but slightly more state churn than the minimal draft+hidden;
  confirm the extra toggle is acceptable.
- **§25.5 Related-product clearing + no auto-link.** Recommended C + no
  E/F (§10); confirm editors don't expect relation inheritance.
- **§25.6 Slug suffix language.** Recommended ASCII `-copy` family for all
  locales (§7.3); confirm no localized-suffix requirement.
- **§25.7 Homepage omission.** Recommended omit (§13 logic); confirm no
  workflow expects featured-state inheritance.
- **§25.8 Permission scope.** Recommended reuse of `IsContentManager` /
  `canManage*` with zero new permissions (§19); confirm content_manager
  (not just website_admin/super_admin) should duplicate.

## 27. Exact recommended implementation scope for the NEXT phase

Smallest safe slice (nothing more):

1. Backend: new `apps/products/duplication.py` (pure copy functions for
   product + category per §5/§6/§7/§9) + two `@action(detail=True,
   methods=["post"])` `duplicate` routes with `[IsAuthenticated,
   IsContentManager]`, `transaction.atomic`, bounded SKU/slug walks,
   201-with-detail responses (§20). Resolve §25.1–§25.8 FIRST (they are
   input, not output, of the implementation).
2. Frontend: Duplicate menu items on the two lists + two
   `useDuplicate*` hooks + success-toast keys (fa/ar/en) + push-to-edit
   navigation (§21). No edit-page button in the minimal slice.
3. Tests: §23 matrix (backend 16 + frontend 7 areas).
4. Verification: backend 163+new, frontend 411+new, tsc, lint, build,
   smoke — the standing 9.x gate.
5. Explicitly EXCLUDED from the next phase: edit-page duplicate buttons,
   category parent selector, subtree clone, bulk duplicate, SKU
   sequences/generators, media file copying, background jobs, new
   permissions/roles, ar/en activation, SEO auto-rewrite, any migration.

## 28. Explicit STOP

**STOP. No duplicate/clone was implemented. No media reuse was implemented.
No Phase 9.4 implementation was started. No backend file, frontend file,
migration, dependency, permission, role, or database row was touched. No
POST/PATCH/PUT/DELETE, seed, migration creation/execution, database reset,
or content mutation was performed — verification was source inspection and
read-only static analysis only (runtime write verification was
intentionally skipped per the brief §23). Awaiting review of this report
and explicit resolution of §26 before ANY implementation begins.**

---

## Appendix A — Primary-question answers (A–W) index

A. Duplicated (§5/§6 tables + §10 graph): translations, image/document
rows, attribute values, specifications, price, SEO advisory text,
media/category/definition references. B. NEVER duplicated (§5/§6 + §13):
PKs, SKU/slugs (regenerated), history rows, homepage rows, related edges,
definitions, category membership/children, canonical URLs, timestamps,
counters. C–E. Copy/regenerate/reset assignments: §5 + §6 matrices.
F. Slug uniqueness: §7. G/H. SKU: EXISTS (§8; the §6-H negation sentence
does not apply). I. Naming: title suffix OPEN (§25.3). J. Publishing: §9.
K. Prices: deep-copied (§5). L/M. Gallery/documents: row-copy + media
reuse, no file copy (§11). N. Attributes/specifications: values+specs
copied, definitions referenced (§5/§10). O. Related products: cleared, no
auto-link (§10). P. Category parent/children: same-parent ref, node-only
(§6.1, §14). Q. SEO: copy except canonical cleared (§12). R. Slug history:
zero rows (§13). S. Homepage: omitted (§13 homepage + §11 strategy).
T. Timestamps: regenerated/nulled (§18). U. UUID/PK: regenerated (§5/§6).
V. Translations: all rows copied, gaps kept (§15). W. Nested relations:
graph in §10.

*(End of report)*
