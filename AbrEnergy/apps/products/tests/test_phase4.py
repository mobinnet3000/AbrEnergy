"""Phase 4 regression tests: admin product write extensions (attributes/relations),
list field exposure, and filter support added for the Product CMS.

All additions are backward-compatible: no schema changes, no removed fields.
"""
from decimal import Decimal

import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import (
    Product,
    ProductAttributeDefinition,
    ProductAttributeValue,
    ProductCategory,
    RelatedProduct,
)
from apps.products.translation_models import ProductTranslation
from apps.products.tests.test_phase2 import make_image_file, make_pdf_file, make_product, make_tr
from apps.users.models import User


def make_editor(email="p4@test.com"):
    return User.objects.create_user(email=email, password="p", full_name="E", role="content_manager")


def admin_post(client, payload):
    return client.post("/api/v1/admin/products/", payload, format="json")


@pytest.mark.django_db
class AttributeRelationWriteTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=make_editor())
        self.cat = ProductCategory.objects.create(slug="p4-cat", sort_order=0)
        self.num_def = ProductAttributeDefinition.objects.create(
            code="p4-power", name="توان", data_type="number", unit="kW", category=self.cat,
        )
        self.txt_def = ProductAttributeDefinition.objects.create(
            code="p4-note", name="یادداشت", data_type="text",
        )

    def test_create_with_attributes_and_relations(self):
        other = make_product(sku="P4-OTHER")
        make_tr(other, title="محصول دیگر")
        res = admin_post(self.client, {
            "sku": "P4-1",
            "category": str(self.cat.id),
            "status": "draft",
            "translations": {"fa": {"title": "محصول تست", "slug": "p4-1"}},
            "attributes_data": [
                {"definition": str(self.num_def.id), "value_number": "5.5"},
                {"definition": str(self.txt_def.id), "value_text": "متن"},
            ],
            "relations_data": [
                {"to_product": str(other.id), "relation_type": "accessory", "sort_order": 1},
            ],
        })
        assert res.status_code == 201, res.data
        p = Product.objects.get(sku="P4-1")
        assert p.attribute_values.count() == 2
        num_val = p.attribute_values.get(definition=self.num_def)
        assert num_val.value_number == Decimal("5.5")
        assert p.related_from.count() == 1

    def test_update_replaces_attributes_and_relations(self):
        p = make_product(sku="P4-2", cat=self.cat)
        make_tr(p, title="قدیمی")
        ProductAttributeValue.objects.create(product=p, definition=self.txt_def, value_text="قدیمی")
        res = self.client.patch(f"/api/v1/admin/products/{p.id}/", {
            "attributes_data": [{"definition": str(self.num_def.id), "value_number": "7"}],
            "relations_data": [],
        }, format="json")
        assert res.status_code == 200, res.data
        p.refresh_from_db()
        assert p.attribute_values.count() == 1
        assert p.attribute_values.get().value_number == Decimal("7")

    def test_invalid_attribute_value_rejected(self):
        res = admin_post(self.client, {
            "sku": "P4-3",
            "translations": {"fa": {"title": "نامعتبر"}},
            "attributes_data": [{"definition": str(self.num_def.id)}],
        })
        assert res.status_code == 400

    def test_self_relation_rejected(self):
        p = make_product(sku="P4-4")
        res = self.client.patch(f"/api/v1/admin/products/{p.id}/", {
            "relations_data": [{"to_product": str(p.id), "relation_type": "related"}],
        }, format="json")
        assert res.status_code == 400

    def test_detail_exposes_values_and_related(self):
        p = make_product(sku="P4-5", cat=self.cat)
        make_tr(p, title="نمایشی")
        ProductAttributeValue.objects.create(product=p, definition=self.num_def, value_number=Decimal("3"))
        other = make_product(sku="P4-6")
        make_tr(other, title="وابسته")
        RelatedProduct.objects.create(from_product=p, to_product=other, relation_type="similar")
        res = self.client.get(f"/api/v1/admin/products/{p.id}/")
        assert res.status_code == 200
        assert len(res.data["attribute_values"]) == 1
        assert res.data["attribute_values"][0]["code"] == "p4-power"
        assert len(res.data["related"]) == 1
        assert res.data["related"][0]["relation_type"] == "similar"

    def test_admin_detail_exposes_price_inputs_and_relations_admin(self):
        from apps.products.models import ProductPrice
        p = make_product(sku="P4-7", cat=self.cat)
        make_tr(p, title="قیمتی")
        ProductPrice.objects.create(
            product=p, display_mode="discounted", regular_price=Decimal("100"),
            discount_type="percentage", discount_value=Decimal("10"), is_active=True,
        )
        other = make_product(sku="P4-8")
        make_tr(other, title="وابسته دو")
        RelatedProduct.objects.create(from_product=p, to_product=other, relation_type="accessory", sort_order=2)
        res = self.client.get(f"/api/v1/admin/products/{p.id}/")
        assert res.status_code == 200
        assert res.data["price_display_mode"] == "discounted"
        assert res.data["price_is_active"] is True
        assert str(res.data["price_regular"]) == "100.00"
        assert len(res.data["relations_admin"]) == 1
        assert res.data["relations_admin"][0]["to_product"] == str(other.id)
        assert res.data["relations_admin"][0]["relation_type"] == "accessory"

    def test_public_detail_hides_admin_price_inputs(self):
        from apps.products.models import ProductPrice
        p = make_product(sku="P4-9", status="published")
        make_tr(p, title="عمومی", lang="fa")
        ProductTranslation.objects.filter(product=p, language="fa").update(slug="p4-9")
        ProductPrice.objects.create(product=p, display_mode="regular", regular_price=Decimal("50"))
        res = self.client.get("/api/v1/products/p4-9/")
        assert res.status_code == 200
        assert "price_display_mode" not in res.data
        assert "relations_admin" not in res.data


