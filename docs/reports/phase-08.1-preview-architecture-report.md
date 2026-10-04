# Phase 8.1 — Draft/Preview Architecture Investigation Report

Date: 2026-09-22. Scope: preview architecture ONLY (investigation + minimal
safe implementation + focused verification + STOP). No dirty-guard, no
read-only UX, no error-mapping, no picker debounce, no broad SEO change, no
Phase 8.3+, no redesign. All five prerequisite reports were read before any
action: `phase-08-preflight-report.md`, `phase-06.1-runtime-recovery-report.md`,
`phase-07-cms-content-homepage-report.md`, `phase-07.5-cms-acceptance-audit-report.md`,
`phase-07.6-three-runtime-recovery-report.md`.

---

## 1. Executive Summary

**Status: COMPLETE (minimal safe slice).** The architecture question is
answered: preview means **option B — rendering already-saved content that is
normally hidden by public filters**. True unsaved-draft preview (option A)
would require a new persistence/versioning system and is **deferred with
rationale** (§28). The decision gate passed (§12): the selected architecture
is strictly additive — no public filter, permission, migration, or dependency
was touched.

Implemented (minimal): stateless signed preview tokens
(`django.core.signing`, no new crypto/dependency) + explicit preview
endpoints for homepage, product, and category + a homepage preview route that
reuses `HomepageClient` verbatim + a Preview button in Homepage Studio.
Public routes are proven byte-equivalent (live 11-key homepage payload,
public ignores tokens). Suites: backend **163 passed** (143 + 20 new),
frontend **180 passed / 26 files** (174/25 + 6 new), tsc 0 errors, lint
0 errors / 55 warnings (identical count), production build success,
prod `/fa` 200 byte-identical to the 7.6 baseline (75,479 bytes).

## 2. Preflight Baseline

Phase 8.0 preflight accepted baseline, re-verified at session start via
`git status` (4 modified files = the accepted Phase 7.5 fixes, untouched by
this phase except `serializers/homepage.py` which now stacks 8.1 additions on
top of the 7.5 fix): backend 143 passed, frontend 174/25, tsc 0 errors, lint
0 errors / 55 warnings, prod `/fa` 200, no dependency/database changes, 7.6
runtime issue resolved (canonical build workflow followed: port 3000 verified
free before building; `.next` deleted after the prod probe, never while dev
was live).

## 3. Existing Draft/Publication Semantics

There is **no unified draft system** — confirmed by code audit, not assumed:

- Products: `status` ∈ draft/published/archived + `visibility` ∈
  public/hidden + `is_active` (`apps/products/models.py:200-204`,
  `is_publicly_visible:245-251`). Public gate: `public_product_qs()`
  (`apps/products/api/v1/views/products.py:39-50`) =
  `status=published + visibility=public + is_active=True`.
- Categories: `is_active=True` (`CategoryListView:58`, `CategoryDetailView:67`,
  homepage composer `serializers/homepage.py:126`).
- Services: model `status` ∈ active/inactive (default active). The standalone
  public endpoint is **unfiltered** `.all()`
  (`apps/services/api/v1/views/service.py:14-31`); the homepage composer
  applies `status="active"` locally (`homepage.py:142`).
- Projects: `status` ∈ planning/in_progress/completed/on_hold/cancelled —
  **no draft/hidden state exists**; composer excludes only `cancelled`
  (`homepage.py:157-159`).
- Articles: `status` ∈ draft/published/scheduled; public = `published`
  (`homepage.py:176`; article views filter published for anonymous).
- Homepage: `HomepageConfig` singleton (pk=1, `load()`/`save()`),
  `HomepageSection.enabled` per key (8 keys), `HomepageVisual.enabled`,
  five OneToOne relation tables with per-row `order` + `enabled`.
- No versioning, staging copy, revision history, or scheduled publishing
  anywhere (grep `preview|draft.*token|TimestampSigner|Signer` over backend:
  only Django-admin thumbnail helpers and test fixture names).

