"""Phase 9.4 tests: product / category duplicate (clone).

Covers the complete duplication matrix: permissions, happy paths, PK
regeneration, SKU/SLUG copy families, slug-history isolation, publication
reset, media reuse, shared definitions, related products, homepage
isolation, atomic rollback, repeated duplication, conflict exhaustion,
concurrency (incl. the unconstrained translation-slug race), 404s, and
request-body override rejection.
"""
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from unittest import mock

import pytest
from django.test import TestCase
from rest_framework.test import APIClient

import apps.products.duplication as duplication
from apps.homepage.models import HomepageCategory, HomepageFeaturedProduct
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
    SlugHistory,
)
from apps.products.tests.test_phase2 import (
    make_category,
    make_cat_tr,
    make_image_file,
    make_pdf_file,
    make_product,
    make_tr,
)
from apps.products.translation_models import (
    ProductCategoryTranslation,
    ProductTranslation,
)
from apps.users.models import User


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="p", full_name="E", role=role
    )


def auth_client(role):
    client = APIClient()
    if role is not None:
        client.force_authenticate(user=make_user("%s@t.test" % role, role))
    return client


def make_rich_product(sku, cat=None, **kwargs):
    """Published/public/active/featured product with SEO + timestamps set."""
    p = make_product(sku=sku, cat=cat, **kwargs)
    p.seo_title = "seo-%s" % sku
    p.seo_description = "seo-desc-%s" % sku
    p.canonical_url = "https://example.com/%s" % sku
    p.robots = "noindex_follow"
    p.og_title = "og-%s" % sku
    p.og_description = "og-desc-%s" % sku
    p.save()
    return p


def add_full_nested(product, img_file=None, pdf_file=None):
    img_file = img_file or make_image_file(name="img-%s.png" % product.sku)
    img2 = make_image_file(name="img2-%s.png" % product.sku)
    ProductImage.objects.create(
        product=product, media_file=img_file, sort_order=1,
        is_cover=True, alt_text="alt", caption="cap",
    )
    ProductImage.objects.create(
        product=product, media_file=img2, sort_order=2,
        is_cover=False, alt_text="alt2", caption="cap2",
    )
    pdf_file = pdf_file or make_pdf_file(name="doc-%s.pdf" % product.sku)
    ProductDocument.objects.create(
        product=product, media_file=pdf_file, title="Doc",
        doc_type="datasheet", sort_order=1, is_active=True,
        description="desc",
    )
    return img_file, img2, pdf_file


@pytest.mark.django_db
class DuplicatePermissionTest(TestCase):
    def setUp(self):
        self.cat = make_category(slug="perm-cat")
        self.product = make_product(sku="PERM-1", cat=self.cat)
        make_tr(self.product, title="مجوز")

    def _check(self, url):
        cases = [
            (None, 401),
            ("customer", 403),
            ("engineer", 403),
            ("content_manager", 201),
            ("website_admin", 201),
            ("super_admin", 201),
        ]
        for role, expected in cases:
            client = auth_client(role)
            res = client.post(url, {}, format="json")
            assert res.status_code == expected, (role, url, res.status_code, res.data)

    def test_product_permissions(self):
        self._check("/api/v1/admin/products/%s/duplicate/" % self.product.id)

    def test_category_permissions(self):
        self._check("/api/v1/admin/product-categories/%s/duplicate/" % self.cat.id)

    def test_unknown_source_404(self):
        import uuid

        client = auth_client("content_manager")
        res = client.post(
            "/api/v1/admin/products/%s/duplicate/" % uuid.uuid4(), {}, format="json"
        )
        assert res.status_code == 404
        res = client.post(
            "/api/v1/admin/product-categories/%s/duplicate/" % uuid.uuid4(),
            {},
            format="json",
        )
        assert res.status_code == 404

    def test_malformed_uuid_404_not_500(self):
        client = auth_client("content_manager")
        res = client.post(
            "/api/v1/admin/products/not-a-uuid/duplicate/", {}, format="json"
        )
        assert res.status_code == 404


