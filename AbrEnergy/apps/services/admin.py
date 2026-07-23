from django.contrib import admin
from apps.services.models import Service, ServiceCategory


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "order", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "status", "is_featured", "order", "created_at"]
    list_filter = ["status", "category", "is_featured"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ["is_featured", "order"]
    date_hierarchy = "created_at"
