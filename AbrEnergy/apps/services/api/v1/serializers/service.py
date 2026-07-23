from rest_framework import serializers
from apps.services.models import Service, ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "title", "slug", "description", "icon", "order", "is_active"]


class ServiceListSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source="category.title", read_only=True, default="")
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "short_description", "image_url",
            "icon", "category", "category_title", "features",
            "order", "is_featured", "status", "created_at",
        ]

    def get_image_url(self, obj):
        if obj.image:
            try:
                return obj.image.file.url
            except Exception:
                pass
        return ""


class ServiceDetailSerializer(serializers.ModelSerializer):
    category = ServiceCategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "short_description", "description",
            "image", "image_url", "icon", "category", "features",
            "order", "is_featured", "status",
            "meta_title", "meta_description",
            "created_at", "updated_at",
        ]

    def get_image_url(self, obj):
        if obj.image:
            try:
                return obj.image.file.url
            except Exception:
                pass
        return ""


class ServiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "title", "short_description", "description", "image",
            "icon", "category", "features", "order",
            "is_featured", "status", "meta_title", "meta_description",
        ]