@pytest.mark.django_db
class DuplicateProductHappyPathTest(TestCase):
    def setUp(self):
        self.client = auth_client("content_manager")
        self.cat = make_category(slug="happy-cat")
        make_cat_tr(self.cat, title="دسته شاد")
        self.og = make_image_file(name="og-happy.png")
        self.product = make_rich_product(
            "HAPPY-1", cat=self.cat, status="published",
            visibility="public", active=True, featured=True, order=7,
        )
        self.product.og_image = self.og
        self.product.save()
        self.fa = make_tr(self.product, title="محصول شاد")
        self.fa.slug = "happy-slug"
        self.fa.save()
        self.ar = ProductTranslation.objects.create(
            product=self.product, language="ar",
            title="منتج سعيد", slug="happy-slug-ar",
        )
        self.en = ProductTranslation.objects.create(
            product=self.product, language="en",
            title="Happy product", slug="happy-slug-en",
        )
        self.img, self.img2, self.pdf = add_full_nested(self.product)
        self.num_def = ProductAttributeDefinition.objects.create(
            code="happy-power", name="توان", data_type="number",
            unit="kW", category=self.cat,
        )
        self.txt_def = ProductAttributeDefinition.objects.create(
            code="happy-note", name="یادداشت", data_type="text",
        )
        ProductAttributeValue.objects.create(
            product=self.product, definition=self.num_def, value_number=Decimal("5.5"),
        )
        ProductAttributeValue.objects.create(
            product=self.product, definition=self.txt_def, value_text="متن",
        )
        ProductSpecification.objects.create(
            product=self.product, section="برق", label="ولتاژ",
            value="220", unit="V", sort_order=1,
        )
        ProductPrice.objects.create(
            product=self.product, display_mode="regular",
            regular_price=Decimal("100"), currency="IRR",
        )
        self.other = make_product(sku="HAPPY-OTHER")
        make_tr(self.other, title="دیگر")
        RelatedProduct.objects.create(
            from_product=self.product, to_product=self.other,
            relation_type="accessory",
        )
        self.third = make_product(sku="HAPPY-THIRD")
        make_tr(self.third, title="سوم")
        RelatedProduct.objects.create(
            from_product=self.third, to_product=self.product,
        )
        HomepageFeaturedProduct.objects.create(product=self.product, order=3)
        # Give the source one history row (rename once).
        self.fa.slug = "happy-slug-v2"
        self.fa.save()
        self.history_before = SlugHistory.objects.count()

    def _duplicate(self, body=None):
        res = self.client.post(
            "/api/v1/admin/products/%s/duplicate/" % self.product.id,
            body if body is not None else {},
            format="json",
        )
        assert res.status_code == 201, res.data
        return res

    def test_returns_new_resource_detail(self):
        res = self._duplicate()
        assert str(res.data["id"]) != str(self.product.id)
        dup = Product.objects.get(pk=res.data["id"])
        assert dup.sku == "HAPPY-1-COPY"
        # Admin detail shape (raw pricing inputs present).
        assert res.data["price_display_mode"] == "regular"

    def test_publication_reset_and_category_preserved(self):
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert dup.status == "draft"
        assert dup.visibility == "hidden"
        assert dup.is_active is False
        assert dup.is_featured is False
        assert dup.published_at is None
        assert dup.canonical_url == ""
        assert dup.category_id == self.cat.id
        assert dup.sort_order == 7
        # SEO advisory fields copied.
        assert dup.seo_title == "seo-HAPPY-1"
        assert dup.seo_description == "seo-desc-HAPPY-1"
        assert dup.robots == "noindex_follow"
        assert dup.og_title == "og-HAPPY-1"
        assert dup.og_description == "og-desc-HAPPY-1"
        assert dup.og_image_id == self.og.id

    def test_translations_deep_copied_with_suffixes_and_slugs(self):
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        by_lang = {t.language: t for t in dup.translations.all()}
        assert set(by_lang) == {"fa", "ar", "en"}
        assert by_lang["fa"].title == "\u00ab\u0645\u062d\u0635\u0648\u0644 \u0634\u0627\u062f (\u06a9\u067e\u06cc)\u00bb"
        assert by_lang["ar"].title.endswith(" (\u0646\u0633\u062e\u0629)")
        assert by_lang["en"].title == "Happy product (copy)"
        assert by_lang["fa"].slug == "happy-slug-v2-copy"
        assert by_lang["ar"].slug == "happy-slug-ar-copy"
        assert by_lang["en"].slug == "happy-slug-en-copy"
        # Original slugs untouched.
        assert ProductTranslation.objects.get(pk=self.fa.pk).slug == "happy-slug-v2"
        # Nested PKs regenerated.
        assert {t.pk for t in dup.translations.all()} & {self.fa.pk, self.ar.pk, self.en.pk} == set()

    def test_nested_rows_copied(self):
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert dup.images.count() == 2
        assert dup.documents.count() == 1
        assert dup.attribute_values.count() == 2
        assert dup.specifications.count() == 1
        price = ProductPrice.objects.filter(product=dup).first()
        assert price is not None
        assert price.display_mode == "regular"
        assert price.regular_price == Decimal("100")
        assert str(price.pk) != str(ProductPrice.objects.get(product=self.product).pk)

    def test_media_reuse_no_new_files(self):
        media_before = __import__(
            "apps.media_manager.models", fromlist=["MediaFile"]
        ).MediaFile.objects.count()
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert {i.media_file_id for i in dup.images.all()} == {self.img.id, self.img2.id}
        assert dup.documents.first().media_file_id == self.pdf.id
        covers = [i for i in dup.images.all() if i.is_cover]
        assert len(covers) == 1
        from apps.media_manager.models import MediaFile

        assert MediaFile.objects.count() == media_before

    def test_shared_definitions_and_relations_and_homepage(self):
        defs_before = ProductAttributeDefinition.objects.count()
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert ProductAttributeDefinition.objects.count() == defs_before
        assert {v.definition_id for v in dup.attribute_values.all()} == {
            self.num_def.id, self.txt_def.id,
        }
        # Outgoing cleared; incoming untouched; no auto-link.
        assert dup.related_from.count() == 0
        assert self.product.related_from.count() == 1
        assert RelatedProduct.objects.filter(to_product=self.product).count() == 1
        assert RelatedProduct.objects.filter(
            from_product=self.product, to_product=dup
        ).count() == 0
        assert RelatedProduct.objects.filter(
            from_product=dup, to_product=self.product
        ).count() == 0
        # Homepage omitted; original kept.
        assert HomepageFeaturedProduct.objects.filter(product=dup).count() == 0
        assert HomepageFeaturedProduct.objects.filter(product=self.product).count() == 1

    def test_slug_history_isolation(self):
        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert SlugHistory.objects.count() == self.history_before
        assert SlugHistory.objects.filter(object_id=dup.id).count() == 0
        assert SlugHistory.objects.filter(
            target_type="product", object_id=self.product.id
        ).count() >= 1

    def test_publication_invisible(self):
        from apps.products.api.v1.views.products import public_product_qs

        dup = Product.objects.get(pk=self._duplicate().data["id"])
        assert public_product_qs().filter(pk=dup.pk).count() == 0
        anon = APIClient()
        fa_slug = dup.translations.get(language="fa").slug
        assert anon.get("/api/v1/products/%s/" % fa_slug).status_code == 404
        assert anon.get("/api/v1/products/resolve/", {"slug": fa_slug}).status_code == 404

    def test_request_body_overrides_ignored(self):
        res = self._duplicate({"sku": "HACKED", "slug": "hacked"})
        dup = Product.objects.get(pk=res.data["id"])
        assert dup.sku == "HAPPY-1-COPY"
        assert "hacked" not in {
            t.slug for t in dup.translations.all()
        }

    def test_repeated_duplication_copy_family(self):
        ids = set()
        skus = set()
        for _ in range(3):
            res = self.client.post(
                "/api/v1/admin/products/%s/duplicate/" % self.product.id,
                {},
                format="json",
            )
            assert res.status_code == 201, res.data
            ids.add(str(res.data["id"]))
            skus.add(Product.objects.get(pk=res.data["id"]).sku)
        assert len(ids) == 3
        assert skus == {"HAPPY-1-COPY", "HAPPY-1-COPY-2", "HAPPY-1-COPY-3"}
        fa_slugs = {
            Product.objects.get(pk=pk).translations.get(language="fa").slug
            for pk in ids
        }
        assert fa_slugs == {
            "happy-slug-v2-copy", "happy-slug-v2-copy-2", "happy-slug-v2-copy-3",
        }


