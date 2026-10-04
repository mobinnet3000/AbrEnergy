"""Phase 9.4 — server-side Product / ProductCategory duplication.

Small, testable service-level copy functions. Duplication is a server-side
copy operation, NOT an editor update round-trip, so it deliberately does NOT
route through ``ProductWriteSerializer`` / ``CategoryWriteSerializer``.
It uses the ORM models directly so that the existing ``save()`` behaviors
(slug-history no-ops for brand-new rows, HTML sanitization, cover demotion)
run unmodified.

Approved semantics (authoritative matrix: the Phase 9.4 brief):
- Product: new UUID, SKU ``<SKU>-COPY[-N]`` (server-generated), status
  ``draft``, visibility ``hidden``, ``is_active=False``,
  ``is_featured=False``, ``published_at=NULL``, ``canonical_url=""``,
  same category, copied sort_order/SEO-advisory fields, same MediaFile
  references (no physical file copy), deep-copied translations (every
  existing locale row, suffixed titles, regenerated slugs), images,
  documents, attribute values (same definitions), specifications, price.
  Outgoing ``RelatedProduct`` rows omitted, incoming untouched, no
  auto-link, no homepage row, zero ``SlugHistory`` rows.
- Category: node-only duplicate under the SAME parent, ``is_active=False``,
  ``is_featured=False``, copied sort_order, same cover/og_image references,
  copied SEO-advisory fields, ``canonical_url=""``, deep-copied
  translations, regenerated model slug (``<slug>-copy[-N]``), zero
  ``SlugHistory`` rows, no homepage row, products/children/definitions
  untouched.

Concurrency (PostgreSQL, the project's actual database):
- ``Product.sku`` is globally unique with a DB constraint: bounded
  candidate walk + existence checks, with the constraint as backstop
  (``IntegrityError`` inside a savepoint retries to the next candidate).
- ``ProductTranslation.slug`` has NO uniqueness constraint, so there is no
  backstop for silent cross-product slug collisions. Two duplicates of the
  SAME source are serialized by ``select_for_update()`` on the source row,
  but two duplicates of DIFFERENT sources that already share a slug string
  would not be. Therefore every product duplication first takes a
  transaction-scoped PostgreSQL advisory lock
  (``pg_advisory_xact_lock`` on a fixed domain key) so that the
  check-then-insert walk is atomic with respect to other duplications.
  The lock is transaction-scoped (released on commit/rollback), isolated
  to this module (no generic locking framework), and skipped on
  non-PostgreSQL backends (where ``select_for_update`` + bounded walk
  still applies; the test settings use PostgreSQL).
- ``ProductCategory.slug`` is globally unique: bounded walk + existence
  checks with the DB constraint as backstop (same savepoint-retry shape
  as SKU).
- All walks are bounded (``MAX_*_ATTEMPTS``). Exhaustion returns a
  ``DuplicationError`` mapped to 400/409 — never 500, never unbounded.
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, connection, transaction
from django.utils.text import slugify

from apps.products.models import (
    Product,
    ProductAttributeValue,
    ProductCategory,
    ProductDocument,
    ProductImage,
    ProductPrice,
    ProductSpecification,
)
from apps.products.translation_models import (
    ProductCategoryTranslation,
    ProductTranslation,
)

# Bounded candidate walks. No sequences, counters, generators, or migrations.
MAX_SKU_ATTEMPTS = 100
MAX_SLUG_ATTEMPTS = 50

# Fixed domain keys for the transaction-scoped advisory locks. One lock per
# domain serializes ALL duplications in that domain (not just same-source
# ones), which is exactly what the unconstrained translation-slug walk
# needs. Released automatically at transaction end (xact scope).
_LOCK_PRODUCT = "abrenergy:duplicate:product"
_LOCK_CATEGORY = "abrenergy:duplicate:product-category"


class DuplicationError(Exception):
    """Service-level failure mapped by the views to the API error envelope.

    ``errors`` mirrors the DRF ``{status, errors}`` envelope shape used by
    ``custom_exception_handler`` (field map or ``{"detail": ...}``).
    """

    def __init__(self, errors, status_code=400):
        super().__init__(str(errors))
        self.errors = errors
        self.status_code = status_code


def _acquire_domain_lock(key):
    """Take the transaction-scoped advisory lock (PostgreSQL only).

    Must be called inside ``transaction.atomic()``. On PostgreSQL this
    serializes concurrent duplications in the same domain so that the
    existence-check walks below cannot interleave. On other backends it is
    a no-op (the bounded walk + ``select_for_update`` still applies).
    """
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", [key])


def copy_title(title, language):
    """Locale-appropriate copy suffix for a duplicated translation title."""
    title = title or ""
    if language == "fa":
        return "\u00ab%s (\u06a9\u067e\u06cc)\u00bb" % title
    if language == "ar":
        return "%s (\u0646\u0633\u062e\u0629)" % title
    return "%s (copy)" % title


def _fit(text, max_len):
    if len(text) <= max_len:
        return text
    return text[:max_len]


def _sku_candidate(sku, n):
    """n=1 -> ``<SKU>-COPY``; n>=2 -> ``<SKU>-COPY-<n>`` (max 64 chars)."""
    suffix = "-COPY" if n == 1 else "-COPY-%d" % n
    return "%s%s" % (_fit(sku, 64 - len(suffix)), suffix)


def _slug_candidate(base, n, max_len):
    """n=1 -> ``<base>-copy``; n>=2 -> ``<base>-copy-<n>``."""
    suffix = "-copy" if n == 1 else "-copy-%d" % n
    return "%s%s" % (_fit(base, max_len - len(suffix)), suffix)


def _pick_free_sku(source_sku):
    """First SKU candidate not present in the DB (existence walk)."""
    for n in range(1, MAX_SKU_ATTEMPTS + 1):
        candidate = _sku_candidate(source_sku, n)
        if not Product.objects.filter(sku=candidate).exists():
            return candidate, n
    raise DuplicationError(
        {"sku": ["Could not generate a unique SKU for the duplicate."]},
        status_code=409,
    )


def _next_free_sku(source_sku, tried):
    """Next free SKU candidate strictly after the ``tried`` set."""
    for n in range(1, MAX_SKU_ATTEMPTS + 1):
        candidate = _sku_candidate(source_sku, n)
        if candidate in tried:
            continue
        if not Product.objects.filter(sku=candidate).exists():
            return candidate
    raise DuplicationError(
        {"sku": ["Could not generate a unique SKU for the duplicate."]},
        status_code=409,
    )


def _pick_free_product_slug(source_slug, suffixed_title, language):
    """Per-locale translation-slug walk (same language, other products).

    Non-empty source: ``<slug>-copy[-N]``. Empty source: slugify the
    suffixed duplicate title first (existing save-based generation
    behavior), then collision-handle (``<gen>``, ``<gen>-2``, ... — the
    generated value already carries the copy marker from the title).
    Never reuses the original slug.
    """
    if source_slug:
        for n in range(1, MAX_SLUG_ATTEMPTS + 1):
            candidate = _slug_candidate(source_slug, n, 500)
            if candidate == source_slug:
                continue
            if not ProductTranslation.objects.filter(
                language=language, slug=candidate
            ).exists():
                return candidate
    else:
        generated = slugify(suffixed_title, allow_unicode=True) or "copy"
        generated = _fit(generated, 500)
        if not ProductTranslation.objects.filter(
            language=language, slug=generated
        ).exists():
            return generated
        for n in range(2, MAX_SLUG_ATTEMPTS + 1):
            suffix = "-%d" % n
            candidate = "%s%s" % (_fit(generated, 500 - len(suffix)), suffix)
            if not ProductTranslation.objects.filter(
                language=language, slug=candidate
            ).exists():
                return candidate
    raise DuplicationError(
        {"slug": ["Could not generate a unique slug for the duplicate."]},
        status_code=409,
    )


def _pick_free_category_slug(source_slug):
    for n in range(1, MAX_SLUG_ATTEMPTS + 1):
        candidate = _slug_candidate(source_slug, n, 255)
        if not ProductCategory.objects.filter(slug=candidate).exists():
            return candidate, n
    raise DuplicationError(
        {"slug": ["Could not generate a unique slug for the duplicate."]},
        status_code=409,
    )


def _next_free_category_slug(source_slug, tried):
    for n in range(1, MAX_SLUG_ATTEMPTS + 1):
        candidate = _slug_candidate(source_slug, n, 255)
        if candidate in tried:
            continue
        if not ProductCategory.objects.filter(slug=candidate).exists():
            return candidate
    raise DuplicationError(
        {"slug": ["Could not generate a unique slug for the duplicate."]},
        status_code=409,
    )


def _pick_free_category_translation_slug(source_slug, suffixed_title, language):
    """Same copy-family treatment for category translation slugs.

    Preserves category translation semantics: empty stays empty at pick
    time (``save()`` auto-generates from the suffixed title); non-empty
    gets the ``-copy`` family with a per-language existence check.
    """
    if not source_slug:
        return ""
    for n in range(1, MAX_SLUG_ATTEMPTS + 1):
        candidate = _slug_candidate(source_slug, n, 500)
        if not ProductCategoryTranslation.objects.filter(
            language=language, slug=candidate
        ).exists():
            return candidate
    raise DuplicationError(
        {"slug": ["Could not generate a unique slug for the duplicate."]},
        status_code=409,
    )


def _save_row(obj, key):
    """Validate + save one nested/owned row; map failures to 400 (no 500)."""
    try:
        obj.full_clean()
    except DjangoValidationError as exc:
        messages = getattr(exc, "messages", None) or [str(exc)]
        raise DuplicationError({key: list(messages)}, status_code=400)
    try:
        obj.save()
    except IntegrityError as exc:
        raise DuplicationError({key: [str(exc)]}, status_code=400)
    return obj


def _save_translation_row(obj):
    """Save a translation row exactly like the existing write serializers.

    ``ProductWriteSerializer`` / ``CategoryWriteSerializer`` persist
    translations via ``objects.create`` (no ``full_clean``); the model
    ``save()`` itself performs HTML sanitization, slug auto-generation,
    and the slug-history no-op for brand-new rows. Duplication mirrors
    that behavior verbatim so faithfully-copied source data is never
    rejected by validation the editor path never applies.
    """
    obj.save()
    return obj


def _load_product_source(source_id):
    try:
        return (
            Product.objects.select_for_update()
            .prefetch_related(
                "translations",
                "images",
                "documents",
                "specifications",
                "attribute_values__definition",
            )
            .get(pk=source_id)
        )
    except (Product.DoesNotExist, DjangoValidationError, ValueError):
        raise DuplicationError({"detail": "Not found."}, status_code=404)


def _load_category_source(source_id):
    try:
        return (
            ProductCategory.objects.select_for_update()
            .prefetch_related("translations")
            .get(pk=source_id)
        )
    except (ProductCategory.DoesNotExist, DjangoValidationError, ValueError):
        raise DuplicationError({"detail": "Not found."}, status_code=404)


def duplicate_product(source_id):
    """Deep-copy a Product + all owned rows atomically. Returns the new Product."""
    with transaction.atomic():
        _acquire_domain_lock(_LOCK_PRODUCT)
        source = _load_product_source(source_id)

        source_translations = list(source.translations.all())
        source_images = list(source.images.all())
        source_documents = list(source.documents.all())
        source_specs = list(source.specifications.all())
        source_values = list(source.attribute_values.all())
        try:
            source_price = source.price
        except ProductPrice.DoesNotExist:
            source_price = None

        # --- Main row: bounded SKU walk + savepoint retry on the DB backstop.
        tried_skus = set()
        candidate, _ = _pick_free_sku(source.sku)
        product = None
        for _ in range(MAX_SKU_ATTEMPTS):
            while candidate in tried_skus or Product.objects.filter(
                sku=candidate
            ).exists():
                tried_skus.add(candidate)
                candidate = _next_free_sku(source.sku, tried_skus)
            tried_skus.add(candidate)
            try:
                with transaction.atomic():
                    product = Product(
                        category_id=source.category_id,
                        sku=candidate,
                        status="draft",
                        visibility="hidden",
                        is_active=False,
                        is_featured=False,
                        sort_order=source.sort_order,
                        published_at=None,
                        seo_title=source.seo_title,
                        seo_description=source.seo_description,
                        canonical_url="",
                        robots=source.robots,
                        og_title=source.og_title,
                        og_description=source.og_description,
                        og_image_id=source.og_image_id,
                    )
                    product.full_clean()
                    product.save()
                break
            except DjangoValidationError as exc:
                messages = getattr(exc, "messages", None) or [str(exc)]
                raise DuplicationError({"sku": list(messages)}, status_code=400)
            except IntegrityError:
                # Lost a race on the SKU unique constraint (e.g. a
                # concurrent editor create, which the advisory lock does not
                # serialize against): advance to the next candidate.
                candidate = _sku_candidate(source.sku, 1)
                continue
        if product is None or product.pk is None:
            raise DuplicationError(
                {"sku": ["Could not generate a unique SKU for the duplicate."]},
                status_code=409,
            )

        # --- Translations: deep-copy every existing locale row.
        for src_tr in source_translations:
            new_title = copy_title(src_tr.title, src_tr.language)
            new_slug = _pick_free_product_slug(
                src_tr.slug, new_title, src_tr.language
            )
            _save_translation_row(
                ProductTranslation(
                    product=product,
                    language=src_tr.language,
                    title=new_title,
                    slug=new_slug,
                    short_description=src_tr.short_description,
                    description=src_tr.description,
                    features=src_tr.features,
                    meta_title=src_tr.meta_title,
                    meta_description=src_tr.meta_description,
                )
            )

        # --- Images / documents: new rows, SAME MediaFile (no file copy).
        for src_img in source_images:
            _save_row(
                ProductImage(
                    product=product,
                    media_file_id=src_img.media_file_id,
                    sort_order=src_img.sort_order,
                    is_cover=src_img.is_cover,
                    alt_text=src_img.alt_text,
                    caption=src_img.caption,
                ),
                "images_data",
            )
        for src_doc in source_documents:
            _save_row(
                ProductDocument(
                    product=product,
                    media_file_id=src_doc.media_file_id,
                    title=src_doc.title,
                    doc_type=src_doc.doc_type,
                    sort_order=src_doc.sort_order,
                    is_active=src_doc.is_active,
                    description=src_doc.description,
                ),
                "documents_data",
            )

        # --- Attribute values: new rows, SAME definitions (never copied).
        for src_val in source_values:
            _save_row(
                ProductAttributeValue(
                    product=product,
                    definition_id=src_val.definition_id,
                    value_text=src_val.value_text,
                    value_number=src_val.value_number,
                    value_boolean=src_val.value_boolean,
                ),
                "attributes_data",
            )

        # --- Specifications: fully owned, deep-copied.
        for src_spec in source_specs:
            _save_row(
                ProductSpecification(
                    product=product,
                    section=src_spec.section,
                    label=src_spec.label,
                    value=src_spec.value,
                    unit=src_spec.unit,
                    sort_order=src_spec.sort_order,
                ),
                "specs_data",
            )

        # --- Price: deep-copy when present.
        if source_price is not None:
            _save_row(
                ProductPrice(
                    product=product,
                    display_mode=source_price.display_mode,
                    regular_price=source_price.regular_price,
                    sale_price=source_price.sale_price,
                    currency=source_price.currency,
                    discount_type=source_price.discount_type,
                    discount_value=source_price.discount_value,
                    starts_at=source_price.starts_at,
                    ends_at=source_price.ends_at,
                    is_active=source_price.is_active,
                ),
                "price_data",
            )

        # Deliberately untouched/omitted: outgoing RelatedProduct rows
        # (duplicate gets zero), incoming rows (owned by others), any
        # original<->duplicate edge, HomepageFeaturedProduct, SlugHistory
        # (new translation rows have no prior slug -> save() no-ops).
        return product


def duplicate_category(source_id):
    """Node-only category duplicate under the same parent. Returns the new category."""
    with transaction.atomic():
        _acquire_domain_lock(_LOCK_CATEGORY)
        source = _load_category_source(source_id)
        source_translations = list(source.translations.all())

        tried_slugs = set()
        candidate, _ = _pick_free_category_slug(source.slug)
        category = None
        for _ in range(MAX_SLUG_ATTEMPTS):
            while candidate in tried_slugs or ProductCategory.objects.filter(
                slug=candidate
            ).exists():
                tried_slugs.add(candidate)
                candidate = _next_free_category_slug(source.slug, tried_slugs)
            tried_slugs.add(candidate)
            try:
                with transaction.atomic():
                    category = ProductCategory(
                        parent_id=source.parent_id,
                        slug=candidate,
                        sort_order=source.sort_order,
                        is_active=False,
                        is_featured=False,
                        cover_id=source.cover_id,
                        seo_title=source.seo_title,
                        seo_description=source.seo_description,
                        canonical_url="",
                        robots=source.robots,
                        og_title=source.og_title,
                        og_description=source.og_description,
                        og_image_id=source.og_image_id,
                    )
                    category.full_clean()
                    category.save()
                break
            except DjangoValidationError as exc:
                messages = getattr(exc, "messages", None) or [str(exc)]
                raise DuplicationError({"slug": list(messages)}, status_code=400)
            except IntegrityError:
                candidate = _slug_candidate(source.slug, 1, 255)
                continue
        if category is None or category.pk is None:
            raise DuplicationError(
                {"slug": ["Could not generate a unique slug for the duplicate."]},
                status_code=409,
            )

        for src_tr in source_translations:
            new_title = copy_title(src_tr.title, src_tr.language)
            new_slug = _pick_free_category_translation_slug(
                src_tr.slug, new_title, src_tr.language
            )
            _save_translation_row(
                ProductCategoryTranslation(
                    category=category,
                    language=src_tr.language,
                    title=new_title,
                    slug=new_slug,
                    description=src_tr.description,
                    content=src_tr.content,
                    meta_title=src_tr.meta_title,
                    meta_description=src_tr.meta_description,
                )
            )

        # Deliberately untouched/omitted: products (stay in the original),
        # children (node-only), parent (referenced, not copied),
        # HomepageCategory, SlugHistory (new rows -> save() no-ops),
        # AttributeDefinitions (referenced, never copied or re-parented).
        return category
