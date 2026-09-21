# Phase 1 — Stabilization Report

Date: 2026-09-18. Scope: reliability/safety fixes only. No CMS, no products, no redesign, no new framework.

## 1. Executive Summary

All 12 Phase 0 issues fixed and verified. Auth refresh works (was wired to login view). Translated search works on articles/services/projects with no `FieldError`. Translation N+1 fixed via `prefetch_related` + prefetch-aware `get_translation()`. Media upload locked to content roles with MIME/extension/size/Pillow validation, SVG blocked. Rich text sanitized server-side (bleach) and client-side (DOMPurify). CORS and DB are environment-driven; PostgreSQL is default, SQLite explicit opt-in. Docker compose paths fixed, broken beat scheduler reference removed. Inquiry completion and role-escalation bugs fixed. Backend 34/34 tests pass; frontend typecheck/lint/build pass. UI untouched.

## 2. Phase 0 Issues Reviewed

| # | Issue | Original location | Verification | Fix | Files changed | Tests | Status |
|---|-------|-------------------|--------------|-----|---------------|-------|--------|
| 1 | refresh wired to login view | `apps/users/api/v1/urls/auth_urls.py:10` | Confirmed | `TokenRefreshView` | auth_urls.py | test_auth_phase1 (refresh, invalid, expired-access) | FIXED |
| 2 | `search_fields` on non-existent `title` | articles/services/projects views | Confirmed (`Article` has no `title`) | `translations__title` (+related fields), `distinct()` | 3 views | search tests x3 | FIXED |
| 3 | Translation N+1 | article/service/project serializers `get_translation()` | Confirmed (no prefetch) | `prefetch_related("translations")` on all list/detail/featured/by-type/category/tag/gallery querysets; `get_translation()` reads prefetch cache; project cover-image uses prefetched images | 4 views + 4 models + project serializer | query-count test | FIXED |
| 4 | Open media upload, ext-only validation, SVG allowed | media_manager views/models, upload perm `IsAuthenticated` | Confirmed | Perm `IsContentManager`; allowlist jpg/jpeg/png/webp; MIME check; Pillow verify; 10 MB cap; `file_type` image-only | model, serializer, views | 6 media tests | FIXED |
| 5 | Raw `dangerouslySetInnerHTML` | articles/services/projects `[slug]` pages | Confirmed (3 pages) | Backend bleach on save + frontend DOMPurify `sanitizeHtml()` | 3 translation models, sanitizer.py, 3 pages, lib/sanitize.ts | sanitizer test + payload checks | FIXED |
| 6a | CORS hardcoded | `settings/base.py:176` | Confirmed (env in `.env.example` ignored) | `CORS_ALLOWED_ORIGINS` + `CSRF_TRUSTED_ORIGINS` from env via `Csv()` | base.py, .env.example | config test | FIXED |
| 6b | DB hardcoded SQLite | `base.py:94`, `local.py:6` | Confirmed (PG block commented out) | Env-driven: PG default, `DB_ENGINE=sqlite` explicit fallback; `local.py` no longer overrides | base.py, local.py, .env.example | config test | FIXED |
| 7 | `is_temp` orphans | media views cleanup deletes unconditionally, flag never set | Confirmed | Cleanup only `is_temp + older than 7 days`, capped batch, returns ids; no aggressive deletion | media views | threshold test | FIXED (minimal) |
| 8 | `mark_completed` invalid status | `apps/contacts/admin.py:44` | Confirmed (`completed` not in choices) | `accepted` (valid terminal status) | admin.py | admin-action test | FIXED |
| 9 | Compose `env_file`/`context` wrong | both compose files (`../.env`, `context: ..`) | Confirmed (files live in `AbrEnergy/`) | `.env`, `context: .` | both compose files | static review | FIXED |
| 10 | Beat uses uninstalled `django_celery_beat` scheduler | `docker-compose.prod.yml:98` | Confirmed (package absent) | Default scheduler; beat service kept, no misleading ref | prod compose | static review | FIXED |
| 11 | `db.sqlite3` committed | repo root of backend | NOT confirmed: file exists locally but is untracked and gitignored (`*.sqlite3`) | No action needed | — | — | N/A (already clean) |
| 12 | `UserSerializer.role` writable | `serializers/user.py:13` | Confirmed | `role` + `is_active` read-only | user.py | escalation tests | FIXED |