@pytest.mark.django_db
class DuplicateCategoryHappyPathTest(TestCase):
    def setUp(self):
        self.client = auth_client("content_manager")
        self.parent = make_category(slug="cat-parent")
        make_cat_tr(self.parent, title="والد")
        self.cover = make_image_file(name="cover-cat.png")
        self.og = make_image_file(name="og-cat.png")
        self.source = ProductCategory.objects.create(
            slug="cat-src", parent=self.parent, sort_order=4,
            is_active=True, is_featured=True, cover=self.cover,
            seo_title="seo-cat", seo_description="seo-desc-cat",
            canonical_url="https://example.com/cat-src",
            robots="noindex_follow", og_title="og-cat",
            og_description="og-desc-cat", og_image=self.og,
        )
        make_cat_tr(self.source, title="دسته مبدأ")
        ProductCategoryTranslation.objects.create(
            category=self.source, language="en", title="Source cat",
            slug="cat-src-en",
        )
        self.child = make_category(slug="cat-child", parent=self.source)
        make_cat_tr(self.child, title="فرزند")
        self.product = make_product(sku="CATP-1", cat=self.source)
        make_tr(self.product, title="محصول دسته")
        self.attr_def = ProductAttributeDefinition.objects.create(
            code="cat-grouped", name="گروهی", data_type="text",
            category=self.source,
        )
        HomepageCategory.objects.create(category=self.source, order=2)
        # One history row on the source (rename once).
        self.source.slug = "cat-src-v2"
        self.source.save()
        self.history_before = SlugHistory.objects.count()

    def _duplicate(self):
        res = self.client.post(
            "/api/v1/admin/product-categories/%s/duplicate/" % self.source.id,
            {},
            format="json",
        )
        assert res.status_code == 201, res.data
        return res

    def test_node_only_duplicate(self):
        res = self._duplicate()
        dup = ProductCategory.objects.get(pk=res.data["id"])
        assert str(dup.id) != str(self.source.id)
        assert dup.parent_id == self.parent.id
        assert dup.slug == "cat-src-v2-copy"
        assert dup.sort_order == 4
        assert dup.is_active is False
        assert dup.is_featured is False
        assert dup.cover_id == self.cover.id
        assert dup.og_image_id == self.og.id
        assert dup.seo_title == "seo-cat"
        assert dup.canonical_url == ""
        assert dup.robots == "noindex_follow"
        # Translations deep-copied; originals untouched.
        by_lang = {t.language: t for t in dup.translations.all()}
        assert set(by_lang) == {"fa", "en"}
        src_fa_slug = ProductCategoryTranslation.objects.get(
            category=self.source, language="fa"
        ).slug
        assert src_fa_slug != ""
        assert by_lang["fa"].slug == "%s-copy" % src_fa_slug
        assert by_lang["en"].slug == "cat-src-en-copy"
        assert ProductCategory.objects.get(pk=self.source.pk).slug == "cat-src-v2"
        # Products stay; children stay; definitions untouched.
        assert Product.objects.get(pk=self.product.pk).category_id == self.source.id
        assert dup.products.count() == 0
        assert ProductCategory.objects.get(pk=self.child.pk).parent_id == self.source.id
        assert dup.children.count() == 0
        assert ProductAttributeDefinition.objects.get(pk=self.attr_def.pk).category_id == self.source.id
        # Homepage + history isolation.
        assert HomepageCategory.objects.filter(category=dup).count() == 0
        assert HomepageCategory.objects.filter(category=self.source).count() == 1
        assert SlugHistory.objects.count() == self.history_before
        assert SlugHistory.objects.filter(object_id=dup.id).count() == 0

    def test_category_publication_invisible(self):
        dup = ProductCategory.objects.get(pk=self._duplicate().data["id"])
        anon = APIClient()
        assert dup.slug not in str(anon.get("/api/v1/product-categories/").data)
        assert anon.get("/api/v1/product-categories/%s/" % dup.slug).status_code == 404
        assert anon.get(
            "/api/v1/product-categories/resolve/", {"slug": dup.slug}
        ).status_code == 404

    def test_repeated_category_duplication(self):
        slugs = set()
        for _ in range(2):
            slugs.add(self._duplicate().data["slug"])
        assert slugs == {"cat-src-v2-copy", "cat-src-v2-copy-2"}


