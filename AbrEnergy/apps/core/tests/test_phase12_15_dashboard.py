"""Phase 12.15 tests: CMS dashboard overview aggregate endpoint.

Covers the staff-only permission matrix, the aggregate response shape, that
every value is computed from real rows (no hardcoded/demo metric), the
"needs attention" incomplete-content counters, and that the aggregate stays
query-efficient (bounded COUNT queries, no N+1 over the dataset).
"""

import pytest
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.test import APIClient

from apps.products.models import ProductDocument, ProductImage
from apps.products.tests.test_phase2 import (
    make_category,
    make_image_file,
    make_pdf_file,
    make_product,
    make_tr,
)
from apps.users.models import User


OVERVIEW = "/api/v1/admin/dashboard/overview/"
STATS = "/api/v1/admin/dashboard/stats/"


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="p", full_name="T", role=role
    )


def auth_client(role):
    client = APIClient()
    client.force_authenticate(user=make_user("%s@t.test" % role, role))
    return client


@pytest.mark.django_db
class DashboardOverviewPermissionTest(TestCase):
    def test_anonymous_denied(self):
        res = APIClient().get(OVERVIEW)
        assert res.status_code in (401, 403), res.status_code

    def test_customer_and_engineer_denied(self):
        for role in ("customer", "engineer"):
            res = auth_client(role).get(OVERVIEW)
            assert res.status_code == 403, (role, res.status_code)

    def test_content_manager_allowed(self):
        res = auth_client("content_manager").get(OVERVIEW)
        assert res.status_code == 200, res.content[:500]

    def test_website_admin_and_super_admin_allowed(self):
        for role in ("website_admin", "super_admin"):
            res = auth_client(role).get(OVERVIEW)
            assert res.status_code == 200, (role, res.status_code)

    def test_superadmin_stats_stays_restricted_from_content_manager(self):
        # The pre-existing aggregate stays super-admin only; content managers
        # use the new aggregate instead.
        res = auth_client("content_manager").get(STATS)
        assert res.status_code == 403


@pytest.mark.django_db
class DashboardOverviewContentTest(TestCase):
    def _data(self):
        res = auth_client("content_manager").get(OVERVIEW)
        assert res.status_code == 200, res.content[:500]
        return res.json()

    def test_response_shape(self):
        data = self._data()
        for key in (
            "products",
            "product_categories",
            "articles",
            "services",
            "projects",
            "gallery",
            "media",
            "documents",
            "generated_at",
        ):
            assert key in data, key
        for key in (
            "total",
            "published",
            "draft",
            "hidden",
            "without_image",
            "without_document",
            "without_seo_title",
        ):
            assert key in data["products"], key

    def test_counts_are_computed_from_real_rows(self):
        cat = make_category(slug="phase-1215-cat")
        # Product WITH cover image and WITH a document.
        complete = make_product(sku="P-COMPLETE", cat=cat, status="published")
        make_tr(complete)
        img = make_image_file(name="cover.png")
        ProductImage.objects.create(product=complete, media_file=img, is_cover=True)
        ProductDocument.objects.create(
            product=complete, media_file=make_pdf_file(), title="Catalog"
        )
        # Product WITHOUT image and WITHOUT document.
        incomplete = make_product(sku="P-INCOMPLETE", cat=cat, status="draft")
        make_tr(incomplete)

        data = self._data()
        assert data["products"]["total"] == 2
        assert data["products"]["published"] == 1
        assert data["products"]["draft"] == 1
        assert data["products"]["without_image"] == 1
        assert data["products"]["without_document"] == 1
        assert data["product_categories"]["total"] == 1
        assert data["product_categories"]["active"] == 1
        assert data["documents"]["total"] == 1

    def test_empty_database_returns_zeroes_not_errors(self):
        data = self._data()
        assert data["products"]["total"] == 0
        assert data["media"]["total"] == 0
        assert data["gallery"]["images"] == 0

    def test_aggregate_is_query_bounded(self):
        make_product(sku="P-Q")
        with CaptureQueriesContext(connection) as ctx:
            res = auth_client("super_admin").get(OVERVIEW)
        assert res.status_code == 200
        # ~24 fixed COUNT queries; guard against a regression to per-row
        # Python-side counting (which would scale with the dataset).
        assert len(ctx.captured_queries) < 40, len(ctx.captured_queries)
