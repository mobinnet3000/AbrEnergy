import pytest
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.services.models import Service, ServiceTranslation
from apps.articles.models import Article, ArticleTranslation
from apps.gallery.models import GalleryCategory, GalleryImage
from apps.media_manager.models import MediaFile
from apps.products.models import Product, ProductCategory, ProductDocument
from apps.users.models import User


def make_user(email, role):
    return User.objects.create_user(email=email, password="password", full_name="Test", role=role)


@pytest.mark.django_db
class Phase1220ContentPublicationTest(TestCase):
    def test_inactive_service_detail_returns_404_for_anonymous(self):
        svc = Service.objects.create(status="inactive")
        ServiceTranslation.objects.create(service=svc, language="fa", title="خدمت غیرفعال", slug="svc-inactive")
        res = APIClient().get("/api/v1/services/svc-inactive/")
        assert res.status_code == 404

    def test_active_service_detail_returns_200_for_anonymous(self):
        svc = Service.objects.create(status="active")
        ServiceTranslation.objects.create(service=svc, language="fa", title="خدمت فعال", slug="svc-active")
        res = APIClient().get("/api/v1/services/svc-active/")
        assert res.status_code == 200
        assert res.data["slug"] == "svc-active"

    def test_draft_article_detail_returns_404_for_anonymous(self):
        art = Article.objects.create(status="draft")
        ArticleTranslation.objects.create(article=art, language="fa", title="مقاله پیش‌نویس", slug="art-draft")
        res = APIClient().get("/api/v1/articles/art-draft/")
        assert res.status_code == 404

    def test_published_article_detail_returns_200_for_anonymous(self):
        art = Article.objects.create(status="published")
        ArticleTranslation.objects.create(article=art, language="fa", title="مقاله منتشر شده", slug="art-published")
        res = APIClient().get("/api/v1/articles/art-published/")
        assert res.status_code == 200
        assert res.data["slug"] == "art-published"


@pytest.mark.django_db
class Phase1220MediaManagementTest(TestCase):
    def setUp(self):
        self.manager = make_user("manager@test.com", "content_manager")
        self.admin = make_user("admin@test.com", "website_admin")
        self.file = SimpleUploadedFile("sample.jpg", b"fake-content", content_type="image/jpeg")
        self.media = MediaFile.objects.create(
            file=self.file,
            original_name="sample.jpg",
            file_type="image",
            file_size=12,
            alt_text="Initial alt",
        )

    def test_media_detail_patch_alt_text(self):
        client = APIClient()
        client.force_authenticate(user=self.manager)
        res = client.patch(f"/api/v1/media/{self.media.id}/", {"alt_text": "Updated alt text"}, format="json")
        assert res.status_code == 200
        self.media.refresh_from_db()
        assert self.media.alt_text == "Updated alt text"

    def test_gallery_image_patch_metadata(self):
        cat = GalleryCategory.objects.create()
        img = GalleryImage.objects.create(
            category=cat,
            media_file=self.media,
            title="Old Title",
            alt_text="Old Alt",
            is_active=True,
        )
        client = APIClient()
        client.force_authenticate(user=self.admin)
        res = client.patch(
            f"/api/v1/admin/gallery/images/{img.id}/",
            {"title": "New Title", "is_active": False},
            format="json",
        )
        assert res.status_code == 200
        img.refresh_from_db()
        assert img.title == "New Title"
        assert img.is_active is False


@pytest.mark.django_db
class Phase1220PublicDocumentsTest(TestCase):
    def setUp(self):
        self.cat1 = ProductCategory.objects.create(slug="solar-packages")
        self.cat2 = ProductCategory.objects.create(slug="modular-supports")
        self.pdf = SimpleUploadedFile("catalog.pdf", b"%PDF-1.4 sample", content_type="application/pdf")
        self.media_pdf = MediaFile.objects.create(
            file=self.pdf,
            original_name="catalog.pdf",
            file_type="document",
            mime_type="application/pdf",
            file_size=1024,
        )
        self.prod_published = Product.objects.create(
            sku="SKU-PUB-01",
            category=self.cat1,
            status="published",
            visibility="public",
            is_active=True,
        )
        self.doc1 = ProductDocument.objects.create(
            product=self.prod_published,
            media_file=self.media_pdf,
            title="کاتالوگ نیروگاه خورشیدی",
            doc_type="catalog",
            is_active=True,
        )
        self.prod_draft = Product.objects.create(
            sku="SKU-DRAFT-01",
            category=self.cat2,
            status="draft",
            visibility="public",
            is_active=True,
        )
        self.doc_draft = ProductDocument.objects.create(
            product=self.prod_draft,
            media_file=self.media_pdf,
            title="پیش‌نویس کاتالوگ",
            doc_type="catalog",
            is_active=True,
        )

    def test_public_documents_endpoint_excludes_draft_and_inactive(self):
        res = APIClient().get("/api/v1/products/documents/")
        assert res.status_code == 200
        results = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        titles = [d["title"] for d in results]
        assert "کاتالوگ نیروگاه خورشیدی" in titles
        assert "پیش‌نویس کاتالوگ" not in titles

    def test_public_documents_category_filter(self):
        res = APIClient().get("/api/v1/products/documents/?category=solar-packages")
        assert res.status_code == 200
        results = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        assert len(results) == 1
        assert results[0]["title"] == "کاتالوگ نیروگاه خورشیدی"
        assert results[0]["file_size"] == 1024
        assert results[0]["doc_type"] == "catalog"