## 4. Homepage Architecture

`build_homepage_payload(language)` lives in
`apps/homepage/api/v1/serializers/homepage.py:74` (not in `services.py`,
which holds only `load()` + `ensure_default_sections()`). It filters per §3
inside the composer and serializes through the existing list serializers, so
no price/slug/visibility rule is duplicated. Views:
`HomepagePublicView` (`AllowAny`, `views/homepage.py:16-32`) and
`HomepageAdminView` (`IsContentManager`, `:35-58`). Mounts:
`homepage/` (public) + `admin/homepage/` (admin) in `config/api_v1.py:33,49`.
The composer was **tightly coupled to public filtering with no preview
branch** — hence the additive `preview=False` parameter (§12) rather than a
second composer.

## 5. Product Architecture

Public list/detail/featured/slug-resolve views all gate through
`public_product_qs()` or `is_active=True`; admin list/detail views use
`[IsAuthenticated, IsContentManager]` over **unfiltered** querysets
(`views/products.py:187-243`). Detail shapes: public
`ProductDetailSerializer` (effective-price only) vs admin
`AdminProductDetailSerializer` (raw price inputs). Preview reuses the
**public** detail serializer over the unfiltered queryset, so rendering
matches public exactly while exposing saved-but-unpublished rows.

## 6. Category Architecture

Same pattern: public `CategoryTreeSerializer`/`CategorySerializer` over
`is_active=True`; admin views unfiltered. Preview reuses the public
`CategorySerializer` over the unfiltered queryset (inactive categories
visible in preview only).

## 7. Service/Project/Article Architecture

Services/projects/articles have **no dedicated preview endpoints** in this
slice: their homepage presence is already previewable through the homepage
preview (which bypasses their composer filters), and their standalone public
endpoints are either unfiltered already (services/projects list) or
published-gated (articles). Standalone tokenized detail preview for these
three types is investigated but **deferred** (§28) — the token `typ` namespace
reserves them (`product|category` today) without pretending they exist.

## 8. Authentication/Permission Review

Backend-authoritative `IsContentManager` = super_admin / website_admin /
content_manager (`apps/users/api/v1/permissions.py:23-33`); JWT
(`JWTAuthentication`, access 15 min) in `config/settings/base.py:130-168`.
No new role was created; the issue endpoint reuses `IsContentManager`
(live behavior: anonymous 401/403, customer/engineer 403 — same envelope as
the Studio API). Frontend `canManageHomepage` remains button-gating only.

## 9. Existing Token Utilities

