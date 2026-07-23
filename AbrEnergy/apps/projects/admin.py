from django.contrib import admin
from django.utils.html import format_html
from apps.projects.models import Project, ProjectImage


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1
    fields = ["preview", "media_file", "is_cover", "alt_text", "order"]
    readonly_fields = ["preview"]

    def preview(self, obj):
        if obj.media_file and obj.media_file.file_type == "image":
            return format_html(
                '<img src="{}" style="width:80px;height:auto;" />',
                obj.media_file.file.url,
            )
        return "-"
    preview.short_description = "Preview"


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["id", "project_type", "status", "capacity", "location", "is_featured", "created_at"]
    list_filter = ["project_type", "status", "is_featured"]
    search_fields = ["location"]
    list_editable = ["is_featured"]
    date_hierarchy = "created_at"
    inlines = [ProjectImageInline]


@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ["project", "is_cover", "order", "uploaded_at"]
    list_filter = ["is_cover"]
