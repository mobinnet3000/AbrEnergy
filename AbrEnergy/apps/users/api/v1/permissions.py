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


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.role in [
            UserRole.SUPER_ADMIN,
            UserRole.WEBSITE_ADMIN,
        ]
