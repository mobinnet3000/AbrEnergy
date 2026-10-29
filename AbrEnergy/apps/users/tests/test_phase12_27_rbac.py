import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.users.choices import UserRole
from apps.users.api.v1.permissions import (
    IsSuperAdmin,
    IsAdminUser,
    IsContentManager,
    IsProductManager,
    IsSupportManager,
    IsSEOManager,
    IsStaffOrAnalyst,
)

User = get_user_model()


class MockRequest:
    def __init__(self, user, method="GET"):
        self.user = user
        self.method = method


class MockView:
    pass


@pytest.mark.django_db
class TestPhase1227RBACPermissions:
    """Tests for Phase 12.27 RBAC permission classes and user role definitions."""

    def test_all_9_roles_defined(self):
        expected_roles = {
            'super_admin',
            'website_admin',
            'content_manager',
            'product_manager',
            'support_manager',
            'seo_manager',
            'engineer',
            'analyst',
            'customer',
        }
        actual_roles = {choice[0] for choice in UserRole.choices}
        assert expected_roles.issubset(actual_roles)

    def test_is_product_manager_permission(self):
        perm = IsProductManager()
        view = MockView()

        prod_mgr = User(email='prod@test.com', role=UserRole.PRODUCT_MANAGER, is_active=True)
        admin = User(email='admin@test.com', role=UserRole.WEBSITE_ADMIN, is_active=True)
        super_admin = User(email='super@test.com', role=UserRole.SUPER_ADMIN, is_active=True)
        content_mgr = User(email='content@test.com', role=UserRole.CONTENT_MANAGER, is_active=True)
        engineer = User(email='eng@test.com', role=UserRole.ENGINEER, is_active=True)
        customer = User(email='cust@test.com', role=UserRole.CUSTOMER, is_active=True)

        assert perm.has_permission(MockRequest(prod_mgr), view) is True
        assert perm.has_permission(MockRequest(admin), view) is True
        assert perm.has_permission(MockRequest(super_admin), view) is True
        assert perm.has_permission(MockRequest(content_mgr), view) is True
        assert perm.has_permission(MockRequest(engineer), view) is False
        assert perm.has_permission(MockRequest(customer), view) is False

    def test_is_support_manager_permission(self):
        perm = IsSupportManager()
        view = MockView()

        support_mgr = User(email='supp@test.com', role=UserRole.SUPPORT_MANAGER, is_active=True)
        super_admin = User(email='super@test.com', role=UserRole.SUPER_ADMIN, is_active=True)
        engineer = User(email='eng@test.com', role=UserRole.ENGINEER, is_active=True)
        customer = User(email='cust@test.com', role=UserRole.CUSTOMER, is_active=True)

        assert perm.has_permission(MockRequest(support_mgr), view) is True
        assert perm.has_permission(MockRequest(super_admin), view) is True
        assert perm.has_permission(MockRequest(engineer), view) is False
        assert perm.has_permission(MockRequest(customer), view) is False

    def test_is_seo_manager_permission(self):
        perm = IsSEOManager()
        view = MockView()

        seo_mgr = User(email='seo@test.com', role=UserRole.SEO_MANAGER, is_active=True)
        content_mgr = User(email='content@test.com', role=UserRole.CONTENT_MANAGER, is_active=True)
        super_admin = User(email='super@test.com', role=UserRole.SUPER_ADMIN, is_active=True)
        analyst = User(email='analyst@test.com', role=UserRole.ANALYST, is_active=True)
        customer = User(email='cust@test.com', role=UserRole.CUSTOMER, is_active=True)

        assert perm.has_permission(MockRequest(seo_mgr), view) is True
        assert perm.has_permission(MockRequest(content_mgr), view) is True
        assert perm.has_permission(MockRequest(super_admin), view) is True
        assert perm.has_permission(MockRequest(analyst), view) is False
        assert perm.has_permission(MockRequest(customer), view) is False

    def test_is_staff_or_analyst_permission(self):
        perm = IsStaffOrAnalyst()
        view = MockView()

        analyst = User(email='analyst@test.com', role=UserRole.ANALYST, is_active=True)
        engineer = User(email='eng@test.com', role=UserRole.ENGINEER, is_active=True)
        customer = User(email='cust@test.com', role=UserRole.CUSTOMER, is_active=True)

        assert perm.has_permission(MockRequest(analyst), view) is True
        assert perm.has_permission(MockRequest(engineer), view) is True
        assert perm.has_permission(MockRequest(customer), view) is False


@pytest.mark.django_db
class TestPhase1227UserManagementAPI:
    """Tests for Super Admin user creation and role management endpoints."""

    def test_super_admin_can_create_user(self):
        client = APIClient()
        super_admin = User.objects.create_user(
            email='sa@test.com',
            password='testpassword123',
            role=UserRole.SUPER_ADMIN,
            full_name='Super Admin',
            is_active=True,
        )
        client.force_authenticate(user=super_admin)

        payload = {
            'email': 'new_pm@test.com',
            'password': 'StrongPassword123!',
            'full_name': 'Product Manager 1',
            'role': UserRole.PRODUCT_MANAGER,
            'phone_number': '09121112233',
        }
        res = client.post('/api/v1/admin/users/', data=payload, format='json')
        assert res.status_code == 201
        assert res.data['email'] == 'new_pm@test.com'
        assert res.data['role'] == UserRole.PRODUCT_MANAGER

        created_user = User.objects.get(email='new_pm@test.com')
        assert created_user.check_password('StrongPassword123!') is True
        assert created_user.role == UserRole.PRODUCT_MANAGER

    def test_non_super_admin_cannot_create_user(self):
        client = APIClient()
        content_mgr = User.objects.create_user(
            email='cm@test.com',
            password='testpassword123',
            role=UserRole.CONTENT_MANAGER,
            full_name='Content Manager',
            is_active=True,
        )
        client.force_authenticate(user=content_mgr)

        payload = {
            'email': 'forbidden@test.com',
            'password': 'StrongPassword123!',
            'full_name': 'Forbidden User',
            'role': UserRole.CUSTOMER,
        }
        res = client.post('/api/v1/admin/users/', data=payload, format='json')
        assert res.status_code == 403
