"""Phase 10.1 regression tests: Projects permission contract (E-01 / I-01).

Resolved architecture (OPTION A): Project writes are content work, gated by
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

from apps.projects.models import Project
from apps.projects.translation_models import ProjectTranslation
from apps.users.models import User


ADMIN_LIST = "/api/v1/admin/projects/"
PUBLIC_LIST = "/api/v1/projects/"


def make_user(email, role):
    return User.objects.create_user(
        email=email, password="p", full_name="T", role=role
    )


def make_project(title="پروژه", slug="prj-perm", status="completed"):
    prj = Project.objects.create(
        project_type="on_grid", status=status, location="تهران"
    )
    ProjectTranslation.objects.create(
        project=prj, language="fa", title=title, slug=slug
    )
    return prj


def project_payload(slug):
    return {
        "project_type": "on_grid",
        "status": "planning",
        "location": "تهران",
        "translations": {"fa": {"title": "پروژه %s" % slug, "slug": slug}},
    }


def auth_client(email, role):
    client = APIClient()
    client.force_authenticate(user=make_user(email, role))
    return client


@pytest.mark.django_db
class ProjectReadPermissionTest(TestCase):
    def test_anonymous_list_read_unchanged(self):
        make_project()
        res = APIClient().get(PUBLIC_LIST)
        assert res.status_code == 200, res.content[:500]

    def test_anonymous_admin_list_read_unchanged(self):
        make_project()
        res = APIClient().get(ADMIN_LIST)
        assert res.status_code == 200, res.content[:500]

    def test_anonymous_detail_read_unchanged(self):
        make_project(slug="prj-pub-read")
        res = APIClient().get(PUBLIC_LIST + "prj-pub-read/")
        assert res.status_code == 200, res.content[:500]


@pytest.mark.django_db
class ProjectWriteDeniedTest(TestCase):
    def test_anonymous_create_denied(self):
        res = APIClient().post(ADMIN_LIST, project_payload("prj-anon"), format="json")
        assert res.status_code == 401, res.content[:500]
        assert Project.objects.count() == 0

    def test_anonymous_update_denied(self):
        prj = make_project(slug="prj-anon-upd")
        res = APIClient().patch(
            ADMIN_LIST + str(prj.id) + "/", {"location": "مشهد"}, format="json"
        )
        assert res.status_code == 401, res.content[:500]

    def test_anonymous_delete_denied(self):
        prj = make_project(slug="prj-anon-del")
        res = APIClient().delete(ADMIN_LIST + str(prj.id) + "/")
        assert res.status_code == 401, res.content[:500]
        assert Project.objects.count() == 1

    def test_customer_write_denied(self):
        client = auth_client("prj-customer@t.com", "customer")
        res = client.post(ADMIN_LIST, project_payload("prj-cust"), format="json")
        assert res.status_code == 403, res.content[:500]
        prj = make_project(slug="prj-cust-upd")
        res = client.patch(
            ADMIN_LIST + str(prj.id) + "/", {"location": "مشهد"}, format="json"
        )
        assert res.status_code == 403, res.content[:500]
        res = client.delete(ADMIN_LIST + str(prj.id) + "/")
        assert res.status_code == 403, res.content[:500]
        assert Project.objects.count() == 1

    def test_engineer_write_denied(self):
        client = auth_client("prj-engineer@t.com", "engineer")
        res = client.post(ADMIN_LIST, project_payload("prj-eng"), format="json")
        assert res.status_code == 403, res.content[:500]
        prj = make_project(slug="prj-eng-upd")
        res = client.patch(
            ADMIN_LIST + str(prj.id) + "/", {"location": "مشهد"}, format="json"
        )
        assert res.status_code == 403, res.content[:500]
        res = client.delete(ADMIN_LIST + str(prj.id) + "/")
        assert res.status_code == 403, res.content[:500]
        assert Project.objects.count() == 1


@pytest.mark.django_db
class ProjectManagerWriteAllowedTest(TestCase):
    """E-01 / I-01 closure: content_manager (and website_admin / super_admin)
    can drive the full Create/Edit workflow the CMS UI offers them."""

    def test_content_manager_crud_allowed(self):
        client = auth_client("prj-manager@t.com", "content_manager")
        res = client.post(ADMIN_LIST, project_payload("prj-mgr"), format="json")
        assert res.status_code == 201, res.content[:500]
        prj_id = Project.objects.get(translations__slug="prj-mgr").id
        res = client.patch(
            ADMIN_LIST + str(prj_id) + "/", {"location": "اصفهان"}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        assert res.data["location"] == "اصفهان"
        res = client.delete(ADMIN_LIST + str(prj_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Project.objects.count() == 0

    def test_website_admin_crud_allowed(self):
        client = auth_client("prj-webadmin@t.com", "website_admin")
        res = client.post(ADMIN_LIST, project_payload("prj-wadm"), format="json")
        assert res.status_code == 201, res.content[:500]
        prj_id = Project.objects.get(translations__slug="prj-wadm").id
        res = client.patch(
            ADMIN_LIST + str(prj_id) + "/", {"location": "شیراز"}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        res = client.delete(ADMIN_LIST + str(prj_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Project.objects.count() == 0

    def test_super_admin_crud_allowed(self):
        client = auth_client("prj-super@t.com", "super_admin")
        res = client.post(ADMIN_LIST, project_payload("prj-sup"), format="json")
        assert res.status_code == 201, res.content[:500]
        prj_id = Project.objects.get(translations__slug="prj-sup").id
        res = client.patch(
            ADMIN_LIST + str(prj_id) + "/", {"location": "تبریز"}, format="json"
        )
        assert res.status_code == 200, res.content[:500]
        res = client.delete(ADMIN_LIST + str(prj_id) + "/")
        assert res.status_code == 204, res.content[:500]
        assert Project.objects.count() == 0
