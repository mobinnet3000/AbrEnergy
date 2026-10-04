"""Phase 8.1 regression tests: token-gated preview (saved-but-hidden only).

Covers the security test matrix at the API level:

- issue: anonymous 401/403, customer 403, engineer 403,
  content_manager/super_admin/website_admin success, request validation.
- consume: valid token success (homepage + product + category),
  missing/tampered/expired/wrong-resource/wrong-id/wrong-purpose rejected.
- isolation: normal public routes ignore preview tokens and keep their
  exact publication filtering; preview responses are ``no-store``.
"""
import uuid

import pytest
from django.core import signing
from django.test import TestCase
from rest_framework.test import APIClient

from apps.homepage.models import HomepageCategory, HomepageFeaturedProduct
from apps.homepage.preview_tokens import (
    PREVIEW_MAX_AGE_SECONDS,
    PREVIEW_SALT,
    PreviewTokenError,
    verify_preview_token,
)
from apps.products.tests.test_phase2 import (
    make_category,
    make_cat_tr,
    make_product,
    make_tr,
)
from apps.users.models import User


ISSUE = "/api/v1/admin/homepage/preview-tokens/"
HP_PREVIEW = "/api/v1/admin/homepage/preview/"
HP_PUBLIC = "/api/v1/homepage/"
PRODUCTS_PUBLIC = "/api/v1/products/"


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="p", full_name="T", role=role
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def issue_token(client, resource_type, resource_id="", locale="fa"):
    res = client.post(
        ISSUE,
        {"resource_type": resource_type, "resource_id": resource_id, "locale": locale},
        format="json",
    )
    assert res.status_code == 200, res.data
    return res.data["token"]


@pytest.mark.django_db
class PreviewIssuePermissionTest(TestCase):
    def test_anonymous_issue_unauthorized(self):
        res = APIClient().post(ISSUE, {"resource_type": "homepage"}, format="json")
        assert res.status_code in (401, 403)

    def test_customer_issue_forbidden(self):
        client = auth_client(make_user("pv-customer@t.com", "customer"))
        res = client.post(ISSUE, {"resource_type": "homepage"}, format="json")
        assert res.status_code == 403

    def test_engineer_issue_forbidden(self):
        client = auth_client(make_user("pv-engineer@t.com", "engineer"))
        res = client.post(ISSUE, {"resource_type": "homepage"}, format="json")
        assert res.status_code == 403

    def test_content_manager_issue_success(self):
        client = auth_client(make_user("pv-editor@t.com", "content_manager"))
        res = client.post(
            ISSUE, {"resource_type": "homepage", "locale": "fa"}, format="json"
        )
        assert res.status_code == 200, res.data
        assert res.data["token"]
        assert res.data["expires_in"] == PREVIEW_MAX_AGE_SECONDS

    def test_privileged_roles_issue_success(self):
        for role, email in (
            ("super_admin", "pv-super@t.com"),
            ("website_admin", "pv-web@t.com"),
        ):
            client = auth_client(make_user(email, role))
            res = client.post(
                ISSUE, {"resource_type": "homepage", "locale": "fa"}, format="json"
            )
            assert res.status_code == 200, (role, res.data)

    def test_issue_validation(self):
        client = auth_client(make_user("pv-valid@t.com", "content_manager"))
        res = client.post(ISSUE, {"resource_type": "nope"}, format="json")
        assert res.status_code == 400
        res = client.post(
            ISSUE, {"resource_type": "homepage", "locale": "xx"}, format="json"
        )
        assert res.status_code == 400
        res = client.post(
            ISSUE, {"resource_type": "product", "resource_id": ""}, format="json"
        )
        assert res.status_code == 400