**None existed.** `password_reset_request` is a stub (validates email,
logs activity, returns a generic message — no token generated, no email
sent); `PasswordResetConfirmSerializer` has no consuming view. The only token
infrastructure is SimpleJWT. Reusing SimpleJWT access tokens as preview
credentials was rejected (15-min bearer for full API access is the wrong
scope and would require the preview tab to carry the manager's credentials).

## 10. Preview Requirements

Preview must show saved-but-hidden content (B) to an authorized caller
without weakening any public filter, without a new CMS architecture, and
without new cryptography — with a token that is signed, short-lived (600 s),
purpose-bound (`pur=preview`), resource-bound (`typ` + `id`), and
locale-bound (`loc`), carrying no content (reference only).

## 11. Architecture Alternatives Considered

1. **Generic Draft model / versioning / staging tables** — rejected: would
   create a second CMS architecture over six entity-specific publication
   semantics; disproportionate to the need (all hidden content already exists
   as saved rows).
2. **`?preview_token=` on normal public routes** — rejected: filter-bypass
   leakage risk by construction; regression tests now prove public routes
   ignore tokens.
3. **Reusing JWT as the preview credential** — rejected (§9): wrong scope,
   requires auth in a fresh tab.
4. **New cryptography / new dependency** — rejected: `django.core.signing`
   (timestamped, `SECRET_KEY`-backed) already provides exactly the needed
   primitive.
5. **Duplicating homepage/product rendering for preview** — rejected:
   `HomepageClient` gained an optional `previewPayload` prop; product preview
   reuses the public detail serializer.

## 12. Selected Architecture

Stateless signed-token preview (option B):

- `POST /api/v1/admin/homepage/preview-tokens/` (`IsContentManager`) issues
  `signing.dumps({typ,id,loc,pur}, salt="abrenergy-preview-v1")`, 600 s.
- `GET /api/v1/admin/homepage/preview/?token=...` (`AllowAny` + token
  verify) renders `build_homepage_payload(lang, preview=True)`, `no-store`.
- `GET /api/v1/admin/products/<uuid:pk>/preview/?token=...` and
  `GET /api/v1/admin/product-categories/<uuid:pk>/preview/?token=...`
  (same token model, public serializers, `no-store`, `preview: True` marker).
- Frontend `/:locale/preview/homepage?token=...` (dynamic, `noindex`,
  PREVIEW banner, back-to-Studio link) renders `<HomepageClient
  previewPayload={data}/>`; Studio Preview button issues a token and opens
  the route in a new tab. Product/category preview **rendering** is deferred
  to 8.2 (API ready); the Studio button covers the homepage (the singleton
  with the most hidden-state surface).

## 13. Why Selected Architecture Is Safe

- Public code paths keep default `preview=False` (branch is opt-in at the
  call site; `HomepagePublicView` never reads a token — proven byte-identical
  payload live, §26).
- No public filter line was edited in place; preview alternatives sit in
  `if preview:` branches.
- No permission weakened (issue = `IsContentManager`; consume = token that
  only an `IsContentManager` can mint).
- No migration, no dependency, no new role, no new crypto.
- Product/category preview serializes with **public** serializers (no admin
  price internals leak beyond what public detail already exposes).

## 14. Token Design

`apps/homepage/preview_tokens.py` (new, 100 lines): single
`salt="abrenergy-preview-v1"`, payload `{typ, id, loc, pur="preview"}`,
`max_age=600`. `issue_preview_token()` validates
`typ ∈ {homepage,product,category}`, `loc ∈ {fa,ar,en}` (product/category
require non-empty `id`). `verify_preview_token()` maps expiry/tampering to
`PreviewTokenError` and enforces exact binding on `typ`/`id`/`loc`/`pur`
with generic error messages (no existence oracle).

## 15. Token Security

1. Issue: `IsContentManager` JWT only. 2. Consume: bearer of a valid
   unexpired token (anonymous + token → 200 preview). 3. Cross-resource: no
   (`typ`+`id` binding, tested). 4. Cross-locale: no (`loc` binding, tested;
   homepage preview renders in the token locale). 5. Post-expiry reuse: no
   (`TimestampSigner`, tested at unit level with `max_age=-1`). 6./7.
   Anonymous consumption: yes — acceptable by design (short-lived,
   single-resource, reference-only token; reveals only saved CMS rows, no
   auth escalation). 8. Token itself grants access (fresh-tab friendly; no
   cookies/auth needed). 9. Leak blast radius: one resource + locale, ≤10
   min, no content embedded; no revocation (stateless — documented in §27).
   10. Expiry: 600 s.

## 16. Preview API Contract

Issue: `POST /api/v1/admin/homepage/preview-tokens/` · auth JWT
`IsContentManager` · body `{resource_type, resource_id?, locale?}` →
`200 {token, resource_type, resource_id, locale, expires_in: 600}`.
Errors: 401 anonymous; 403 customer/engineer; 400 unknown
type/locale or missing `resource_id` for product/category.

Consume (all `AllowAny` + `?token=`, `Cache-Control: no-store`,
`{..., preview: True}` on success):
`GET /api/v1/admin/homepage/preview/?token=...` (locale from token);
`GET /api/v1/admin/products/<uuid:pk>/preview/?token=...`;
`GET /api/v1/admin/product-categories/<uuid:pk>/preview/?token=...`.
Errors: 403 missing/invalid/expired/tampered/bound-to-other-resource
(generic message, no existence leak); 404 valid token + unknown id.

## 17. Preview Frontend Route

`src/app/[locale]/preview/homepage/page.tsx` (dynamic, `metadata.robots =
{index:false, follow:false}`) + `preview-body.tsx` (client): reads
`?token=`, fetches via `useHomepagePreview` (`staleTime 0`, `gcTime 0`,
no retry), shows a sticky PREVIEW banner + back-to-Studio link, `ErrorState`
for missing/invalid tokens, otherwise `<HomepageClient
previewPayload={data}/>`. Helpers in `src/lib/preview.ts`
(`buildHomepagePreviewUrl`, `isPreviewUrl`, `PREVIEW_PATH_SEGMENT`).

## 18. Preview Rendering Reuse

Homepage preview reuses `HomepageClient` + all eight sections + `Hero3D` +
overlay/animation stack with **zero duplicated design** (one additive
optional prop; default behavior unchanged). Product/category preview reuses
public serializers server-side; client-side catalog-component reuse for those
two types is deferred to 8.2 (§28).

## 19. Public Route Isolation

- `HomepagePublicView` never reads `token` (no signature change).
- Live: `GET /api/v1/homepage/` returns exactly the 11 pre-8.1 keys (no
  `preview` marker); `?token=<valid>` on the public homepage, product list,
  and product detail leaves behavior unchanged (detail of a draft stays 404).
- Automated: `test_public_homepage_ignores_preview_token`,
  `test_public_product_routes_ignore_preview_token` (both green).

## 20. Security Test Matrix

Backend (`test_phase81_preview.py`, 20 tests, all green): anonymous issue
401/403 · customer 403 · engineer 403 · content_manager/super_admin/
website_admin success · unknown-type/locale + missing-id 400 · valid
homepage token shows draft/hidden/disabled/inactive rows with `preview: True`
+ `no-store` · missing/tampered/wrong-resource/wrong-purpose token 403 ·
expiry + wrong-locale binding rejected (unit level) · draft product preview
200 + public detail still 404 · wrong-id 403 · unknown-id 404 · inactive
category preview 200 + public 404. Frontend (`preview.test.ts`, 6 tests):
URL isolation/encoding, locale-key parity fa/ar/en, preview fetch hits the
isolated endpoint with `?token=`, issue hits the admin-only endpoint.

## 21. SEO/Robots/Sitemap

Preview route: `noindex, nofollow` metadata (verified in served HTML),
dynamic (never prerendered), absent from the static sitemap (sitemap 200,
zero `preview` hits), robots file untouched (200). Normal metadata pipeline
(`buildHomepageMetadata`, CMS-first + Persian fallback) untouched.

## 22. Database Changes

**None.** `makemigrations --check`: No changes detected. No seed, flush,
reset, or content edit (verification used transient pytest rows +
read-only live GETs; ~30 pytest media byproducts deleted afterwards).
Had a migration appeared necessary, the phase rule was to STOP — it was not.

## 23. Dependency Changes

**None.** `package.json` / `package-lock.json` byte-identical (not in
`git status`). No Next/React/Three/R3F/Drei change; signing uses the
framework standard library.

## 24. Files Changed

Backend new: `apps/homepage/preview_tokens.py`,
`apps/homepage/tests/test_phase81_preview.py`. Backend edited:
`apps/homepage/api/v1/serializers/homepage.py` (additive `preview=False`
branches + preview-only `preview: True` marker; public path byte-identical),
`apps/homepage/api/v1/views/homepage.py` (+ issue/preview views),
`apps/homepage/api/v1/urls/admin_urls.py` (+ 2 paths),
`apps/products/api/v1/views/products.py` (+ 2 preview views),
`apps/products/api/v1/urls/admin_urls.py` +
`apps/products/api/v1/urls/admin_category_urls.py` (+ 1 preview path each).
Frontend new: `app/[locale]/preview/homepage/page.tsx` + `preview-body.tsx`,
`src/lib/preview.ts`, `src/lib/preview.test.ts`. Frontend edited:
`src/api/index.ts` (+ `previewApi`), `src/hooks/use-api.ts` (+
`useHomepagePreview`), `app/[locale]/(public)/homepage-client.tsx`
(+ optional `previewPayload`), `admin/content/homepage/page.tsx` (Preview
button issues token + opens preview URL), `src/types/index.ts` (+ preview
types), `locales/{fa,en,ar}.json` (+ `homepage_preview_failed`),
`src/lib/homepage-locale.test.ts` (+ key in contract list). Pre-existing
Phase 7.5 modifications (4 files) left intact.

## 25. Automated Tests

Backend `pytest apps/`: **163 passed** (143 baseline intact + 20 new).
Frontend `vitest run`: **180 passed / 26 files** (174/25 intact + 6 new).
`tsc --noEmit`: 0 errors. `npm run lint`: 0 errors / 55 warnings (count
identical to baseline; zero warnings in 8.1 files). No test weakened,
skipped, or re-counted.

## 26. Runtime Verification

Canonical workflow followed (port 3000 verified free before build; no dev
live during build). `npm run build`: success (route table includes
`/[locale]/preview/homepage`, 1.5 kB, dynamic). Prod `next start -p 3100`:
`/fa` **200** (75,479 bytes — byte-identical to the 7.6 baseline),
exactly one `<h1`, RTL, slogan present; `/fa/preview/homepage` **200**
(PREVIEW banner + `noindex` + missing-token UI); `/sitemap.xml` 200 with no
preview entry; `/robots.txt` 200; live `GET /api/v1/homepage/` 200 with
exactly the 11 pre-8.1 keys; public + garbage token → 200 (ignored);
preview + bad token → 403. Prod stopped, ONLY `.next` deleted, dev
restarted: dev `/fa` **200** (one h1, RTL), dev `/fa/preview/homepage`
**200** (banner). Client-side WebGL/interaction: NOT TESTED (no browser
automation — same standing as 7.5/7.6; no rendering claim made).

## 27. Known Limitations

1. No token revocation (stateless design; 10-min expiry is the mitigation).
2. Preview shows saved state only — unsaved Studio edits are NOT previewed
   (by design; the button previews post-save state).
3. Product/category preview rendering UI deferred to 8.2 (APIs ready and
   tested).
4. Homepage preview fill for articles uses latest rows of any status (drafts
   may appear in article slots in preview only — intended).
5. No browser/AT walkthrough of the preview banner (NOT TESTED).

## 28. Deferred Architecture

- **True unsaved-draft preview (option A)** requiring draft persistence /
  revisions / staging tables / version IDs: deferred because the CMS has no
  draft layer and every hidden item already exists as a saved row — building
  versioning would be a second CMS for no proven need.
- Standalone service/project/article tokenized detail preview: deferred
  (homepage-surface coverage suffices for 8.1).
- Token revocation list, per-field preview scopes, scheduled publishing:
  deferred (no requirement evidence in 8.1).

## 29. Final Decision

**Phase 8.1 COMPLETE (minimal safe slice).** Preview semantics are defined
(saved-but-hidden), the security model is documented and tested, public
routes are regression-proven byte-equivalent, and the smallest additive
implementation (tokens + 3 preview endpoints + 1 preview route + Studio
button) is done. Proceed to Phase 8.2+ only for the deferred UI items above.

## 30. STOP Condition

STOP. No 8.3 dirty guard, no 8.4 read-only UX, no 8.5 error mapping, no 8.6
picker debounce, no Phase 9 work was started. End state: `next dev` on :3000
(verified `/fa` 200), Django :8000 untouched, :3100 free. Next session must
stop dev before any `npm run build` (shared-`.next` hazard, §7.6).
