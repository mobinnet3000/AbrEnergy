from rest_framework import serializers
from apps.gallery.models import GalleryCategory, GalleryImage


class GalleryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryCategory
        fields = ["id", "title", "slug", "description", "order", "is_active"]


class GalleryImageSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source="category.title", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = [
            "id", "category", "category_title", "image_url",
            "title", "alt_text", "caption", "order",
            "is_active", "uploaded_at",
        ]

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
