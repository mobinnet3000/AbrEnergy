"""Phase 5.1 regression tests: public catalog support additions.

Covers the single backward-compatible public API extension required by the
public catalog: related products in the public product detail response now
expose the translated `slug` so the storefront can link them without N+1
detail fetches. No schema changes, no removed fields.
"""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import Product, RelatedProduct
from apps.products.tests.test_phase2 import make_product, make_tr


@pytest.mark.django_db
class PublicRelatedSlugTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_detail_related_includes_slug(self):
        main = make_product(sku="P51-MAIN")
        make_tr(main, title="محصول اصلی")
        other = make_product(sku="P51-OTHER")
        other_tr = make_tr(other, title="محصول مرتبط")
        RelatedProduct.objects.create(
            from_product=main, to_product=other, relation_type="related", sort_order=0,
        )
        res = self.client.get(f"/api/v1/products/{main.translations.get(language='fa').slug}/")
        assert res.status_code == 200, res.data
        related = res.data["related"]
        assert len(related) == 1
        assert related[0]["id"] == str(other.id)
        assert related[0]["slug"] == other_tr.slug
        assert related[0]["title"] == "محصول مرتبط"
        assert related[0]["relation_type"] == "related"

    def test_public_detail_related_slug_falls_back_to_sku(self):
        main = make_product(sku="P51-FB")
        make_tr(main, title="اصلی بدون اسلاگ مرتبط")
        # Related product with NO translation row at all -> slug mirrors
        # the list serializer's get_slug fallback (sku).
        other = make_product(sku="P51-FB-OTHER")
        RelatedProduct.objects.create(from_product=main, to_product=other, relation_type="similar")
        res = self.client.get(f"/api/v1/products/{main.translations.get(language='fa').slug}/")
        assert res.status_code == 200, res.data
        assert res.data["related"][0]["slug"] == "P51-FB-OTHER"


@pytest.mark.django_db
class PublicCatalogExposureTest(TestCase):
    """Guardrails: public catalog endpoints stay AllowAny and effective-only."""

    def setUp(self):
        self.client = APIClient()

    def test_public_endpoints_require_no_auth(self):
        p = make_product(sku="P51-PUB")
        slug = make_tr(p, title="عمومی").slug
        for url in ("/api/v1/products/", "/api/v1/product-categories/", f"/api/v1/products/{slug}/"):
            res = self.client.get(url)
            assert res.status_code in (200, 404), (url, res.status_code)

    def test_public_detail_exposes_no_admin_price_internals(self):
        p = make_product(sku="P51-NOLEAK")
        slug = make_tr(p, title="بدون نشت").slug
        res = self.client.get(f"/api/v1/products/{slug}/")
        assert res.status_code == 200, res.data
        for key in (
            "price_display_mode", "price_is_active", "price_regular", "price_sale",
            "price_discount_type", "price_discount_value", "price_starts_at", "price_ends_at",
        ):
            assert key not in res.data, key
        assert "state" in res.data["price"]
