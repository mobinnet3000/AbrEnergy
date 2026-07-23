from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from apps.users.models import User
from apps.users.choices import UserRole


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "avatar_preview", "full_name", "email", "phone_number",
        "role", "is_active", "is_staff", "created_at",
    ]
    list_filter = ["role", "is_active", "is_staff", "is_superuser"]
    search_fields = ["email", "full_name", "phone_number"]
    ordering = ["-created_at"]
    list_per_page = 25
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("full_name", "phone_number", "avatar", "bio")}),
        (_("Permissions"), {
            "fields": (
                "role", "is_active", "is_staff", "is_superuser",
                "groups", "user_permissions",
            ),
        }),
        (_("Important dates"), {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ["created_at", "updated_at", "last_login", "avatar_preview"]
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "phone_number", "password1", "password2", "role"),
        }),
    )

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />',
                obj.avatar.thumbnail["40x40"].url if hasattr(obj.avatar, "thumbnail") else obj.avatar.url,
            )
        return "-"
    avatar_preview.short_description = _("Avatar")
