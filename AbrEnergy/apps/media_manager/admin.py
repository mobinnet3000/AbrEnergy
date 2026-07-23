from django.contrib import admin
from django.utils.html import format_html
from apps.media_manager.models import MediaFile


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = [
        "preview", "original_name", "file_type", "subfolder",
        "file_size_display", "uploaded_by", "uploaded_at",
    ]
    list_filter = ["file_type", "subfolder", "is_temp"]
    search_fields = ["original_name", "alt_text"]
    list_per_page = 25
    date_hierarchy = "uploaded_at"

    def preview(self, obj):
        if obj.file_type == "image":
            return format_html(
                '<img src="{}" style="width:60px;height:auto;" />',
                obj.file.url,
            )
        return f"[{obj.file_type.upper()}]"
    preview.short_description = "Preview"

    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        return f"{obj.file_size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = "Size"
