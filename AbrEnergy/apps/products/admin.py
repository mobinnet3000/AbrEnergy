from django.contrib import admin
from django.utils.html import format_html
from apps.products.models import (
    Product,
    ProductAttributeDefinition,
    ProductAttributeValue,
    ProductCategory,
    ProductDocument,
    ProductImage,
    ProductPrice,
    ProductSpecification,
    RelatedProduct,
)
from apps.products.translation_models import (
    ProductCategoryTranslation,
    ProductTranslation,
)


class CategoryTranslationInline(admin.TabularInline):
    model = ProductCategoryTranslation
    extra = 0
    fields = ["language", "title", "slug", "description", "meta_title", "meta_description"]


class TranslationInline(admin.TabularInline):
    model = ProductTranslation
    extra = 0
    fields = ["language", "title", "slug", "short_description", "meta_title", "meta_description"]


class ImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ["media_file", "is_cover", "sort_order", "alt_text"]


class DocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 0
    fields = ["media_file", "title", "doc_type", "sort_order", "is_active"]


class SpecInline(admin.TabularInline):
    model = ProductSpecification
    extra = 0
    fields = ["section", "label", "value", "unit", "sort_order"]


class AttrValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 0
    fields = ["definition", "value_text", "value_number", "value_boolean"]


class PriceInline(admin.StackedInline):
    model = ProductPrice
    extra = 0
    max_num = 1
    fields = [
        "display_mode", "regular_price", "sale_price", "currency",
        "discount_type", "discount_value", "starts_at", "ends_at", "is_active",
    ]


class RelationInline(admin.TabularInline):
    model = RelatedProduct
    fk_name = "from_product"
    extra = 0
    fields = ["to_product", "relation_type", "sort_order", "is_active"]


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["title_fa", "slug", "parent", "sort_order", "is_active", "is_featured", "updated_at"]
    list_filter = ["is_active", "is_featured", "parent"]
    search_fields = ["slug", "translations__title"]
    list_editable = ["sort_order", "is_active", "is_featured"]
    ordering = ["sort_order", "created_at"]
    inlines = [CategoryTranslationInline]

    def title_fa(self, obj):
        t = obj.get_translation("fa") or obj.translations.first()
        return t.title if t else obj.slug
    title_fa.short_description = "Title"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title_fa", "sku", "category", "status", "visibility", "is_featured", "sort_order", "created_at"]
    list_filter = ["status", "visibility", "is_featured", "is_active", "category"]
    search_fields = ["sku", "translations__title"]
    list_editable = ["sort_order", "is_featured"]
    ordering = ["sort_order", "-created_at"]
    date_hierarchy = "created_at"
    inlines = [TranslationInline, PriceInline, ImageInline, DocumentInline, SpecInline, AttrValueInline, RelationInline]
    actions = ["make_published", "make_archived", "make_featured"]

    def title_fa(self, obj):
        t = obj.get_translation("fa") or obj.translations.first()
        return t.title if t else obj.sku
    title_fa.short_description = "Title"

    @admin.action(description="Publish selected products")
    def make_published(self, request, queryset):
        queryset.update(status="published")

    @admin.action(description="Archive selected products")
    def make_archived(self, request, queryset):
        queryset.update(status="archived")

    @admin.action(description="Feature selected products")
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)


@admin.register(ProductAttributeDefinition)
class AttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "data_type", "unit", "category", "sort_order", "is_active"]
    list_filter = ["data_type", "is_active", "category"]
    search_fields = ["name", "code"]


@admin.register(ProductPrice)
class ProductPriceAdmin(admin.ModelAdmin):
    list_display = ["product", "display_mode", "regular_price", "sale_price", "currency", "is_active"]
    list_filter = ["display_mode", "currency", "is_active"]
    search_fields = ["product__sku"]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ["product", "preview", "is_cover", "sort_order"]
    list_filter = ["is_cover"]

    def preview(self, obj):
        if obj.media_file_id:
            try:
                return format_html('<img src="{}" style="width:60px;height:auto;" />', obj.media_file.file.url)
            except Exception:
                pass
        return "-"


admin.site.register(ProductDocument)
admin.site.register(ProductSpecification)
admin.site.register(RelatedProduct)
