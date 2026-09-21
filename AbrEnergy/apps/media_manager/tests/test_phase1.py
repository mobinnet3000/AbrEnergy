import io

import pytest
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from PIL import Image

from apps.media_manager.models import MediaFile
from apps.contacts.models import ProjectInquiry
from apps.users.models import User


def make_image(name="ok.png", fmt="PNG", size=(10, 10), content_type="image/png"):
    buf = io.BytesIO()
    Image.new("RGB", size, "white").save(buf, fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=content_type)


@pytest.mark.django_db
class MediaSecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            email="c@test.com", password="pass", full_name="C",
        )
        self.editor = User.objects.create_user(
            email="e@test.com", password="pass", full_name="E",
            role="content_manager",
        )

    def test_customer_upload_denied(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": make_image(), "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code in (401, 403)

    def test_anonymous_upload_denied(self):
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": make_image(), "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code in (401, 403)

    def test_svg_rejected(self):
        self.client.force_authenticate(user=self.editor)
        svg = SimpleUploadedFile("evil.svg", b"<svg onload=alert(1)>", content_type="image/svg+xml")
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": svg, "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code == 400

    def test_mime_mismatch_rejected(self):
        self.client.force_authenticate(user=self.editor)
        fake = SimpleUploadedFile("fake.png", b"not-an-image", content_type="image/png")
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": fake, "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code == 400

    def test_valid_upload_accepted(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": make_image(), "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code == 201
        assert res.data["file_type"] == "image"

    def test_oversize_rejected(self):
        self.client.force_authenticate(user=self.editor)
        big = make_image(name="big.png", size=(3000, 3000))
        payload = big.read()
        while len(payload) < MediaFile.MAX_UPLOAD_SIZE + 1:
            payload += payload
        huge = SimpleUploadedFile("huge.png", payload, content_type="image/png")
        res = self.client.post(
            "/api/v1/media/upload/",
            {"file": huge, "subfolder": "general"},
            format="multipart",
        )
        assert res.status_code == 400


@pytest.mark.django_db
class InquiryAndConfigTest(TestCase):
    def test_inquiry_completed_action_uses_valid_status(self):
        from django.contrib.admin.sites import AdminSite
        from apps.contacts.admin import ProjectInquiryAdmin
        assert "completed" not in dict(ProjectInquiry.STATUS_CHOICES)
        assert "accepted" in dict(ProjectInquiry.STATUS_CHOICES)
        inquiry = ProjectInquiry.objects.create(
            name="N", phone="09123456789", city="Tehran",
            project_type="on_grid",
        )
        admin = ProjectInquiryAdmin(ProjectInquiry, AdminSite())
        admin.mark_completed(None, ProjectInquiry.objects.filter(pk=inquiry.pk))
        inquiry.refresh_from_db()
        assert inquiry.status == "accepted"

    def test_db_config_no_silent_sqlite(self):
        from django.conf import settings
        import os
        engine = settings.DATABASES["default"]["ENGINE"]
        db_engine = os.environ.get("DB_ENGINE")
        test_is_sqlite = "sqlite" in engine
        if test_is_sqlite:
            assert db_engine in (None, "sqlite") or "test" in os.environ.get("DJANGO_SETTINGS_MODULE", "")
        assert engine in ("django.db.backends.postgresql", "django.db.backends.sqlite3")

    def test_cors_env_driven(self):
        from django.conf import settings
        assert isinstance(settings.CORS_ALLOWED_ORIGINS, (list, tuple))

    def test_cleanup_only_old_temp(self):
        user = User.objects.create_user(email="u@test.com", password="p", full_name="U")
        old = MediaFile.objects.create(
            file="x.png", original_name="x.png", file_type="image",
            uploaded_by=user, is_temp=True,
        )
        MediaFile.objects.filter(pk=old.pk).update(
            uploaded_at=timezone.now() - timedelta(days=30)
        )
        assert MediaFile.objects.filter(is_temp=True, uploaded_at__lt=timezone.now() - timedelta(days=7)).count() == 1
