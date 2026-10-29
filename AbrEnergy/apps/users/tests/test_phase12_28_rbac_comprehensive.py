import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.users.choices import UserRole
from apps.notifications.models import Notification

User = get_user_model()


@pytest.fixture
def make_user(db):
    def _make(role, email=None, is_active=True):
        if not email:
            email = f"user_{role}_{User.objects.count()}@example.com"
        return User.objects.create_user(
            email=email,
            password="StrongPassword123!",
            role=role,
            full_name=f"Test {role}",
            is_active=is_active,
        )
    return _make


@pytest.mark.django_db
class TestPhase1228RBACComprehensive:
    """Independent end-to-end authorization verification across all 9 roles."""

    ALL_ROLES = [
        UserRole.SUPER_ADMIN,
        UserRole.WEBSITE_ADMIN,
        UserRole.CONTENT_MANAGER,
        UserRole.PRODUCT_MANAGER,
        UserRole.SUPPORT_MANAGER,
        UserRole.SEO_MANAGER,
        UserRole.ENGINEER,
        UserRole.ANALYST,
        UserRole.CUSTOMER,
    ]

    def test_site_settings_restricted_to_super_admin(self, make_user):
        """Only super_admin can read/update admin site settings."""
        client = APIClient()

        # Unauthenticated
        res = client.get("/api/v1/admin/site-config/")
        assert res.status_code == 401

        for role in self.ALL_ROLES:
            user = make_user(role)
            client.force_authenticate(user=user)
            res = client.get("/api/v1/admin/site-config/")
            if role == UserRole.SUPER_ADMIN:
                assert res.status_code == 200, f"super_admin expected 200, got {res.status_code}"
            else:
                assert res.status_code == 403, f"role {role} expected 403, got {res.status_code}"

    def test_activity_log_restricted_to_super_admin_website_admin_analyst(self, make_user):
        """Activity log is accessible to super_admin, website_admin, and read-only analyst."""
        client = APIClient()
        allowed_roles = {UserRole.SUPER_ADMIN, UserRole.WEBSITE_ADMIN, UserRole.ANALYST}

        for role in self.ALL_ROLES:
            user = make_user(role)
            client.force_authenticate(user=user)
            res = client.get("/api/v1/admin/activity-log/")
            if role in allowed_roles:
                assert res.status_code == 200, f"role {role} expected 200, got {res.status_code}"
            else:
                assert res.status_code == 403, f"role {role} expected 403, got {res.status_code}"

    def test_product_admin_restricted_to_product_and_content_managers(self, make_user):
        """Product admin endpoints are accessible to super_admin, website_admin, content_manager, product_manager."""
        client = APIClient()
        allowed_roles = {
            UserRole.SUPER_ADMIN,
            UserRole.WEBSITE_ADMIN,
            UserRole.CONTENT_MANAGER,
            UserRole.PRODUCT_MANAGER,
        }

        for role in self.ALL_ROLES:
            user = make_user(role)
            client.force_authenticate(user=user)
            res = client.get("/api/v1/admin/products/")
            if role in allowed_roles:
                assert res.status_code == 200, f"role {role} expected 200, got {res.status_code}"
            else:
                assert res.status_code == 403, f"role {role} expected 403, got {res.status_code}"

    def test_contact_requests_restricted_to_support_manager(self, make_user):
        """Contact requests are accessible to super_admin, website_admin, and support_manager."""
        client = APIClient()
        allowed_roles = {
            UserRole.SUPER_ADMIN,
            UserRole.WEBSITE_ADMIN,
            UserRole.SUPPORT_MANAGER,
        }

        for role in self.ALL_ROLES:
            user = make_user(role)
            client.force_authenticate(user=user)
            res = client.get("/api/v1/admin/contact-requests/")
            if role in allowed_roles:
                assert res.status_code == 200, f"role {role} expected 200, got {res.status_code}"
            else:
                assert res.status_code == 403, f"role {role} expected 403, got {res.status_code}"

    def test_last_active_super_admin_guard_enforcement(self, make_user):
        """Sole active super-admin cannot be demoted, deactivated, or deleted."""
        client = APIClient()
        sa1 = make_user(UserRole.SUPER_ADMIN, email="sole_sa@example.com")
        client.force_authenticate(user=sa1)

        # Attempt to demote sole super admin
        res = client.patch(f"/api/v1/admin/users/{sa1.id}/", {"role": UserRole.WEBSITE_ADMIN}, format="json")
        assert res.status_code == 400
        assert "Cannot demote the final active super administrator" in str(res.data)

        # Attempt to deactivate sole super admin
        res = client.patch(f"/api/v1/admin/users/{sa1.id}/", {"is_active": False}, format="json")
        assert res.status_code == 400
        assert "Cannot deactivate the final active super administrator" in str(res.data)

        # Attempt to delete sole super admin
        res = client.delete(f"/api/v1/admin/users/{sa1.id}/")
        assert res.status_code == 400
        assert "Cannot delete the final active super administrator" in str(res.data)

        # Add a second super admin; demotion of sa1 now succeeds
        sa2 = make_user(UserRole.SUPER_ADMIN, email="sa_second@example.com")
        res = client.patch(f"/api/v1/admin/users/{sa1.id}/", {"role": UserRole.WEBSITE_ADMIN}, format="json")
        assert res.status_code == 200
        sa1.refresh_from_db()
        assert sa1.role == UserRole.WEBSITE_ADMIN

    def test_customer_cannot_access_other_customer_notifications(self, make_user):
        """Object-level boundary: customer A cannot see customer B's notifications."""
        cust_a = make_user(UserRole.CUSTOMER, email="cust_a@example.com")
        cust_b = make_user(UserRole.CUSTOMER, email="cust_b@example.com")

        notif_b = Notification.objects.create(
            recipient=cust_b,
            title="Private Quote B",
            message="Your private quote details",
        )

        client = APIClient()
        client.force_authenticate(user=cust_a)

        # List notifications: only cust_a's notifications returned
        res = client.get("/api/v1/notifications/")
        assert res.status_code == 200
        ids = [n["id"] for n in (res.data if isinstance(res.data, list) else res.data.get("results", []))]
        assert str(notif_b.id) not in ids

        # Attempt to mark customer B's notification as read
        res = client.patch(f"/api/v1/notifications/{notif_b.id}/read/")
        assert res.status_code == 404
