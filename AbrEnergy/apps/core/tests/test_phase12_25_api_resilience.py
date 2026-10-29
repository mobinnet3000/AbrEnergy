import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import AnonRateThrottle

pytestmark = pytest.mark.django_db


class TestPhase1225ApiResilience:
    """
    Phase 12.25 — Public API & SSR Resilience Regression Suite
    Verifies that all public endpoints are accessible anonymously,
    authenticated/staff-only endpoints strictly reject unauthenticated calls,
    throttling behavior produces 429 with Retry-After headers, and
    no private/unpublished content leaks to anonymous clients.
    """

    def test_anonymous_public_read_endpoints_accessible(self):
        client = APIClient()
        endpoints = [
            "/api/v1/health/",
            "/api/v1/site-config/",
            "/api/v1/homepage/",
            "/api/v1/products/",
            "/api/v1/product-categories/",
            "/api/v1/products/featured/",
            "/api/v1/services/",
            "/api/v1/projects/",
            "/api/v1/articles/",
            "/api/v1/gallery/",
            "/api/v1/products/documents/",
        ]
        for ep in endpoints:
            response = client.get(ep)
            assert response.status_code == status.HTTP_200_OK, (
                f"Public endpoint {ep} failed with status {response.status_code}"
            )

    def test_authenticated_endpoints_reject_anonymous(self):
        client = APIClient()
        private_endpoints = [
            "/api/v1/admin/dashboard/stats/",
            "/api/v1/admin/dashboard/overview/",
            "/api/v1/admin/users/",
            "/api/v1/notifications/",
            "/api/v1/users/me/",
        ]
        for ep in private_endpoints:
            response = client.get(ep)
            assert response.status_code in (
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ), f"Protected endpoint {ep} did not reject anonymous call: {response.status_code}"

    def test_throttle_produces_429_with_retry_after(self):
        """
        Verify that when AnonRateThrottle triggers, the response is HTTP 429
        and includes a numeric 'Retry-After' header.
        """
        from rest_framework.views import APIView
        from rest_framework.response import Response

        class SimulatedAnonThrottle(AnonRateThrottle):
            rate = "100/hour"

            def allow_request(self, request, view):
                return False

            def wait(self):
                return 120

        class MockThrottledView(APIView):
            throttle_classes = [SimulatedAnonThrottle]
            permission_classes = []

            def get(self, request):
                return Response({"ok": True})

        from django.test import RequestFactory
        factory = RequestFactory()
        req = factory.get("/api/v1/mock-throttled/")
        view = MockThrottledView.as_view()
        response = view(req)

        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Retry-After" in response.headers
        assert response.headers["Retry-After"] == "120"
        # DRF custom exception handler nests under 'errors'
        error_dict = response.data.get("errors", response.data)
        assert "detail" in error_dict

    def test_anonymous_requests_never_leak_draft_or_hidden_products(self):
        from apps.products.models import Product, ProductCategory
        from apps.products.translation_models import ProductTranslation, ProductCategoryTranslation

        cat = ProductCategory.objects.create(
            slug="resilience-test-cat",
            is_active=True,
        )
        ProductCategoryTranslation.objects.create(
            category=cat,
            language="fa",
            title="دسته آزمایشی پایداری",
        )

        p_draft = Product.objects.create(
            sku="SKU-DRAFT-RESIL",
            category=cat,
            status="draft",
            visibility="public",
            is_active=True,
        )
        ProductTranslation.objects.create(
            product=p_draft,
            language="fa",
            title="محصول پیش‌نویس",
            slug="private-draft-product",
        )

        p_pub = Product.objects.create(
            sku="SKU-PUB-RESIL",
            category=cat,
            status="published",
            visibility="public",
            is_active=True,
        )
        ProductTranslation.objects.create(
            product=p_pub,
            language="fa",
            title="محصول عمومی فعال",
            slug="active-public-product",
        )

        client = APIClient()
        response = client.get("/api/v1/products/")
        assert response.status_code == status.HTTP_200_OK

        results = response.data.get("results", []) if isinstance(response.data, dict) else response.data
        slugs = [p.get("slug") for p in results]

        assert "active-public-product" in slugs
        assert "private-draft-product" not in slugs
