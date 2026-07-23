from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from apps.core.models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["company_name", "email", "phone_number", "updated_at"]
    fieldsets = [
        (_("Company Info"), {
            "fields": ("company_name", "company_name_en", "logo", "favicon", "phone_number", "phone_number_2", "email", "address"),
        }),
        (_("Social Media"), {
            "fields": ("instagram", "telegram", "linkedin", "whatsapp", "youtube"),
        }),
        (_("Hero Section"), {
            "fields": ("hero_title", "hero_subtitle", "hero_background_image"),
        }),
        (_("About"), {
            "fields": ("about_us", "about_us_en"),
        }),
        (_("SEO"), {
            "fields": ("default_meta_title", "default_meta_description", "default_keywords"),
        }),
        (_("Settings"), {
            "fields": ("site_url", "footer_text", "maintenance_mode", "updated_at"),
        }),
    ]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        if SiteSettings.objects.exists():
            return False
        return True

    def has_delete_permission(self, request, obj=None):
        return False