@pytest.mark.django_db
class DuplicateEdgeCaseTest(TestCase):
    def setUp(self):
        self.client = auth_client("content_manager")

    def test_missing_locales_stay_missing(self):
        p = make_product(sku="GAP-1")
        make_tr(p, title="فقط فارسی")
        res = self.client.post(
            "/api/v1/admin/products/%s/duplicate/" % p.id, {}, format="json"
        )
        assert res.status_code == 201, res.data
        dup = Product.objects.get(pk=res.data["id"])
        assert {t.language for t in dup.translations.all()} == {"fa"}

    def test_empty_source_slug_generates_from_title(self):
        p = make_product(sku="EMPTYSLUG-1")
        tr = ProductTranslation.objects.create(
            product=p, language="fa", title="بدون اسلاگ", slug="",
        )
        assert tr.slug != ""
        tr.slug = ""
        ProductTranslation.objects.filter(pk=tr.pk).update(slug="")
        res = self.client.post(
            "/api/v1/admin/products/%s/duplicate/" % p.id, {}, format="json"
        )
        assert res.status_code == 201, res.data
        dup = Product.objects.get(pk=res.data["id"])
        new_slug = dup.translations.get(language="fa").slug
        assert new_slug != ""
        assert new_slug != ProductTranslation.objects.get(pk=tr.pk).slug

    def test_product_without_price_images_docs(self):
        p = make_product(sku="BARE-1")
        make_tr(p, title="لخت")
        res = self.client.post(
            "/api/v1/admin/products/%s/duplicate/" % p.id, {}, format="json"
        )
        assert res.status_code == 201, res.data
        dup = Product.objects.get(pk=res.data["id"])
        assert dup.images.count() == 0
        assert ProductPrice.objects.filter(product=dup).count() == 0

    def test_sku_exhaustion_returns_409_never_500(self):
        p = make_product(sku="EXH-1")
        make_tr(p, title="اتمام")
        make_product(sku="EXH-1-COPY")
        make_product(sku="EXH-1-COPY-2")
        with mock.patch.object(duplication, "MAX_SKU_ATTEMPTS", 2):
            res = self.client.post(
                "/api/v1/admin/products/%s/duplicate/" % p.id, {}, format="json"
            )
        assert res.status_code in (400, 409), res.data
        assert "status" in res.data and "errors" in res.data

    def test_product_slug_exhaustion_returns_409(self):
        p = make_product(sku="PSL-1")
        tr = make_tr(p, title="اسلاگ")
        tr.slug = "psl-base"
        tr.save()
        other = make_product(sku="PSL-2")
        ProductTranslation.objects.create(
            product=other, language="fa", title="دیگر", slug="psl-base-copy",
        )
        other2 = make_product(sku="PSL-3")
        ProductTranslation.objects.create(
            product=other2, language="fa", title="دیگر۲", slug="psl-base-copy-2",
        )
        with mock.patch.object(duplication, "MAX_SLUG_ATTEMPTS", 2):
            res = self.client.post(
                "/api/v1/admin/products/%s/duplicate/" % p.id, {}, format="json"
            )
        assert res.status_code in (400, 409), res.data

    def test_category_slug_exhaustion_returns_409(self):
        cat = make_category(slug="csl-base")
        make_cat_tr(cat, title="دسته")
        make_category(slug="csl-base-copy")
        make_category(slug="csl-base-copy-2")
        with mock.patch.object(duplication, "MAX_SLUG_ATTEMPTS", 2):
            res = self.client.post(
                "/api/v1/admin/product-categories/%s/duplicate/" % cat.id,
                {},
                format="json",
            )
        assert res.status_code in (400, 409), res.data
        assert "status" in res.data and "errors" in res.data

    def test_atomic_rollback_on_mid_copy_failure(self):
        p = make_product(sku="ATOM-1")
        make_tr(p, title="اتمی")
        ProductImage.objects.create(
            product=p, media_file=make_image_file(name="atom.png"),
        )
        ProductSpecification.objects.create(
            product=p, section="s", label="l", value="v",
        )
        before_products = Product.objects.count()
        before_tr = ProductTranslation.objects.count()
        before_img = ProductImage.objects.count()
        before_spec = ProductSpecification.objects.count()
        with mock.patch.object(
            duplication, "ProductSpecification",
            side_effect=RuntimeError("boom"),
        ):
            with pytest.raises(RuntimeError):
                duplication.duplicate_product(str(p.id))
        assert Product.objects.count() == before_products
        assert ProductTranslation.objects.count() == before_tr
        assert ProductImage.objects.count() == before_img
        assert ProductSpecification.objects.count() == before_spec
        assert not Product.objects.filter(sku="ATOM-1-COPY").exists()


