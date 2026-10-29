import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.users.choices import UserRole
from apps.core.models import SiteSettings, SeoKeyword

User = get_user_model()


@pytest.fixture
def make_user(db):
    def _make(role, email=None):
        if not email:
            email = f"user_{role}_{User.objects.count()}@example.com"
        return User.objects.create_user(
            email=email,
            password="StrongPassword123!",
            role=role,
            full_name=f"Test {role}",
            is_active=True,
        )
    return _make


@pytest.mark.django_db
class TestPhase1229AddressAndSecurity:
    """Tests for Phase 12.29 Site Settings address localization, validation & XSS protection."""

    def test_address_validation_rejects_insecure_map_url(self, make_user):
        admin = make_user(UserRole.SUPER_ADMIN)
        client = APIClient()
        client.force_authenticate(user=admin)

        # Insecure javascript: url should be rejected
        res = client.patch(
            "/api/v1/admin/site-config/",
            {"map_url": "javascript:alert(1)"},
            format="json",
        )
        assert res.status_code == 400
        errors = res.data.get("errors") or res.data
        assert "map_url" in errors

        # Plain http: should be rejected
        res = client.patch(
            "/api/v1/admin/site-config/",
            {"map_url": "http://maps.google.com"},
            format="json",
        )
        assert res.status_code == 400
        errors = res.data.get("errors") or res.data
        assert "map_url" in errors

        # Valid https: URL should be accepted
        res = client.patch(
            "/api/v1/admin/site-config/",
            {"map_url": "https://maps.google.com/?q=35.6892,51.3890"},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["map_url"] == "https://maps.google.com/?q=35.6892,51.3890"

    def test_address_sanitizes_html_tags_xss(self, make_user):
        admin = make_user(UserRole.SUPER_ADMIN)
        client = APIClient()
        client.force_authenticate(user=admin)

        res = client.patch(
            "/api/v1/admin/site-config/",
            {
                "address": "Tehran, No. 12 <script>alert('xss')</script> Azadi St.",
                "city": "Tehran",
                "province": "Tehran",
                "postal_code": "12345-67890",
            },
            format="json",
        )
        assert res.status_code == 200
        assert "<script>" not in res.data["address"]
        assert "</script>" not in res.data["address"]
        assert "Azadi St." in res.data["address"]
        assert res.data["postal_code"] == "12345-67890"

        # Check public endpoint returns the sanitized address
        public_client = APIClient()
        pub_res = public_client.get("/api/v1/site-config/")
        assert pub_res.status_code == 200
        assert "<script>" not in pub_res.data["address"]


@pytest.mark.django_db
class TestPhase1229SeoAndGeoEndpoints:
    """Tests for Phase 12.29 SEO & GEO Overview and Keyword Management endpoints."""

    def test_seo_overview_accessible_to_seo_manager_and_super_admin(self, make_user):
        seo_mgr = make_user(UserRole.SEO_MANAGER)
        client = APIClient()
        client.force_authenticate(user=seo_mgr)

        res = client.get("/api/v1/admin/seo/overview/")
        assert res.status_code == 200
        assert "overview" in res.data
        assert "health_score" in res.data
        assert "gsc_integration" in res.data
        assert "geo_ai_readiness" in res.data
        # GSC is transparently marked as ready_for_credentials, not fake connected
        assert res.data["gsc_integration"]["is_connected"] is False
        assert res.data["gsc_integration"]["status"] == "ready_for_credentials"

    def test_seo_overview_denied_to_unauthorized_roles(self, make_user):
        cust = make_user(UserRole.CUSTOMER)
        client = APIClient()
        client.force_authenticate(user=cust)

        res = client.get("/api/v1/admin/seo/overview/")
        assert res.status_code == 403

    def test_seo_keyword_crud_and_csv_export(self, make_user):
        seo_mgr = make_user(UserRole.SEO_MANAGER)
        client = APIClient()
        client.force_authenticate(user=seo_mgr)

        # 1. Create keyword
        res = client.post(
            "/api/v1/admin/seo/keywords/",
            {
                "keyword": "خرید پنل خورشیدی صنعتی",
                "locale": "fa",
                "target_country": "IR",
                "target_page": "/products",
                "search_intent": "commercial",
                "priority": "high",
            },
            format="json",
        )
        assert res.status_code == 201
        kw_id = res.data["id"]
        assert res.data["keyword"] == "خرید پنل خورشیدی صنعتی"

        # 2. List keywords with filter
        list_res = client.get("/api/v1/admin/seo/keywords/?priority=high")
        assert list_res.status_code == 200
        assert len(list_res.data["results"]) >= 1

        # 3. Export CSV
        export_res = client.get("/api/v1/admin/seo/keywords/export/")
        assert export_res.status_code == 200
        assert "text/csv" in export_res["Content-Type"]
        content = export_res.content.decode("utf-8-sig")
        assert "خرید پنل خورشیدی صنعتی" in content
        assert "commercial" in content

        # 4. Analyst has read-only access (can list & export, cannot delete)
        analyst = make_user(UserRole.ANALYST)
        client.force_authenticate(user=analyst)
        assert client.get("/api/v1/admin/seo/keywords/").status_code == 200
        assert client.delete(f"/api/v1/admin/seo/keywords/{kw_id}/").status_code == 403
