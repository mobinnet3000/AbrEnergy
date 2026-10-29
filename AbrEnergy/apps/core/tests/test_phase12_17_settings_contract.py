import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.mark.django_db
class SiteSettingsAdminContractTest(TestCase):
    def setUp(self):
        self.anonymous = APIClient()
        self.admin = APIClient()
        self.admin.force_authenticate(
            user=User.objects.create_user(
                email="settings-admin@example.com", password="p", role="super_admin"
            )
        )

    def test_admin_can_read_full_settings(self):
        response = self.admin.get("/api/v1/admin/site-config/")
        assert response.status_code == 200
        assert "default_meta_title" in response.data
        assert "company_name" in response.data

    def test_admin_settings_require_authentication(self):
        response = self.anonymous.get("/api/v1/admin/site-config/")
        assert response.status_code in (401, 403)

    def test_saved_contact_details_are_public(self):
        response = self.admin.patch(
            "/api/v1/admin/site-config/",
            {
                "phone_number": "+98 21 0000 0000",
                "email": "real@example.com",
                "address": "Real address",
            },
            format="json",
        )
        assert response.status_code == 200

        public_response = self.anonymous.get("/api/v1/site-config/")
        assert public_response.status_code == 200
        assert public_response.data["phone_number"] == "+98 21 0000 0000"
        assert public_response.data["email"] == "real@example.com"
        assert public_response.data["address"] == "Real address"