Adjacent bugs found and fixed: detail views looked up slug on parent models (which have no slug) — added `TranslatedSlugDetailMixin` (translation-slug lookup, pk passthrough for admin); `GalleryCategorySerializer` exposed non-existent `title/slug/description` — now translation-backed; login crashed with `KeyError` on missing email — guarded; dropped `DjangoFilterBackend` restored on service/project lists; `UserCreateSerializer` is dead code (unused anywhere), left untouched.

## 3. Authentication

Refresh now `TokenRefreshView`: accepts `{refresh}`, returns `{access}` plus rotated `refresh` (rotation + blacklist unchanged). Login response shape unchanged (`{access, refresh}` + `user`). Frontend already sent correct `{refresh}` key; only fix needed was locale-preserving logout redirect (`/{locale}/login`). Retry-once + queue behavior verified by code review (unchanged logic); no frontend test infra exists to automate it. Tests: login, refresh, invalid refresh (400/401), expired-access-then-refresh, logout path untouched.

## 4. Database

`DB_ENGINE` (default `postgresql`) selects backend. PG uses existing `DB_NAME/USER/PASSWORD/HOST/PORT` vars; `DB_ENGINE=sqlite` gives explicit SQLite (path via `DB_NAME`). No silent fallback — a failed PG connection raises. Docker sets `DB_HOST=db`/`DB_PORT=5432`; compose now points at the correct `.env`. `test.py` unchanged (isolated PG). Verification: `check` clean, `makemigrations --check` clean (after new migration), `migrate` OK on temp SQLite. Live PG NOT verified: local PG requires unknown password; ephemeral PG 16 instance could not start in sandbox (`0xC0000142`); no Docker daemon. PG connectivity with real credentials remains operator-verified at deploy.

## 5. Search

Articles: `translations__title/short_description/content`. Services: `translations__title/short_description`. Projects: `translations__title/location`. All list views add `distinct()` for join duplicates. Pagination/ordering preserved (article bogus `title` ordering removed). Gallery by-category now filters `category__translations__slug`. Public detail pages resolve by translation slug; admin pk routes unaffected.

## 6. Query Optimization

Before: every serialized object issued 2+ translation queries per field (~200 queries per 20-item list). After: `prefetch_related("translations")` on article list/detail/category/tag, service list/detail, project list/detail/featured/by-type, gallery image/category querysets; `select_related` kept for FKs (`author/category/cover_image/image/service_category/media_file`); `get_translation()` serves from prefetch cache. Project cover-image no longer queries per object. Article-list query-count regression test caps queries well below old behavior.

## 7. Media Security

Upload requires `IsContentManager` (super/website/content); list/delete/cleanup stay `IsAdminUser`. Allowed: jpg/jpeg/png/webp, MIME `image/jpeg/png/webp`, Pillow-verified, max 10 MB. Blocked: svg, gif, bmp, pdf/doc/xls/ppt, mp4/avi/mov/mkv, zip/rar/txt, MIME mismatches, corrupt images. Frontend dropzone `accept` narrowed to match; backend enforces. Temp: only `is_temp=True` older than 7 days eligible, 100-row batches, ids returned, permanent/referenced media untouched. Uncertainty (when `is_temp` should be set, attachment lifecycle) documented, not automated.

## 8. Rich Text Security

Backend `apps/core/sanitizer.py` (bleach 6.x, new dep): tags `p br strong em ul ol li h1-h4 a table thead tbody tr th td img blockquote code pre hr u s`; attrs `a[href title target rel]`, `img[src alt title width height]`, `th/td[colspan rowspan]`; protocols http/https/mailto; `strip=True`. Applied in `ArticleTranslation.content`, `ServiceTranslation.description`, `ProjectTranslation.description` on save. Frontend `src/lib/sanitize.ts` (DOMPurify, new dep) wraps all three `dangerouslySetInnerHTML` uses (+`id` allowed so article TOC anchors keep working). Blocks `script/iframe/object/embed`, `javascript:`, event handlers, dangerous data URLs. TipTap untouched.

## 9. CORS

Old: hardcoded `localhost:3000/3001` in `base.py`, `.env.example` value ignored. New: `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` read from env (CSV), same localhost defaults. Credentials still allowed; no wildcard. Prod sets real origins via env.

## 10. Celery / Redis

`config/__init__.py` now imports the Celery app (was missing, broke `manage.py` without installed celery). Worker config unchanged (Redis broker). Beat: removed invalid `DatabaseScheduler` reference (package not installed, no schedules defined); beat service retained with default scheduler. No new jobs. Redis unavailable locally (nothing to verify against); config unchanged and coherent.

## 11. Authorization

