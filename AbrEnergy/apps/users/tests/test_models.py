import pytest
from django.test import TestCase
from apps.users.models import User
from apps.users.choices import UserRole


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            full_name="Test User",
        )
        assert user.email == "test@example.com"
        assert user.role == UserRole.CUSTOMER
        assert user.is_active is True

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="admin123456",
            full_name="Admin",
        )
        assert user.role == UserRole.SUPER_ADMIN
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_user_str(self):
        user = User.objects.create_user(
            email="test@test.com", password="pass",
            full_name="Test User",
        )
        assert str(user) == "Test User (test@test.com)"

    def test_is_admin_property(self):
        admin = User.objects.create_user(
            email="admin@test.com", password="pass",
            full_name="Admin", role=UserRole.SUPER_ADMIN,
        )
        customer = User.objects.create_user(
            email="user@test.com", password="pass",
            full_name="User",
        )
        assert admin.is_admin is True
        assert customer.is_admin is False
