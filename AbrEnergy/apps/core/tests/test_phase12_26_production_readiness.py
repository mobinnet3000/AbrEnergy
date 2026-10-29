import pytest
from django.core.exceptions import ImproperlyConfigured
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import AnonRateThrottle

from apps.core.api.v1.serializers.site import SiteSettingsPublicSerializer
from apps.media_manager.api.v1.serializers.media import MediaFileUploadSerializer
from apps.services.models import Service
from apps.services.translation_models import ServiceTranslation
from apps.users.choices import UserRole
from apps.users.models import User
from config.settings.base import assert_production_secret, DEFAULT_INSECURE_SECRET

pytestmark = pytest.mark.django_db


class TestPhase1226ProductionReadiness(TestCase):
    """
    Phase 12.26 — Production Configuration, Security & Deployment Readiness Tests
    """

    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_superuser(
            email="p1226_superadmin@test.com",
            password="strong-test-pass",
            full_name="Super Admin 1226",
        )
        self.customer = User.objects.create_user(
            email="p1226_customer@test.com",
            password="strong-test-pass",
            full_name="Customer User 1226",
            role=UserRole.CUSTOMER,
        )

    # ─────────────────────────────────────────────────────────────
    # 1. Production Secret-Key & Settings Guard
    # ─────────────────────────────────────────────────────────────

    def test_assert_production_secret_rejects_insecure_default(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            assert_production_secret(DEFAULT_INSECURE_SECRET)
        assert "SECRET_KEY is missing or still the insecure development default" in str(exc_info.value)

    def test_assert_production_secret_rejects_empty_secret(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            assert_production_secret("")
        assert "SECRET_KEY is missing or still the insecure development default" in str(exc_info.value)

    def test_assert_production_secret_accepts_strong_secret(self):
        strong_key = "django-insecure-prod-key-with-high-entropy-and-length-greater-than-50-characters"
        # Must not raise
        assert_production_secret(strong_key)

    # ─────────────────────────────────────────────────────────────
    # 2. Proxy Header Trust & Rate Limiting Identifiers
    # ─────────────────────────────────────────────────────────────

    def test_drf_rate_throttle_num_proxies_anti_spoofing(self):
        """
        Verify that with NUM_PROXIES=1, AnonRateThrottle extracts the IP appended
        by the trusted proxy, ignoring client-forged X-Forwarded-For prefixes.
        """
        factory = RequestFactory()

        class DummyAnonThrottle(AnonRateThrottle):
            rate = "100/hour"
            def get_rate(self):
                return self.rate

        throttle = DummyAnonThrottle()

        # Attacker injects a spoofed IP, proxy appends real client socket IP (203.0.113.50)
        request = factory.get(
            "/api/v1/site-config/",
            HTTP_X_FORWARDED_FOR="198.51.100.1, 203.0.113.50",
            REMOTE_ADDR="172.18.0.5",  # Nginx internal docker IP
        )

        ident = throttle.get_ident(request)
        # With NUM_PROXIES=1, DRF reads the last IP in X-Forwarded-For: 203.0.113.50
        assert ident == "203.0.113.50"
        assert ident != "198.51.100.1"

    # ─────────────────────────────────────────────────────────────
    # 3. Anonymous Content Isolation: Inactive Services
    # ─────────────────────────────────────────────────────────────

    def test_anonymous_service_list_excludes_inactive_services(self):
        active_svc = Service.objects.create(status="active")
        ServiceTranslation.objects.create(
            service=active_svc, language="fa", title="سرویس فعال", slug="active-service-p1226"
        )
        inactive_svc = Service.objects.create(status="inactive")
        ServiceTranslation.objects.create(
            service=inactive_svc, language="fa", title="سرویس غیرفعال", slug="inactive-service-p1226"
        )

        res = self.client.get("/api/v1/services/")
        assert res.status_code == status.HTTP_200_OK

        results = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        slugs = [s.get("slug") for s in results]
        assert "active-service-p1226" in slugs
        assert "inactive-service-p1226" not in slugs

    # ─────────────────────────────────────────────────────────────
    # 4. Token Privilege Isolation: Customer cannot access Admin
    # ─────────────────────────────────────────────────────────────

    def test_authenticated_customer_cannot_bypass_admin_authorization(self):
        self.client.force_authenticate(user=self.customer)

        admin_endpoints = [
            "/api/v1/admin/users/",
            "/api/v1/admin/dashboard/stats/",
            "/api/v1/admin/site-config/",
        ]
        for ep in admin_endpoints:
            res = self.client.get(ep)
            assert res.status_code in (
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ), f"Endpoint {ep} allowed customer access with status {res.status_code}"

    # ─────────────────────────────────────────────────────────────
    # 5. Media Upload Security: Executables and Corrupt PDFs Rejected
    # ─────────────────────────────────────────────────────────────

    def test_media_upload_rejects_executable_extension(self):
        script_file = SimpleUploadedFile("exploit.php", b"<?php phpinfo(); ?>", content_type="application/x-php")
        serializer = MediaFileUploadSerializer(data={"file": script_file})
        assert not serializer.is_valid()
        assert "file" in serializer.errors

    def test_media_upload_rejects_fake_pdf_header(self):
        fake_pdf = SimpleUploadedFile("fake.pdf", b"NOT_A_REAL_PDF_CONTENT", content_type="application/pdf")
        serializer = MediaFileUploadSerializer(data={"file": fake_pdf})
        assert not serializer.is_valid()
        assert "file" in serializer.errors

    def test_media_upload_accepts_valid_pdf_magic_bytes(self):
        valid_pdf = SimpleUploadedFile("real.pdf", b"%PDF-1.4 valid dummy pdf", content_type="application/pdf")
        serializer = MediaFileUploadSerializer(data={"file": valid_pdf})
        assert serializer.is_valid(), serializer.errors
