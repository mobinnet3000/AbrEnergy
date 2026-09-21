"""Phase 5.2 regression tests: product OG image + slug history/resolve.

Task A — public product detail mirrors the category SEO exposure:
`og_image` (FK id) + `og_image_url`, additive only.

Task C — minimal reusable slug history (SlugHistory) with public
canonical-first resolve endpoints for products and categories.
"""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import Product, ProductCategory, SlugHistory
from apps.products.tests.test_phase2 import (
    make_category,
    make_cat_tr,
    make_image_file,
    make_product,
    make_tr,
)
from apps.products.translation_models import ProductTranslation


def _detail(client, slug):
    return client.get(f"/api/v1/products/{slug}/")


@pytest.mark.django_db
class PublicProductOgImageTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_detail_exposes_og_image_when_configured(self):
        p = make_product(sku="P52-OG")
        slug = make_tr(p, title="محصول سئو").slug
        mf = make_image_file(name="og52.png")
        p.og_image = mf
        p.save()
        res = _detail(self.client, slug)
        assert res.status_code == 200, res.data
        # Mirrors CategorySerializer: FK id plus resolved URL. DRF renders
        # the UUID PK as a UUID object; compare stringified.
        assert str(res.data["og_image"]) == str(mf.id)
        assert res.data["og_image_url"], "configured OG image must expose a URL"
        # MediaFile stores uploads under generated names; assert shape, not name.
        assert res.data["og_image_url"].startswith("/media/")
        assert res.data["og_image_url"].endswith(".png")

    def test_public_detail_missing_og_image_remains_safe(self):
        p = make_product(sku="P52-NOOG")
        slug = make_tr(p, title="بدون تصویر سئو").slug
        res = _detail(self.client, slug)
        assert res.status_code == 200, res.data
        assert res.data["og_image"] is None
        assert res.data["og_image_url"] == ""

    def test_public_detail_still_hides_admin_fields(self):
        p = make_product(sku="P52-NOLEAK")
        slug = make_tr(p, title="بدون نشت ۵.۲").slug
        res = _detail(self.client, slug)
        assert res.status_code == 200, res.data
        for key in (
            "price_display_mode", "price_is_active", "price_regular", "price_sale",
            "price_discount_type", "price_discount_value", "price_starts_at",
            "price_ends_at", "relations_admin",
        ):
            assert key not in res.data, key
        # Contract intact: pre-existing detail fields still present.
        for key in (
            "id", "title", "slug", "sku", "price", "images", "documents",
            "specifications", "attribute_values", "related",
            "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image", "og_image_url",
            "meta_title", "meta_description",
        ):
            assert key in res.data, key

    def test_public_detail_needs_no_auth(self):
        p = make_product(sku="P52-PUB")
        slug = make_tr(p, title="عمومی ۵.۲").slug
        res = _detail(self.client, slug)
        assert res.status_code == 200, res.data


