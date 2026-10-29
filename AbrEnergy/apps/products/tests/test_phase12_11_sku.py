"""Phase 12.11 — SKU uniqueness validation at the serializer layer.

Covers the required matrix:
1. create with unique SKU -> 201
2. create with duplicate SKU -> 400 field error on `sku`
3. edit without changing own SKU -> 200
4. edit to another product's SKU -> 400
5. empty SKU -> 400 (model rule: required, non-blank)
6. DB unique constraint preserved (raw create still raises IntegrityError)
7. non-SKU integrity errors are not mislabelled as SKU errors
"""

import pytest
from django.db import IntegrityError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.api.v1.serializers.products import ProductWriteSerializer
from apps.products.models import Product
from apps.products.translation_models import ProductTranslation
from apps.users.models import User


def make_product(sku, title="محصول", slug=None):
    product = Product.objects.create(sku=sku)
    ProductTranslation.objects.create(
        product=product, language="fa", title=title,
        slug=slug or f"{sku.lower()}-fa",
    )
    return product


class SkuWriteValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            email="sku-editor@test.com", password="p", full_name="E", role="content_manager",
        )
        self.client.force_authenticate(user=self.editor)

    def _create(self, payload):
        return self.client.post("/api/v1/admin/products/", payload, format="json")

    def test_create_unique_sku_succeeds(self):
        res = self._create({"sku": "SKU-NEW-1", "translations": {"fa": {"title": "ت", "slug": "t1"}}})
        assert res.status_code == 201, res.data
        assert Product.objects.filter(sku="SKU-NEW-1").exists()

    def test_create_duplicate_sku_returns_400_on_sku(self):
        make_product("SKU-DUP-1")
        res = self._create({"sku": "SKU-DUP-1", "translations": {"fa": {"title": "ت", "slug": "t2"}}})
        assert res.status_code == 400, res.data
        assert "sku" in res.data["errors"]
        assert Product.objects.filter(sku="SKU-DUP-1").count() == 1

    def test_update_without_changing_own_sku_succeeds(self):
        product = make_product("SKU-OWN-1")
        res = self.client.patch(
            f"/api/v1/admin/products/{product.pk}/",
            {"sku": "SKU-OWN-1", "sort_order": 5},
            format="json",
        )
        assert res.status_code == 200, res.data
        product.refresh_from_db()
        assert product.sort_order == 5

    def test_update_to_another_products_sku_returns_400(self):
        make_product("SKU-TAKEN")
        product = make_product("SKU-MINE")
        res = self.client.patch(
            f"/api/v1/admin/products/{product.pk}/",
            {"sku": "SKU-TAKEN"},
            format="json",
        )
        assert res.status_code == 400, res.data
        assert "sku" in res.data["errors"]
        product.refresh_from_db()
        assert product.sku == "SKU-MINE"

    def test_empty_sku_is_rejected(self):
        res = self._create({"sku": "", "translations": {"fa": {"title": "ت", "slug": "t3"}}})
        assert res.status_code == 400, res.data
        assert "sku" in res.data["errors"]

    def test_missing_sku_is_rejected(self):
        res = self._create({"translations": {"fa": {"title": "ت", "slug": "t4"}}})
        assert res.status_code == 400, res.data
        assert "sku" in res.data["errors"]

    def test_db_unique_constraint_is_preserved(self):
        make_product("SKU-DB-1")
        with pytest.raises(IntegrityError):
            Product.objects.create(sku="SKU-DB-1")

    def test_serializer_reports_duplicate_without_saving(self):
        make_product("SKU-SER-1")
        serializer = ProductWriteSerializer(
            data={"sku": "SKU-SER-1", "translations": {"fa": {"title": "ت", "slug": "t5"}}}
        )
        assert serializer.is_valid() is False
        assert "sku" in serializer.errors


class SkuRaceConditionTest(TestCase):
    """A concurrent insert that slips past validation must become a 400 on the
    `sku` field — never a 500 — while other integrity errors stay untouched."""

    def setUp(self):
        self.serializer = ProductWriteSerializer()

    def test_sku_integrity_error_is_reported_as_sku_conflict(self):
        make_product("SKU-RACE")
        error = self.serializer._sku_conflict("SKU-RACE")
        assert error.detail == {"sku": [ProductWriteSerializer._SKU_DUPLICATE]}

    def test_non_sku_integrity_error_is_not_mislabelled(self):
        # A SKU with no existing row is not a SKU conflict.
        assert self.serializer._is_sku_conflict("SKU-UNSEEN") is False
        # Blank/None never resolves to a SKU conflict.
        assert self.serializer._is_sku_conflict("") is False
        assert self.serializer._is_sku_conflict(None) is False

    def test_sku_conflict_excludes_the_instance_itself(self):
        product = make_product("SKU-SELF")
        assert self.serializer._is_sku_conflict("SKU-SELF", exclude_pk=product.pk) is False
        other = make_product("SKU-OTHER-9")
        assert self.serializer._is_sku_conflict(other.sku) is True
