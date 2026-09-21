import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User
from apps.users.choices import UserRole


@pytest.mark.django_db
class AuthPhase1Test(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.com", password="testpass123",
            full_name="Test User",
        )

    def test_login(self):
        res = self.client.post("/api/v1/auth/login/", {
            "email": "user@test.com", "password": "testpass123",
        })
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" in res.data

    def test_refresh(self):
        refresh = str(RefreshToken.for_user(self.user))
        res = self.client.post("/api/v1/auth/refresh/", {"refresh": refresh})
        assert res.status_code == 200
        assert "access" in res.data

    def test_invalid_refresh(self):
        res = self.client.post("/api/v1/auth/refresh/", {"refresh": "invalid"})
        assert res.status_code in (400, 401)

    def test_expired_access_then_refresh(self):
        from datetime import timedelta
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(self.user)
        token.set_exp(lifetime=timedelta(seconds=-1))
        res = self.client.get(
            "/api/v1/users/me/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        assert res.status_code == 401
        refresh = str(RefreshToken.for_user(self.user))
        res2 = self.client.post("/api/v1/auth/refresh/", {"refresh": refresh})
        assert res2.status_code == 200

    def test_role_self_escalation_blocked(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.patch("/api/v1/users/me/", {"role": "super_admin"})
        assert res.status_code == 200
        self.user.refresh_from_db()
        assert self.user.role == UserRole.CUSTOMER
        assert res.data["role"] == UserRole.CUSTOMER

    def test_admin_can_change_role(self):
        admin = User.objects.create_superuser(
            email="admin@test.com", password="pass",
            full_name="Admin",
        )
        self.client.force_authenticate(user=admin)
        res = self.client.patch(
            f"/api/v1/admin/users/{self.user.id}/change-role/",
            {"role": "content_manager"}, format="json",
        )
        assert res.status_code == 200
        self.user.refresh_from_db()
        assert self.user.role == "content_manager"