@pytest.mark.django_db
class ProductSlugHistoryTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_slug_change_records_history(self):
        p = make_product(sku="P52-HIST")
        tr = make_tr(p, title="تاریخچه")
        old = tr.slug
        tr.slug = "new-slug-p52-hist"
        tr.save()
        row = SlugHistory.objects.filter(
            target_type="product", object_id=p.id, language="fa", old_slug=old
        ).first()
        assert row is not None
        assert str(row.object_id) == str(p.id)

    def test_no_history_row_on_first_create(self):
        p = make_product(sku="P52-FRESH")
        make_tr(p, title="تازه")
        assert SlugHistory.objects.filter(
            target_type="product", object_id=p.id
        ).count() == 0

    def test_resaving_without_slug_change_records_nothing(self):
        p = make_product(sku="P52-SAME")
        tr = make_tr(p, title="بدون تغییر")
        tr.title = "عنوان جدید"
        tr.save()
        assert SlugHistory.objects.filter(
            target_type="product", object_id=p.id
        ).count() == 0

    def test_resolve_old_slug_returns_canonical(self):
        p = make_product(sku="P52-OLD")
        tr = make_tr(p, title="قدیمی")
        old = tr.slug
        tr.slug = "canonical-p52-old"
        tr.save()
        # Current slug resolves normally (detail, no redirect involved).
        res = _detail(self.client, "canonical-p52-old")
        assert res.status_code == 200, res.data
        # Historical slug resolves to the current canonical slug.
        res = self.client.get("/api/v1/products/resolve/", {"slug": old})
        assert res.status_code == 200, res.data
        assert res.data["canonical_slug"] == "canonical-p52-old"

    def test_resolve_current_slug_is_idempotent(self):
        p = make_product(sku="P52-CUR")
        tr = make_tr(p, title="جاری")
        res = self.client.get("/api/v1/products/resolve/", {"slug": tr.slug})
        assert res.status_code == 200, res.data
        # Equal to the requested slug: the frontend must NOT redirect
        # (loop-safe by construction; see view docstring).
        assert res.data["canonical_slug"] == tr.slug

    def test_unknown_slug_stays_404(self):
        assert _detail(self.client, "no-such-p52-slug").status_code == 404
        res = self.client.get("/api/v1/products/resolve/", {"slug": "no-such-p52-slug"})
        assert res.status_code == 404

    def test_resolve_requires_slug_param(self):
        assert self.client.get("/api/v1/products/resolve/").status_code == 400

    def test_nonpublic_products_never_leak_through_history(self):
        draft = make_product(sku="P52-DRAFT", status="draft")
        tr = make_tr(draft, title="پیش‌نویس")
        old_draft = tr.slug
        tr.slug = "canonical-p52-draft"
        tr.save()
        assert _detail(self.client, "canonical-p52-draft").status_code == 404
        assert self.client.get("/api/v1/products/resolve/", {"slug": old_draft}).status_code == 404

        hidden = make_product(sku="P52-HID", visibility="hidden")
        tr2 = make_tr(hidden, title="مخفی")
        old_hidden = tr2.slug
        tr2.slug = "canonical-p52-hidden"
        tr2.save()
        assert self.client.get("/api/v1/products/resolve/", {"slug": old_hidden}).status_code == 404

        inactive = make_product(sku="P52-INACT", active=False)
        tr3 = make_tr(inactive, title="غیرفعال")
        old_inactive = tr3.slug
        tr3.slug = "canonical-p52-inactive"
        tr3.save()
        assert self.client.get("/api/v1/products/resolve/", {"slug": old_inactive}).status_code == 404

    def test_locale_handling_with_fa_fallback(self):
        p = make_product(sku="P52-LOCALE")
        make_tr(p, title="فارسی", lang="fa")
        en = ProductTranslation.objects.create(
            product=p, language="en", title="English", slug="old-en-p52"
        )
        en.slug = "new-en-p52"
        en.save()
        row = SlugHistory.objects.filter(
            target_type="product", object_id=p.id, language="en", old_slug="old-en-p52"
        ).first()
        assert row is not None
        # Exact-language resolution works (lang passed as a query param).
        res = self.client.get("/api/v1/products/resolve/", {"slug": "old-en-p52", "lang": "en"})
        assert res.status_code == 200, res.data
        assert res.data["canonical_slug"] == "new-en-p52"
        # The en history row does not answer fa requests (fa fallback only
        # consults fa rows); documents the per-language scoping.
        res = self.client.get("/api/v1/products/resolve/", {"slug": "old-en-p52"})
        assert res.status_code == 404

    def test_collision_first_owner_wins_no_duplicates(self):
        a = make_product(sku="P52-COL-A")
        tr_a = make_tr(a, title="مالک اول")
        old_a = tr_a.slug
        tr_a.slug = "canonical-p52-col-a"
        tr_a.save()
        b = make_product(sku="P52-COL-B")
        make_tr(b, title="مالک دوم")
        from apps.products.models import record_slug_history
        # A different object must not steal A's remembered slug: the call
        # is refused (None) and the original owner is preserved.
        result = record_slug_history("product", b.id, "fa", old_a, "canonical-p52-col-b")
        assert result is None
        kept = SlugHistory.objects.filter(
            target_type="product", language="fa", old_slug=old_a
        ).first()
        assert kept is not None
        assert str(kept.object_id) == str(a.id)
        assert SlugHistory.objects.filter(
            target_type="product", language="fa", old_slug=old_a
        ).count() == 1


@pytest.mark.django_db
class CategorySlugHistoryTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_category_slug_change_records_history_and_resolves(self):
        cat = make_category(slug="cat-p52-old")
        make_cat_tr(cat, title="دسته قدیمی")
        cat.slug = "cat-p52-new"
        cat.save()
        row = SlugHistory.objects.filter(
            target_type="product_category", object_id=cat.id,
            language="", old_slug="cat-p52-old",
        ).first()
        assert row is not None
        # Current slug resolves normally.
        assert self.client.get("/api/v1/product-categories/cat-p52-new/").status_code == 200
        # Historical slug resolves to the current canonical slug.
        res = self.client.get("/api/v1/product-categories/resolve/", {"slug": "cat-p52-old"})
        assert res.status_code == 200, res.data
        assert res.data["canonical_slug"] == "cat-p52-new"

    def test_inactive_category_does_not_resolve(self):
        cat = make_category(slug="cat-p52-off-old")
        make_cat_tr(cat, title="دسته خاموش")
        cat.slug = "cat-p52-off-new"
        cat.save()
        cat.is_active = False
        cat.save()
        assert self.client.get("/api/v1/product-categories/cat-p52-off-new/").status_code == 404
        res = self.client.get("/api/v1/product-categories/resolve/", {"slug": "cat-p52-off-old"})
        assert res.status_code == 404

    def test_unknown_category_slug_stays_404(self):
        assert self.client.get("/api/v1/product-categories/no-such-p52-cat/").status_code == 404
        res = self.client.get("/api/v1/product-categories/resolve/", {"slug": "no-such-p52-cat"})
        assert res.status_code == 404

    def test_category_and_product_namespaces_do_not_collide(self):
        # Same slug string may live in both namespaces; each resolves
        # within its own target_type.
        cat = make_category(slug="shared-p52")
        make_cat_tr(cat, title="دسته مشترک")
        p = make_product(sku="P52-SHARED")
        ProductTranslation.objects.create(
            product=p, language="fa", title="محصول مشترک", slug="shared-p52"
        )
        assert self.client.get("/api/v1/product-categories/shared-p52/").status_code == 200
        assert _detail(self.client, "shared-p52").status_code == 200