`PATCH /users/me/` cannot change `role`/`is_active` (read-only; silently ignored, response still includes role). Role changes only via `PATCH /admin/users/<id>/change-role/` (`IsSuperAdmin`). Tests: self-promotion blocked, admin change works. No new roles.

## 12. Project Inquiry

`mark_completed` set nonexistent `completed`; now sets `accepted` (closest valid terminal status). API serializers already treat `status` as read-only for non-admin paths. Admin action covered by test.

## 13. Frontend Stability

Axios: payload correct, single-refresh queue intact, locale-preserving login redirect. AuthStore untouched. Next.js: only `images.remotePatterns` for `/media/**` on localhost/127.0.0.1:8000 added (narrow, no wildcard). No Server-Component migration, no dynamic imports (Hero3D/TipTap/Recharts load as before — verified in build output), no font migration (Google `@import` kept; `next/font` deferred — visual-risk decision, see §20).

## 14. Tests

Backend (temp SQLite settings, PG creds unavailable): `python -m pytest apps/ -o DJANGO_SETTINGS_MODULE=config.settings.phase1_tmp_sqlite` → **34 passed** (6 auth, 6 content/search/sanitize, 10 media/inquiry/config, 3 fixed article models, 4 user models, 5 calculator). New files: `test_auth_phase1.py`, `articles/test_phase1.py`, `media_manager/test_phase1.py`; fixed stale `articles/test_models.py` (used non-existent fields). Frontend: no test infra exists; verified `tsc --noEmit` exit 0, `npm run lint` 0 errors (61 pre-existing warnings), `npm run build` success (all routes render).

## 15. Files Changed

Backend: `auth_urls.py`, `views/auth.py`, `serializers/user.py`, `articles/views/article.py`, `articles/models.py`, `articles/translation_models.py`, `services/views/service.py`, `services/models.py`, `services/translation_models.py`, `projects/views/project.py`, `projects/serializers/project.py`, `projects/models.py`, `projects/translation_models.py`, `gallery/views/gallery.py`, `gallery/serializers/gallery.py`, `gallery/models.py`, `media_manager/models.py`, `media_manager/serializers/media.py`, `media_manager/views/media.py`, `contacts/admin.py`, `config/__init__.py`, `settings/base.py`, `settings/local.py`, `requirements/base.txt`, `docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`. New: `core/sanitizer.py`, `core/mixins.py`, 3 test files, `media_manager/migrations/0003_*`, `media_manager/tests/`. Fixed: `articles/tests/test_models.py`. Frontend: `axios.ts`, `next.config.ts`, `package.json` (+lock), 3 `[slug]` pages, `media-upload.tsx`. New: `lib/sanitize.ts`.

## 16. Database / Migration Changes

One migration: `media_manager/0003_alter_mediafile_file_alter_mediafile_file_type` (validator allowlist + image-only choices). No data migration — pre-existing non-image rows keep values; enforcement is at API/validator level.

## 17. Security Improvements

Refresh fixed; upload locked + validated; SVG/executables blocked; XSS sanitized both ends; role escalation closed; login KeyError closed; CORS/CSRF env-driven; no secrets committed.

## 18. Performance Improvements

Translation N+1 eliminated on all content endpoints; project cover-image prefetch; detail slug lookup is single filtered query. Fonts/images/dynamic-imports deferred (no safe win without visual risk).

## 19. Remaining Technical Debt

Local PG password unknown (deploy must supply); Redis unverified locally; `UserCreateSerializer` dead code; `LargePagination` unused; ckeditor4 EOL warning (unused by live models); `static/` dir missing warning; gallery admin page may expect categories endpoint (pre-existing); article TOC regex runs on sanitized HTML (safe).

## 20. Deferred Work

Per brief: all Product/Homepage-CMS models and UI, carousel, downloads, calculator modes, SEO rendering, `next/font`, `next/image` migration, `httpOnly` cookies, CI, S3, approval workflow, granular roles. Explicitly NOT done.

## 21. Phase 2 Readiness

Yes. API is stable (auth, search, translations, upload perms), config is env-driven, regression suite exists (34 green), UI untouched. Phase 2 can build products/homepage CMS on this base.

## 22. Known Limitations

PG/Redis live connections not verified in this environment (creds/infra absent); compose file syntax not daemon-validated; frontend refresh-queue covered by review, not automated tests.

## 23. Recommended Phase 2 Scope

`products` + `homepage` apps reusing translation/image patterns, React admin CRUD, public catalog routes, narrow `next/image` + `dynamic()` adoption, dynamic sitemap/metadata, then hardening/CI.
