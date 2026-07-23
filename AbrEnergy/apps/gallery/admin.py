from django.contrib import admin
from apps.gallery.models import GalleryCategory, GalleryImage


@admin.register(GalleryCategory)
class GalleryCategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "is_active"]
    list_filter = ["is_active"]


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "order", "is_active", "uploaded_at"]
    list_filter = ["category", "is_active"]
    search_fields = ["title", "alt_text"]
    list_editable = ["order"]
    date_hierarchy = "uploaded_at"
