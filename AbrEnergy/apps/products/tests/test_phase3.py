import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import Product, ProductCategory
from apps.products.translation_models import ProductCategoryTranslation, ProductTranslation
from apps.users.models import User


def make_category(slug, title="دسته", parent=None, active=True, featured=False, order=0):
    cat = ProductCategory.objects.create(
        slug=slug, parent=parent, sort_order=order,
        is_active=active, is_featured=featured,
    )
    ProductCategoryTranslation.objects.create(category=cat, language="fa", title=title)
    return cat


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="pass12345", full_name="T", role=role,
    )


@pytest.mark.django_db
class AdminCategoryFilterTest(TestCase):
    def setUp(self):
        self.editor = make_user("ed3@test.com", "content_manager")
        self.client = APIClient()
        self.client.force_authenticate(user=self.editor)
        self.parent = make_category("p3-parent", title="والد ویژه", featured=True, order=1)
        make_category("p3-child", title="فرزند خاص", parent=self.parent, order=2)
        make_category("p3-hidden", title="مخفی", active=False, order=3)

    def _results(self, res):
        assert res.status_code == 200
        data = res.data
        return data["results"] if isinstance(data, dict) and "results" in data else data

    def test_filter_is_active(self):
        rows = self._results(self.client.get("/api/v1/admin/product-categories/?is_active=false"))
        assert {r["slug"] for r in rows} == {"p3-hidden"}

    def test_filter_is_featured(self):
        rows = self._results(self.client.get("/api/v1/admin/product-categories/?is_featured=true"))
        assert [r["slug"] for r in rows] == ["p3-parent"]

    def test_filter_parent(self):
        rows = self._results(self.client.get(f"/api/v1/admin/product-categories/?parent={self.parent.id}"))
        assert [r["slug"] for r in rows] == ["p3-child"]

    def test_search_translated_title(self):
        rows = self._results(self.client.get("/api/v1/admin/product-categories/?search=فرزند"))
        assert [r["slug"] for r in rows] == ["p3-child"]

    def test_customer_cannot_list(self):
        customer = make_user("cust3@test.com", "customer")
        c = APIClient()
        c.force_authenticate(user=customer)
        res = c.get("/api/v1/admin/product-categories/")
        assert res.status_code in (401, 403)


@pytest.mark.django_db
class AdminCategoryDetailFieldsTest(TestCase):
    def test_detail_exposes_form_fields(self):
        editor = make_user("ed3b@test.com", "content_manager")
        c = APIClient()
        c.force_authenticate(user=editor)
        cat = make_category("p3-detail", title="جزئیات")
        res = c.get(f"/api/v1/admin/product-categories/{cat.id}/")
        assert res.status_code == 200
        for field in ("slug_t", "meta_title", "meta_description", "cover",
                      "cover_image_url", "og_image", "og_image_url",
                      "seo_title", "canonical_url", "robots"):
            assert field in res.data, field


@pytest.mark.django_db
class DashboardProductCountsTest(TestCase):
    def test_stats_include_product_overview(self):
        admin = make_user("sup3@test.com", "super_admin")
        cat = make_category("p3-dash", title="داشبورد")
        p1 = Product.objects.create(sku="DASH-1", category=cat, status="published", is_featured=True)
        ProductTranslation.objects.create(product=p1, language="fa", title="یک", slug="dash-1")
        p2 = Product.objects.create(sku="DASH-2", category=cat, status="draft")
        ProductTranslation.objects.create(product=p2, language="fa", title="دو", slug="dash-2")
        c = APIClient()
        c.force_authenticate(user=admin)
        res = c.get("/api/v1/admin/dashboard/stats/")
        assert res.status_code == 200
        assert res.data["total_product_categories"] >= 1
        assert res.data["total_products"] >= 2
        assert res.data["published_products"] >= 1
        assert res.data["draft_products"] >= 1
        assert res.data["featured_products"] >= 1
