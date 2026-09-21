import io
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from apps.media_manager.models import MediaFile
from apps.products.management.commands.seed_product_categories import Command as SeedCommand
from apps.products.models import (
    Product,
    ProductAttributeDefinition,
    ProductAttributeValue,
    ProductCategory,
    ProductDocument,
    ProductImage,
    ProductPrice,
    ProductSpecification,
    RelatedProduct,
)
from apps.products.translation_models import ProductCategoryTranslation, ProductTranslation
from apps.users.models import User


def make_image_file(name="p.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "white").save(buf, "PNG")
    mf = MediaFile.objects.create(
        file=SimpleUploadedFile(name, buf.getvalue(), content_type="image/png"),
        original_name=name, file_type="image", mime_type="image/png",
        file_size=100, subfolder="products",
    )
    return mf


def make_pdf_file(name="doc.pdf"):
    content = b"%PDF-1.4 fake-idempotent-test-content"
    mf = MediaFile.objects.create(
        file=SimpleUploadedFile(name, content, content_type="application/pdf"),
        original_name=name, file_type="document", mime_type="application/pdf",
        file_size=len(content), subfolder="documents",
    )
    return mf


def make_category(title="دسته", slug=None, parent=None, order=0, active=True):
    return ProductCategory.objects.create(
        slug=slug or f"cat-{ProductCategory.objects.count()}", parent=parent,
        sort_order=order, is_active=active,
    )


def make_cat_tr(cat, title="دسته", lang="fa"):
    return ProductCategoryTranslation.objects.create(category=cat, language=lang, title=title)


def make_product(sku=None, cat=None, status="published", visibility="public", active=True, featured=False, order=0):
    return Product.objects.create(
        sku=sku or f"SKU-{Product.objects.count()}", category=cat, status=status,
        visibility=visibility, is_active=active, is_featured=featured, sort_order=order,
    )


def make_tr(prod, title="محصول", lang="fa"):
    return ProductTranslation.objects.create(product=prod, language=lang, title=title, slug=f"{title}-{lang}-{prod.sku}")


@pytest.mark.django_db
class CategoryTest(TestCase):
    def test_create_and_nested(self):
        parent = make_category(slug="parent-cat")
        make_cat_tr(parent, title="والد")
        child = make_category(slug="child-cat", parent=parent)
        make_cat_tr(child, title="فرزند")
        assert child.parent_id == parent.id
        assert parent.children.count() == 1

    def test_slug_uniqueness(self):
        make_category(slug="dup-cat")
        with pytest.raises(IntegrityError):
            make_category(slug="dup-cat")

    def test_self_parent_blocked(self):
        cat = make_category(slug="self-cat")
        cat.parent = cat
        with pytest.raises(ValidationError):
            cat.full_clean()

    def test_ordering(self):
        make_category(slug="c1", order=2)
        make_category(slug="c2", order=1)
        slugs = list(ProductCategory.objects.values_list("slug", flat=True)[:2])
        assert slugs == ["c2", "c1"]

    def test_seed_idempotent(self):
        SeedCommand().handle()
        n1 = ProductCategory.objects.count()
        t1 = ProductCategoryTranslation.objects.filter(language="fa").count()
        SeedCommand().handle()
        assert ProductCategory.objects.count() == n1
        assert ProductCategoryTranslation.objects.filter(language="fa").count() == t1
        assert n1 == 4 + 7 + 4 + 3 + 4
        assert ProductCategoryTranslation.objects.filter(language="en").count() == 0
        assert ProductCategoryTranslation.objects.filter(language="ar").count() == 0

    def test_inactive_hidden_from_public(self):
        cat = make_category(slug="hidden-cat", active=False)
        make_cat_tr(cat)
        res = APIClient().get("/api/v1/product-categories/")
        assert res.status_code == 200
        assert str(cat.id) not in str(res.data)


@pytest.mark.django_db
class ProductTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_translation_slug(self):
        cat = make_category(slug="pc1")
        p = make_product(sku="SKU-1", cat=cat)
        t = make_tr(p, title="پکیج خورشیدی")
        assert t.slug
        assert p.translations.count() == 1

    def test_unique_sku(self):
        make_product(sku="DUP-1")
        with pytest.raises(IntegrityError):
            make_product(sku="DUP-1")

    def test_draft_hidden_from_public(self):
        p = make_product(sku="DRAFT-1", status="draft")
        make_tr(p)
        res = self.client.get("/api/v1/products/")
        assert res.status_code == 200
        assert "DRAFT-1" not in str(res.data)
        t = p.translations.get(language="fa")
        res = self.client.get(f"/api/v1/products/{t.slug}/")
        assert res.status_code == 404

    def test_archived_hidden_from_public(self):
        p = make_product(sku="ARCH-1", status="archived")
        make_tr(p)
        res = self.client.get("/api/v1/products/")
        assert "ARCH-1" not in str(res.data)

    def test_hidden_visibility_excluded(self):
        p = make_product(sku="HID-1", visibility="hidden")
        make_tr(p)
        res = self.client.get("/api/v1/products/")
        assert "HID-1" not in str(res.data)

    def test_featured_filter(self):
        p = make_product(sku="FEAT-1", featured=True)
        make_tr(p)
        res = self.client.get("/api/v1/products/featured/")
        assert res.status_code == 200
        assert "FEAT-1" in str(res.data)

    def test_ordering(self):
        a = make_product(sku="ORD-A", order=2)
        b = make_product(sku="ORD-B", order=1)
        make_tr(a)
        make_tr(b)
        res = self.client.get("/api/v1/products/")
        results = res.data["results"]
        skus = [r["sku"] for r in results]
        assert skus.index("ORD-B") < skus.index("ORD-A")

    def test_published_at_set(self):
        p = make_product(sku="PUB-1", status="published")
        assert p.published_at is not None

    def test_persian_content(self):
        p = make_product(sku="FA-1")
        make_tr(p, title="پکیج ویلایی ۵ کیلووات")
        res = self.client.get("/api/v1/products/", {"search": "ویلایی"})
        assert "FA-1" in str(res.data)

    def test_sku_search(self):
        p = make_product(sku="UNIQSKU-99")
        make_tr(p)
        res = self.client.get("/api/v1/products/", {"search": "UNIQSKU-99"})
        assert "UNIQSKU-99" in str(res.data)

    def test_category_filter(self):
        cat = make_category(slug="filter-cat")
        p = make_product(sku="CATF-1", cat=cat)
        make_tr(p)
        res = self.client.get("/api/v1/products/", {"category": str(cat.id)})
        assert "CATF-1" in str(res.data)

    def test_no_duplicate_results(self):
        p = make_product(sku="NODUP-1")
        ProductTranslation.objects.create(product=p, language="fa", title="تست تکراری", slug="nodup-fa")
        ProductTranslation.objects.create(product=p, language="en", title="dup test", slug="nodup-en")
        res = self.client.get("/api/v1/products/", {"search": "dup"})
        results = res.data["results"]
        assert len([r for r in results if r["sku"] == "NODUP-1"]) == 1

    def test_n_plus_one(self):
        for i in range(5):
            p = make_product(sku=f"N1-{i}")
            make_tr(p, title=f"محصول {i}")
            ProductImage.objects.create(product=p, media_file=make_image_file(f"n1-{i}.png"))
        with CaptureQueriesContext(connection) as ctx:
            res = self.client.get("/api/v1/products/")
            assert res.status_code == 200
        assert len(ctx) < 25, f"too many queries: {len(ctx)}"

    def test_seo_persist_and_public(self):
        p = make_product(sku="SEO-1")
        p.seo_title = "سئو محصول"
        p.seo_description = "توضیح سئو"
        p.canonical_url = "https://example.com/p"
        p.save()
        t = make_tr(p)
        res = self.client.get(f"/api/v1/products/{t.slug}/")
        assert res.data["seo_title"] == "سئو محصول"
        assert res.data["meta_title"]


@pytest.mark.django_db
class PricingTest(TestCase):
    def _priced(self, sku, **kw):
        p = make_product(sku=sku)
        make_tr(p)
        price = ProductPrice(product=p, **kw)
        price.full_clean()
        price.save()
        return price

    def test_regular(self):
        pr = self._priced("PR-REG", display_mode="regular", regular_price=Decimal("25000000"))
        assert pr.get_effective()["state"] == "regular"

    def test_discounted_sale_price(self):
        pr = self._priced("PR-DISC", display_mode="discounted", regular_price=Decimal("25000000"), sale_price=Decimal("21500000"))
        eff = pr.get_effective()
        assert eff["state"] == "discounted"
        assert eff["final_price"] == Decimal("21500000")

    def test_percentage(self):
        pr = self._priced("PR-PCT", display_mode="discounted", regular_price=Decimal("100"), discount_type="percentage", discount_value=Decimal("10"))
        assert pr.get_effective()["final_price"] == Decimal("90.00")

    def test_fixed(self):
        pr = self._priced("PR-FIX", display_mode="discounted", regular_price=Decimal("100"), discount_type="fixed", discount_value=Decimal("15"))
        assert pr.get_effective()["final_price"] == Decimal("85")

    def test_expired(self):
        pr = self._priced("PR-EXP", display_mode="discounted", regular_price=Decimal("100"), sale_price=Decimal("80"), starts_at=timezone.now() - timedelta(days=5), ends_at=timezone.now() - timedelta(days=1))
        assert pr.get_effective()["state"] == "expired"

    def test_scheduled(self):
        pr = self._priced("PR-SCH", display_mode="discounted", regular_price=Decimal("100"), sale_price=Decimal("80"), starts_at=timezone.now() + timedelta(days=1))
        assert pr.get_effective()["state"] == "scheduled"

    def test_sale_exceeds_regular_rejected(self):
        p = make_product(sku="PR-BAD")
        pr = ProductPrice(product=p, display_mode="discounted", regular_price=Decimal("100"), sale_price=Decimal("150"))
        with pytest.raises(ValidationError):
            pr.full_clean()

    def test_contact_mode(self):
        pr = self._priced("PR-CONTACT", display_mode="contact")
        assert pr.get_effective()["state"] == "contact_for_price"

    def test_percent_over_100_rejected(self):
        p = make_product(sku="PR-PCTBAD")
        pr = ProductPrice(product=p, display_mode="discounted", regular_price=Decimal("100"), discount_type="percentage", discount_value=Decimal("150"))
        with pytest.raises(ValidationError):
            pr.full_clean()


@pytest.mark.django_db
class MediaTest(TestCase):
    def test_multiple_images_ordering(self):
        p = make_product(sku="IMG-1")
        m1 = make_image_file("a.png")
        m2 = make_image_file("b.png")
        ProductImage.objects.create(product=p, media_file=m1, sort_order=2)
        ProductImage.objects.create(product=p, media_file=m2, sort_order=1)
        assert [i.media_file_id for i in p.images.all()] == [m2.id, m1.id]

    def test_single_cover(self):
        p = make_product(sku="IMG-2")
        i1 = ProductImage.objects.create(product=p, media_file=make_image_file("c1.png"), is_cover=True)
        i2 = ProductImage.objects.create(product=p, media_file=make_image_file("c2.png"), is_cover=True)
        i1.refresh_from_db()
        i2.refresh_from_db()
        assert (i1.is_cover, i2.is_cover) == (False, True)

    def test_document_requires_pdf_media(self):
        p = make_product(sku="DOC-1")
        img = make_image_file("doc-img.png")
        d = ProductDocument(product=p, media_file=img, title="Bad doc")
        with pytest.raises(ValidationError):
            d.full_clean()

    def test_pdf_upload_accepted(self):
        editor = User.objects.create_user(email="pe@test.com", password="p", full_name="E", role="content_manager")
        client = APIClient()
        client.force_authenticate(user=editor)
        buf = io.BytesIO()
        Image.new("RGB", (10, 10), "white").save(buf, "PNG")
        from django.core.files.uploadedfile import SimpleUploadedFile as SUF
        pdf = SUF("cat.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        res = client.post("/api/v1/media/upload/", {"file": pdf, "subfolder": "documents"}, format="multipart")
        assert res.status_code == 201
        assert res.data["file_type"] == "document"

    def test_exe_still_rejected(self):
        editor = User.objects.create_user(email="pe2@test.com", password="p", full_name="E", role="content_manager")
        client = APIClient()
        client.force_authenticate(user=editor)
        from django.core.files.uploadedfile import SimpleUploadedFile as SUF
        exe = SUF("evil.exe", b"MZ fake", content_type="application/octet-stream")
        res = client.post("/api/v1/media/upload/", {"file": exe, "subfolder": "general"}, format="multipart")
        assert res.status_code == 400


@pytest.mark.django_db
class AttributeSpecTest(TestCase):
    def test_per_category_attributes(self):
        solar = make_category(slug="solar-cat")
        struct = make_category(slug="struct-cat")
        d1 = ProductAttributeDefinition.objects.create(code="sys-power", name="توان سیستم", data_type="number", unit="kW", category=solar)
        d2 = ProductAttributeDefinition.objects.create(code="roof-type", name="نوع سقف", data_type="text", category=struct)
        p = make_product(sku="ATTR-1", cat=solar)
        v = ProductAttributeValue(product=p, definition=d1, value_number=Decimal("5"))
        v.full_clean()
        v.save()
        assert solar.attribute_definitions.count() == 1
        assert struct.attribute_definitions.count() == 1
        assert str(d1) == "توان سیستم (sys-power)"

    def test_value_validation(self):
        d = ProductAttributeDefinition.objects.create(code="num-x", name="Num", data_type="number")
        p = make_product(sku="ATTR-2")
        with pytest.raises(ValidationError):
            ProductAttributeValue(product=p, definition=d).full_clean()

    def test_spec_ordering(self):
        p = make_product(sku="SPEC-1")
        ProductSpecification.objects.create(product=p, label="B", value="2", sort_order=2)
        ProductSpecification.objects.create(product=p, label="A", value="1", sort_order=1)
        assert [s.label for s in p.specifications.all()] == ["A", "B"]


@pytest.mark.django_db
class RelationTest(TestCase):
    def test_related_and_dup_and_self(self):
        a = make_product(sku="REL-A")
        b = make_product(sku="REL-B")
        RelatedProduct.objects.create(from_product=a, to_product=b, relation_type="accessory")
        assert a.related_from.count() == 1
        from django.db import transaction
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                RelatedProduct.objects.create(from_product=a, to_product=b)
        bad = RelatedProduct(from_product=a, to_product=a)
        with pytest.raises(ValidationError):
            bad.full_clean()


@pytest.mark.django_db
class PermissionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(email="pc@test.com", password="p", full_name="C")
        self.editor = User.objects.create_user(email="pe3@test.com", password="p", full_name="E", role="content_manager")

    def test_anonymous_cannot_write(self):
        res = self.client.post("/api/v1/admin/products/", {"sku": "X-1"}, format="json")
        assert res.status_code in (401, 403)

    def test_customer_cannot_write(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post("/api/v1/admin/products/", {"sku": "X-2"}, format="json")
        assert res.status_code in (401, 403)

    def test_editor_can_write(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.post("/api/v1/admin/products/", {"sku": "X-3", "translations": {"fa": {"title": "تست", "slug": "x3"}}}, format="json")
        assert res.status_code == 201
