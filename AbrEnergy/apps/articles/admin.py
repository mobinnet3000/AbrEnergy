from django.contrib import admin
from django.utils.html import format_html
from apps.articles.models import Article, Category, Tag, ArticleImage


class ArticleImageInline(admin.TabularInline):
    model = ArticleImage
    extra = 1
    fields = ["media_file", "alt_text", "order"]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = [
        "id", "author_name", "category", "status",
        "publish_date", "view_count", "is_featured", "created_at",
    ]
    list_filter = ["status", "category", "is_featured"]
    list_per_page = 25
    date_hierarchy = "created_at"
    inlines = [ArticleImageInline]
    filter_horizontal = ["tags"]
    list_editable = ["is_featured"]
    readonly_fields = ["view_count", "created_at", "updated_at"]

    actions = ["make_published", "make_draft", "archive"]

    def author_name(self, obj):
        return obj.author.full_name if obj.author else "-"
    author_name.short_description = "Author"

    def get_title(self, obj):
        t = obj.get_translation("en") or obj.translations.first()
        return t.title if t else str(obj.id)
    get_title.short_description = "Title"

    @admin.action(description="Mark selected as Published")
    def make_published(self, request, queryset):
        queryset.update(status="published")

    @admin.action(description="Mark selected as Draft")
    def make_draft(self, request, queryset):
        queryset.update(status="draft")

    @admin.action(description="Archive selected articles")
    def archive(self, request, queryset):
        queryset.update(status="draft")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "parent", "is_active", "created_at"]
    list_filter = ["is_active", "parent"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["title", "slug"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