@pytest.mark.django_db
class HomepagePreviewTest(TestCase):
    def setUp(self):
        self.editor = auth_client(make_user("pv-hp@t.com", "content_manager"))

    def test_valid_token_shows_hidden_saved_content(self):
        draft = make_product(sku="PV-DRAFT", status="draft")
        make_tr(draft, title="پیش‌نویس")
        hidden = make_product(sku="PV-HID", visibility="hidden")
        make_tr(hidden, title="مخفی")
        HomepageFeaturedProduct.objects.create(product=draft, order=0)
        HomepageFeaturedProduct.objects.create(product=hidden, order=1)
        inactive_cat = make_category(slug="pv-inactive", active=False)
        make_cat_tr(inactive_cat, title="غیرفعال")
        HomepageCategory.objects.create(category=inactive_cat, order=0)

        public = APIClient().get(HP_PUBLIC)
        assert public.status_code == 200
        assert "preview" not in public.data
        assert [p["sku"] for p in public.data["featured_products"]] == []

        token = issue_token(self.editor, "homepage")
        res = APIClient().get(HP_PREVIEW, {"token": token})
        assert res.status_code == 200, res.data
        assert res.data.get("preview") is True
        assert res.headers.get("Cache-Control") == "no-store"
        assert [p["sku"] for p in res.data["featured_products"]] == [
            "PV-DRAFT",
            "PV-HID",
        ]
        assert "pv-inactive" in [c["slug"] for c in res.data["categories"]]

    def test_disabled_relation_row_visible_only_in_preview(self):
        p = make_product(sku="PV-DIS")
        make_tr(p, title="غیرفعال‌ردیفی")
        HomepageFeaturedProduct.objects.create(product=p, order=0, enabled=False)
        public = APIClient().get(HP_PUBLIC)
        assert [x["sku"] for x in public.data["featured_products"]] == []
        token = issue_token(self.editor, "homepage")
        res = APIClient().get(HP_PREVIEW, {"token": token})
        assert [x["sku"] for x in res.data["featured_products"]] == ["PV-DIS"]

    def test_missing_token_rejected(self):
        res = APIClient().get(HP_PREVIEW)
        assert res.status_code == 403

    def test_tampered_token_rejected(self):
        token = issue_token(self.editor, "homepage")
        res = APIClient().get(HP_PREVIEW, {"token": token + "x"})
        assert res.status_code == 403

    def test_wrong_resource_token_rejected(self):
        p = make_product(sku="PV-WR")
        make_tr(p, title="w")
        token = issue_token(self.editor, "product", resource_id=str(p.id))
        res = APIClient().get(HP_PREVIEW, {"token": token})
        assert res.status_code == 403

    def test_wrong_purpose_token_rejected(self):
        bad = signing.dumps(
            {"typ": "homepage", "id": "", "loc": "fa", "pur": "other"},
            salt=PREVIEW_SALT,
        )
        res = APIClient().get(HP_PREVIEW, {"token": bad})
        assert res.status_code == 403

    def test_expired_token_rejected_at_unit_level(self):
        token = issue_token(self.editor, "homepage")
        with pytest.raises(PreviewTokenError):
            verify_preview_token(token, expected_type="homepage", max_age=-1)

    def test_wrong_locale_binding_rejected_at_unit_level(self):
        token = issue_token(self.editor, "homepage", locale="fa")
        with pytest.raises(PreviewTokenError):
            verify_preview_token(token, expected_type="homepage", expected_locale="ar")

    def test_public_homepage_ignores_preview_token(self):
        draft = make_product(sku="PV-IGN", status="draft")
        make_tr(draft, title="نادیده")
        HomepageFeaturedProduct.objects.create(product=draft, order=0)
        token = issue_token(self.editor, "homepage")
        res = APIClient().get(HP_PUBLIC, {"token": token})
        assert res.status_code == 200
        assert "preview" not in res.data
        assert [p["sku"] for p in res.data["featured_products"]] == []

    def test_public_product_routes_ignore_preview_token(self):
        draft = make_product(sku="PV-IGN2", status="draft")
        tr = make_tr(draft, title="نادیده۲")
        token = issue_token(self.editor, "product", resource_id=str(draft.id))
        res = APIClient().get(PRODUCTS_PUBLIC, {"preview_token": token, "token": token})
        assert res.status_code == 200
        assert "preview" not in res.data
        detail = APIClient().get(f"/api/v1/products/{tr.slug}/", {"token": token})
        assert detail.status_code == 404


@pytest.mark.django_db
class ProductCategoryPreviewTest(TestCase):
    def setUp(self):
        self.editor = auth_client(make_user("pv-pc@t.com", "content_manager"))

    def test_draft_product_preview(self):
        draft = make_product(sku="PV-PD", status="draft")
        tr = make_tr(draft, title="پیش‌نویس محصول")
        url = f"/api/v1/admin/products/{draft.id}/preview/"
        anon = APIClient()
        assert anon.get(url).status_code == 403
        token = issue_token(self.editor, "product", resource_id=str(draft.id))
        res = anon.get(url, {"token": token})
        assert res.status_code == 200, res.data
        assert res.data.get("preview") is True
        assert res.headers.get("Cache-Control") == "no-store"
        # Public detail still hides the draft even with the token attached.
        assert anon.get(f"/api/v1/products/{tr.slug}/", {"token": token}).status_code == 404

    def test_product_preview_wrong_id_rejected(self):
        a = make_product(sku="PV-PA")
        make_tr(a, title="a")
        b = make_product(sku="PV-PB")
        make_tr(b, title="b")
        token = issue_token(self.editor, "product", resource_id=str(a.id))
        res = APIClient().get(f"/api/v1/admin/products/{b.id}/preview/", {"token": token})
        assert res.status_code == 403

    def test_product_preview_missing_object_404(self):
        missing = uuid.uuid4()
        token = issue_token(self.editor, "product", resource_id=str(missing))
        res = APIClient().get(f"/api/v1/admin/products/{missing}/preview/", {"token": token})
        assert res.status_code == 404

    def test_inactive_category_preview(self):
        cat = make_category(slug="pv-cat-inactive", active=False)
        make_cat_tr(cat, title="دسته غیرفعال")
        url = f"/api/v1/admin/product-categories/{cat.id}/preview/"
        assert APIClient().get(f"/api/v1/product-categories/{cat.slug}/").status_code == 404
        token = issue_token(self.editor, "category", resource_id=str(cat.id))
        res = APIClient().get(url, {"token": token})
        assert res.status_code == 200, res.data
        assert res.data.get("preview") is True
        assert res.headers.get("Cache-Control") == "no-store"
