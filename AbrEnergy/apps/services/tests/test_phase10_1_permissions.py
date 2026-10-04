"""Phase 10.1 regression tests: Services permission contract (E-01 / I-01).

Resolved architecture (OPTION A): Service writes are content work, gated by
the existing ``IsContentManager`` abstraction (super_admin / website_admin /
content_manager) — the same gate as Products, Product Categories, Articles,
Homepage, and Media upload/list. Reads stay ``AllowAny``. Engineer, customer,
and anonymous callers remain denied on writes.

Covers the full role matrix against the real view/URL stack:
anonymous / customer / engineer / content_manager / website_admin /
super_admin x read-list / read-detail / create / update / delete.
"""

import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.services.models import Service
from apps.services.translation_models import ServiceTranslation
from apps.users.models import User


ADMIN_LIST = "/api/v1/admin/services/"
PUBLIC_LIST = "/api/v1/services/"


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="p", full_name="T", role=role
    )


def make_service(title="خدمت", slug="svc-perm", status="active"):
    svc = Service.objects.create(status=status)
    ServiceTranslation.objects.create(
        service=svc, language="fa", title=title, slug=slug
    )
    return svc


def service_payload(slug):
    return {
        "status": "active",
        "translations": {"fa": {"title": "خدمت %s" % slug, "slug": slug}},
    }


def auth_client(email, role):
    client = APIClient()
    client.force_authenticate(user=make_user(email, role))
    return client


@pytest.mark.django_db
class ServiceReadPermissionTest(TestCase):
    def test_anonymous_list_read_unchanged(self):
        make_service()
        res = APIClient().get(PUBLIC_LIST)
        assert res.status_code == 200, res.content[:500]

    def test_anonymous_admin_list_read_unchanged(self):
        make_service()
        res = APIClient().get(ADMIN_LIST)
        assert res.status_code == 200, res.content[:500]

    def test_anonymous_detail_read_unchanged(self):
        make_service(slug="svc-pub-read")
        res = APIClient().get(PUBLIC_LIST + "svc-pub-read/")
        assert res.status_code == 200, res.content[:500]


@pytest.mark.django_db
class ServiceWriteDeniedTest(TestCase):
    def test_anonymous_create_denied(self):
        res = APIClient().post(ADMIN_LIST, service_payload("svc-anon"), format="json")
        assert res.status_code == 401, res.content[:500]
        assert Service.objects.count() == 0

    def test_anonymous_update_denied(self):
        svc = make_service(slug="svc-anon-upd")
        res = APIClient().patch(
            ADMIN_LIST + str(svc.id) + "/", {"order": 3}, format="json"
        )
        assert res.status_code == 401, res.content[:500]

    def test_anonymous_delete_denied(self):
        svc = make_service(slug="svc-anon-del")
        res = APIClient().delete(ADMIN_LIST + str(svc.id) + "/")
        assert res.status_code == 401, res.content[:500]
        assert Service.objects.count() == 1

    def test_customer_write_denied(self):
        client = auth_client("svc-customer@t.com", "customer")
        res = client.post(ADMIN_LIST, service_payload("svc-cust"), format="json")
        assert res.status_code == 403, res.content[:500]
        svc = make_service(slug="svc-cust-upd")
        res = client.patch(
            ADMIN_LIST + str(svc.id) + "/", {"order": 3}, format="json"
        )
        assert res.status_code == 403, res.content[:500]
        res = client.delete(ADMIN_LIST + str(svc.id) + "/")
        assert res.status_code == 403, res.content[:500]
        assert Service.objects.count() == 1

    def test_engineer_write_denied(self):
        client = auth_client("svc-engineer@t.com", "engineer")
        res = client.post(ADMIN_LIST, service_payload("svc-eng"), format="json")
        assert res.status_code == 403, res.content[:500]
        svc = make_service(slug="svc-eng-upd")
        res = client.patch(
            ADMIN_LIST + str(svc.id) + "/", {"order": 3}, format="json"
        )
        assert res.status_code == 403, res.content[:500]
        res = client.delete(ADMIN_LIST + str(svc.id) + "/")
        assert res.status_code == 403, res.content[:500]
        assert Service.objects.count() == 1


@pytest.mark.django_db
class ServiceManagerWriteAllowedTest(TestCase):
    """E-01 / I-01 closure: content_manager (and website_admin / super_admin)
    can drive the full Create/Edit workflow the CMS UI offers them."""

    def test_content_manager_crud_allowed(self):
        client = auth_client("svc-manager@t.com", "content_manager")
        res = client.post(ADMIN_LIST, service_payload("svc-mgr"), format="json")
        assert res.status_code == 201, res.content[:500]
        svc_id = Service.objects.get(translations__slug="svc-mgr").id
        res = client.patch(
            ADMIN_LIST + str(svc_id) + "/", {"order": 3}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        assert res.data["order"] == 3
        res = client.delete(ADMIN_LIST + str(svc_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Service.objects.count() == 0

    def test_website_admin_crud_allowed(self):
        client = auth_client("svc-webadmin@t.com", "website_admin")
        res = client.post(ADMIN_LIST, service_payload("svc-wadm"), format="json")
        assert res.status_code == 201, res.content[:500]
        svc_id = Service.objects.get(translations__slug="svc-wadm").id
        res = client.patch(
            ADMIN_LIST + str(svc_id) + "/", {"order": 4}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        res = client.delete(ADMIN_LIST + str(svc_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Service.objects.count() == 0

    def test_super_admin_crud_allowed(self):
        client = auth_client("svc-super@t.com", "super_admin")
        res = client.post(ADMIN_LIST, service_payload("svc-sup"), format="json")
        assert res.status_code == 201, res.content[:500]
        svc_id = Service.objects.get(translations__slug="svc-sup").id
        res = client.patch(
            ADMIN_LIST + str(svc_id) + "/", {"order": 5}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        res = client.delete(ADMIN_LIST + str(svc_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Service.objects.count() == 0
