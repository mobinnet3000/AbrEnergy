from rest_framework import serializers
from apps.gallery.models import GalleryCategory, GalleryImage


class GalleryCategorySerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = GalleryCategory
        fields = ["id", "title", "slug", "description", "order", "is_active"]
        read_only_fields = ["title", "slug", "description"]

    def _translation(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t or obj.get_translation("en")

    def get_title(self, obj):
        t = self._translation(obj)
        return t.title if t else str(obj.id)

    def get_slug(self, obj):
        t = self._translation(obj)
        return t.slug if t else ""

    def get_description(self, obj):
        t = self._translation(obj)
        return t.description if t else ""


class GalleryImageSerializer(serializers.ModelSerializer):
    category_title = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = [
            "id", "category", "category_title", "image_url",
            "title", "alt_text", "caption", "order",
            "is_active", "uploaded_at",
        ]

    def get_category_title(self, obj):
        if not obj.category_id:
            return ""
        lang = self.context.get("language", "fa")
        t = obj.category.get_translation(lang) or obj.category.get_translation("en")
        return t.title if t else ""

    def get_image_url(self, obj):
        if obj.media_file:
            try:
                return obj.media_file.file.url
            except Exception:
                pass
        return ""


class GalleryImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = [
            "category", "media_file", "title", "alt_text",
            "caption", "order", "is_active",
        ]

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)
