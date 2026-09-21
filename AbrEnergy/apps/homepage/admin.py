from django.contrib import admin

from apps.homepage.models import (
    HomepageArticle,
    HomepageCategory,
    HomepageConfig,
    HomepageFeaturedProduct,
    HomepageProject,
    HomepageSection,
    HomepageService,
    HomepageVisual,
)


@admin.register(HomepageConfig)
class HomepageConfigAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not HomepageConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HomepageSection)
class HomepageSectionAdmin(admin.ModelAdmin):
    list_display = ["key", "enabled", "order", "title", "updated_at"]
    list_filter = ["enabled"]
    list_editable = ["enabled", "order"]


class _RelationAdmin(admin.ModelAdmin):
    list_display = ["id", "enabled", "order"]
    list_filter = ["enabled"]
    list_editable = ["enabled", "order"]


@admin.register(HomepageFeaturedProduct)
class HomepageFeaturedProductAdmin(_RelationAdmin):
    list_display = ["product", "enabled", "order"]


@admin.register(HomepageCategory)
class HomepageCategoryAdmin(_RelationAdmin):
    list_display = ["category", "enabled", "order"]


@admin.register(HomepageService)
class HomepageServiceAdmin(_RelationAdmin):
    list_display = ["service", "enabled", "order"]


@admin.register(HomepageProject)
class HomepageProjectAdmin(_RelationAdmin):
    list_display = ["project", "enabled", "order"]


@admin.register(HomepageArticle)
class HomepageArticleAdmin(_RelationAdmin):
    list_display = ["article", "enabled", "order"]


@admin.register(HomepageVisual)
class HomepageVisualAdmin(admin.ModelAdmin):
    list_display = ["image", "enabled", "order", "alt"]
    list_filter = ["enabled"]
    list_editable = ["enabled", "order"]
