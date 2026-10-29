from rest_framework.permissions import BasePermission
from apps.users.choices import UserRole


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.SUPER_ADMIN
        )


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [UserRole.SUPER_ADMIN, UserRole.WEBSITE_ADMIN]
        )


class IsContentManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.CONTENT_MANAGER,
            ]
        )


class IsEngineer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.ENGINEER,
            ]
        )


class IsProductManager(BasePermission):
    """Gated for product and catalogue operations."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.CONTENT_MANAGER,
                UserRole.PRODUCT_MANAGER,
            ]
        )


class IsSupportManager(BasePermission):
    """Gated for contact requests and project inquiries."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.SUPPORT_MANAGER,
            ]
        )


class IsSEOManager(BasePermission):
    """Gated for SEO metadata operations."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.CONTENT_MANAGER,
                UserRole.SEO_MANAGER,
            ]
        )


class IsStaffOrAnalyst(BasePermission):
    """Allows staff full access, analysts read-only access."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == UserRole.ANALYST:
            return request.method in ("GET", "HEAD", "OPTIONS")
        return request.user.role in [
            UserRole.SUPER_ADMIN,
            UserRole.WEBSITE_ADMIN,
            UserRole.CONTENT_MANAGER,
            UserRole.PRODUCT_MANAGER,
            UserRole.SUPPORT_MANAGER,
            UserRole.SEO_MANAGER,
            UserRole.ENGINEER,
        ]


class IsActivityLogViewer(BasePermission):
    """Permits super_admin, website_admin, and read-only analyst to access activity logs."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.WEBSITE_ADMIN,
                UserRole.ANALYST,
            ]
        )


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.role in [
            UserRole.SUPER_ADMIN,
            UserRole.WEBSITE_ADMIN,
        ]