@pytest.mark.django_db(transaction=True)
class DuplicateConcurrencyTest:
    """Plain pytest class (NOT TestCase): worker threads open their own
    connections and can only see COMMITTED rows, so fixtures must commit —
    ``transaction=True`` provides exactly that (no wrapping atomic)."""
    def test_concurrent_duplicates_same_source(self):
        p = make_product(sku="CONC-1")
        tr = make_tr(p, title="همزمان")
        tr.slug = "conc-slug"
        tr.save()
        make_cat_tr(make_category(slug="conc-cat"), title="دسته")

        def run():
            return duplication.duplicate_product(str(p.id))

        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: run(), range(4)))
        skus = {r.sku for r in results}
        slugs = {
            ProductTranslation.objects.get(product=r, language="fa").slug
            for r in results
        }
        assert len({str(r.id) for r in results}) == 4
        assert skus == {
            "CONC-1-COPY", "CONC-1-COPY-2", "CONC-1-COPY-3", "CONC-1-COPY-4",
        }
        assert slugs == {
            "conc-slug-copy", "conc-slug-copy-2",
            "conc-slug-copy-3", "conc-slug-copy-4",
        }

    def test_concurrent_duplicates_cross_source_shared_slug(self):
        """A and B already share a slug; duplicating both concurrently must
        still yield distinct duplicate slugs (no silent collision)."""
        a = make_product(sku="SHARE-A")
        ProductTranslation.objects.create(
            product=a, language="fa", title="مشترک الف", slug="shared-slug-x",
        )
        b = make_product(sku="SHARE-B")
        ProductTranslation.objects.create(
            product=b, language="fa", title="مشترک ب", slug="shared-slug-x",
        )

        with ThreadPoolExecutor(max_workers=2) as pool:
            fut_a = pool.submit(duplication.duplicate_product, str(a.id))
            fut_b = pool.submit(duplication.duplicate_product, str(b.id))
            dup_a = fut_a.result()
            dup_b = fut_b.result()
        slug_a = ProductTranslation.objects.get(product=dup_a, language="fa").slug
        slug_b = ProductTranslation.objects.get(product=dup_b, language="fa").slug
        assert slug_a != slug_b
        assert slug_a != "shared-slug-x" and slug_b != "shared-slug-x"
        assert {slug_a, slug_b} == {"shared-slug-x-copy", "shared-slug-x-copy-2"}
