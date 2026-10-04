"""Phase 9.5 tests: lightweight media reuse / media picker API slice.

Reference-based reuse only: one ``MediaFile`` may back many consumer rows,
zero physical duplication, zero new ``MediaFile`` rows on reuse, no
migration. Covers the list/retrieve permission matrix, search / type
filter / pagination / stable ordering, safe response fields, unchanged
upload validation, invalid-id behavior, multi-consumer reuse, incompatible
type rejection, and unchanged delete permissions.
"""
import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient

from apps.homepage.models import HomepageVisual
from apps.media_manager.models import MediaFile
from apps.products.models import ProductDocument, ProductImage
from apps.products.tests.test_phase2 import (
    make_category,
    make_image_file,
    make_pdf_file,
    make_product,
    make_tr,
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


def make_upload_image(name="ok.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "white").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


LIST_URL = "/api/v1/media/"


def detail_url(pk):
    return "/api/v1/media/%s/" % pk


def seed_library():
    img1 = make_image_file(name="packshot-alpha.png")
    img1.alt_text = "alpha packshot"
    img1.save()
    img2 = make_image_file(name="packshot-beta.png")
    pdf = make_pdf_file(name="datasheet-gamma.pdf")
    return img1, img2, pdf


@pytest.mark.django_db
class MediaListPermissionTest(TestCase):
    def test_list_permission_matrix(self):
        seed_library()
        cases = [
            (None, 401),
            ("customer", 403),
            ("engineer", 403),
            ("content_manager", 200),
            ("website_admin", 200),
            ("super_admin", 200),
        ]
        for role, expected in cases:
            res = auth_client(role).get(LIST_URL)
            assert res.status_code == expected, "list as %r: %s" % (role, res.status_code)

    def test_retrieve_permission_matrix(self):
        img1, _, _ = seed_library()
        cases = [
            (None, 401),
            ("customer", 403),
            ("engineer", 403),
            ("content_manager", 200),
            ("website_admin", 200),
            ("super_admin", 200),
        ]
        for role, expected in cases:
            res = auth_client(role).get(detail_url(img1.pk))
            assert res.status_code == expected, "retrieve as %r: %s" % (role, res.status_code)

    def test_retrieve_unknown_id_is_404(self):
        client = auth_client("content_manager")
        res = client.get(detail_url("00000000-0000-0000-0000-000000000000"))
        assert res.status_code == 404


@pytest.mark.django_db
class MediaListFilterTest(TestCase):
    def setUp(self):
        self.client = auth_client("content_manager")
        seed_library()

    def test_search_matches_original_name(self):
        res = self.client.get(LIST_URL, {"search": "alpha"})
        assert res.status_code == 200
        names = [r["original_name"] for r in res.data["results"]]
        assert names == ["packshot-alpha.png"]

    def test_search_matches_alt_text_case_insensitive(self):
        res = self.client.get(LIST_URL, {"search": "ALPHA PACKSHOT"})
        assert res.status_code == 200
        assert [r["original_name"] for r in res.data["results"]] == ["packshot-alpha.png"]

    def test_search_no_match_is_empty(self):
        res = self.client.get(LIST_URL, {"search": "no-such-file-zzz"})
        assert res.status_code == 200
        assert res.data["count"] == 0
        assert res.data["results"] == []

    def test_image_filter(self):
        res = self.client.get(LIST_URL, {"file_type": "image"})
        assert res.status_code == 200
        assert res.data["count"] == 2
        assert {r["file_type"] for r in res.data["results"]} == {"image"}

    def test_document_filter(self):
        res = self.client.get(LIST_URL, {"file_type": "document"})
        assert res.status_code == 200
        assert res.data["count"] == 1
        assert res.data["results"][0]["original_name"] == "datasheet-gamma.pdf"

    def test_pagination_envelope_and_page_size(self):
        res = self.client.get(LIST_URL, {"page_size": 2})
        assert res.status_code == 200
        assert set(res.data.keys()) >= {"count", "next", "previous", "results"}
        assert res.data["count"] == 3
        assert len(res.data["results"]) == 2
        assert res.data["next"] is not None
        page2 = self.client.get(LIST_URL, {"page_size": 2, "page": 2})
        assert page2.status_code == 200
        assert len(page2.data["results"]) == 1

    def test_page_size_cap_respected(self):
        res = self.client.get(LIST_URL, {"page_size": 500})
        assert res.status_code == 200
        assert len(res.data["results"]) == 3

    def test_stable_default_ordering_newest_first(self):
        res = self.client.get(LIST_URL)
        names = [r["original_name"] for r in res.data["results"]]
        # make_image_file/make_pdf_file created in order img1, img2, pdf.
        assert names == ["datasheet-gamma.pdf", "packshot-beta.png", "packshot-alpha.png"]

    def test_explicit_ordering(self):
        res = self.client.get(LIST_URL, {"ordering": "original_name"})
        names = [r["original_name"] for r in res.data["results"]]
        assert names == sorted(names)

    def test_invalid_ordering_falls_back_to_default(self):
        res = self.client.get(LIST_URL, {"ordering": "file;DROP"})
        assert res.status_code == 200
        assert [r["original_name"] for r in res.data["results"]][0] == "datasheet-gamma.pdf"


@pytest.mark.django_db
class MediaResponseSafetyTest(TestCase):
    ALLOWED = {
        "id", "url", "thumbnail_url", "original_name", "file_type",
        "file_size", "width", "height", "alt_text", "subfolder",
        "uploaded_at",
    }

    def test_list_exposes_only_safe_fields(self):
        seed_library()
        res = auth_client("content_manager").get(LIST_URL)
        assert res.status_code == 200
        assert len(res.data["results"]) == 3
        for row in res.data["results"]:
            assert set(row.keys()) == self.ALLOWED, set(row.keys()) ^ self.ALLOWED

    def test_retrieve_exposes_only_safe_fields(self):
        img1, _, _ = seed_library()
        res = auth_client("content_manager").get(detail_url(img1.pk))
        assert res.status_code == 200
        assert set(res.data.keys()) == self.ALLOWED


@pytest.mark.django_db
class MediaUploadUnchangedTest(TestCase):
    def test_upload_permission_unchanged(self):
        cases = [
            (None, 401),
            ("customer", 403),
            ("engineer", 403),
            ("content_manager", 201),
            ("website_admin", 201),
            ("super_admin", 201),
        ]
        for role, expected in cases:
            res = auth_client(role).post(
                "/api/v1/media/upload/",
                {"file": make_upload_image(), "subfolder": "general"},
                format="multipart",
            )
            assert res.status_code == expected, "upload as %r: %s" % (role, res.status_code)

    def test_upload_validation_unchanged(self):
        client = auth_client("content_manager")
        svg = SimpleUploadedFile("evil.svg", b"<svg onload=alert(1)>", content_type="image/svg+xml")
        assert client.post("/api/v1/media/upload/", {"file": svg}, format="multipart").status_code == 400
        fake = SimpleUploadedFile("fake.png", b"not-an-image", content_type="image/png")
        assert client.post("/api/v1/media/upload/", {"file": fake}, format="multipart").status_code == 400
        bad_pdf = SimpleUploadedFile("bad.pdf", b"not a pdf at all", content_type="application/pdf")
        assert client.post("/api/v1/media/upload/", {"file": bad_pdf}, format="multipart").status_code == 400


@pytest.mark.django_db
class MediaReuseTest(TestCase):
    def test_one_file_referenced_by_multiple_consumers(self):
        img, _, pdf = seed_library()
        cat = make_category(slug="reuse-cat")
        p1 = make_product(sku="REUSE-1", cat=cat)
        make_tr(p1)
        p2 = make_product(sku="REUSE-2", cat=cat)
        make_tr(p2)
        before = MediaFile.objects.count()
        ProductImage.objects.create(product=p1, media_file=img, sort_order=0, is_cover=True)
        ProductImage.objects.create(product=p2, media_file=img, sort_order=0, is_cover=True)
        ProductDocument.objects.create(
            product=p1, media_file=pdf, title="Doc", doc_type="datasheet",
            sort_order=0, is_active=True, description="",
        )
        HomepageVisual.objects.create(image=img, alt="v", order=0, enabled=True, link_url="")
        p1.og_image = img
        p1.save()
        # No new MediaFile rows, no binary copy: same stored file name.
        assert MediaFile.objects.count() == before
        img.refresh_from_db()
        assert ProductImage.objects.filter(media_file=img).count() == 2
        assert set(
            ProductImage.objects.filter(media_file=img).values_list("product__sku", flat=True)
        ) == {"REUSE-1", "REUSE-2"}
        assert HomepageVisual.objects.filter(image=img).count() == 1

    def test_existing_media_intact_after_attachment(self):
        img, _, _ = seed_library()
        stored_name = img.file.name
        p = make_product(sku="REUSE-3")
        make_tr(p)
        ProductImage.objects.create(product=p, media_file=img, sort_order=0, is_cover=True)
        img.refresh_from_db()
        assert img.file.name == stored_name
        assert img.original_name == "packshot-alpha.png"

    def test_invalid_media_id_rejected_on_product_write(self):
        cat = make_category(slug="reuse-cat-2")
        client = auth_client("content_manager")
        payload = {
            "sku": "REUSE-BAD",
            "category": str(cat.pk),
            "status": "draft",
            "visibility": "public",
            "is_active": True,
            "translations": {"fa": {"title": "ت", "slug": "reuse-bad"}},
            "images_data": [{"media_file": "00000000-0000-0000-0000-000000000000", "is_cover": True, "sort_order": 0}],
        }
        res = client.post("/api/v1/admin/products/", payload, format="json")
        assert res.status_code == 400

    def test_incompatible_type_rejected_for_documents(self):
        img, _, _ = seed_library()
        p = make_product(sku="REUSE-4")
        doc = ProductDocument(product=p, media_file=img, title="Bad", doc_type="catalog")
        from django.core.exceptions import ValidationError
        with pytest.raises(ValidationError):
            doc.full_clean()

    def test_document_file_accepted_for_documents(self):
        _, _, pdf = seed_library()
        p = make_product(sku="REUSE-5")
        doc = ProductDocument(
            product=p, media_file=pdf, title="Good", doc_type="catalog",
            sort_order=0, is_active=True, description="",
        )
        doc.full_clean()
        doc.save()
        assert doc.pk is not None


@pytest.mark.django_db
class MediaDeleteUnchangedTest(TestCase):
    def test_delete_permission_matrix_unchanged(self):
        img, _, _ = seed_library()
        cases = [
            (None, 401),
            ("customer", 403),
            ("engineer", 403),
            ("content_manager", 403),
            ("website_admin", 204),
        ]
        for role, expected in cases:
            target = img if role != "website_admin" else make_image_file(name="del-%s.png" % (role or "anon"))
            res = auth_client(role).delete(detail_url(target.pk))
            assert res.status_code == expected, "delete as %r: %s" % (role, res.status_code)

    def test_super_admin_delete_still_works(self):
        img, _, _ = seed_library()
        res = auth_client("super_admin").delete(detail_url(img.pk))
        assert res.status_code == 204
        assert not MediaFile.objects.filter(pk=img.pk).exists()

    def test_get_does_not_mutate(self):
        img, _, _ = seed_library()
        before = MediaFile.objects.count()
        res = auth_client("content_manager").get(detail_url(img.pk))
        assert res.status_code == 200
        assert MediaFile.objects.count() == before