@pytest.mark.django_db
class ListExposureFilterTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=make_editor("p4list@test.com"))

    def test_list_exposes_is_active_and_updated_at(self):
        p = make_product(sku="P4-L1", active=False)
        make_tr(p, title="غیرفعال")
        res = self.client.get("/api/v1/admin/products/")
        assert res.status_code == 200
        row = next(r for r in res.data["results"] if r["sku"] == "P4-L1")
        assert row["is_active"] is False
        assert "updated_at" in row

    def test_filter_by_is_active(self):
        make_tr(make_product(sku="P4-A1", active=True), title="فعال")
        make_tr(make_product(sku="P4-A2", active=False), title="غیرفعال دو")
        res = self.client.get("/api/v1/admin/products/?is_active=false")
        assert res.status_code == 200
        skus = [r["sku"] for r in res.data["results"]]
        assert "P4-A2" in skus
        assert "P4-A1" not in skus

    def test_attribute_definitions_filter_by_category(self):
        cat = ProductCategory.objects.create(slug="p4-attr-cat")
        ProductAttributeDefinition.objects.create(code="p4-c1", name="خاص", category=cat)
        ProductAttributeDefinition.objects.create(code="p4-g1", name="عمومی")
        res = self.client.get(f"/api/v1/admin/product-categories/attributes/?category={cat.id}")
        assert res.status_code == 200
        codes = [r["code"] for r in res.data["results"]]
        assert codes == ["p4-c1"]
        res = self.client.get("/api/v1/admin/product-categories/attributes/?search=p4-g1")
        assert [r["code"] for r in res.data["results"]] == ["p4-g1"]


@pytest.mark.django_db
class NestedMediaWriteTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=make_editor("p4media@test.com"))

    def test_create_with_images_docs_specs_price(self):
        img = make_image_file("p4.png")
        pdf = make_pdf_file("p4.pdf")
        res = admin_post(self.client, {
            "sku": "P4-M1",
            "status": "draft",
            "translations": {"fa": {"title": "رسانه‌ای"}},
            "price_data": {"display_mode": "regular", "regular_price": "1000000"},
            "images_data": [{"media_file": str(img.id), "is_cover": True, "sort_order": 0}],
            "documents_data": [{"media_file": str(pdf.id), "title": "کاتالوگ", "doc_type": "catalog"}],
            "specs_data": [{"section": "فنی", "label": "توان", "value": "5", "unit": "kW"}],
        })
        assert res.status_code == 201, res.data
        p = Product.objects.get(sku="P4-M1")
        assert p.images.count() == 1
        assert p.images.get().is_cover is True
        assert p.documents.count() == 1
        assert p.specifications.count() == 1
        assert p.price.regular_price == Decimal("1000000")
        detail = self.client.get(f"/api/v1/admin/products/{p.id}/")
        assert str(detail.data["images"][0]["media_file"]) == str(img.id)
        assert ProductTranslation.objects.filter(product=p, language="fa").exists()
