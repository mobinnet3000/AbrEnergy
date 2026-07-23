from rest_framework import serializers
from apps.services.models import Service, ServiceCategory, ServiceTranslation


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "title", "slug", "description", "icon", "order", "is_active"]


class ServiceListSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source="category.title", read_only=True, default="")
    image_url = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()

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

    def get_title(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.title if t else getattr(obj.get_translation("en"), "title", "")

    def get_slug(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.slug if t else ""

    def get_short_description(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.short_description if t else ""


class ServiceDetailSerializer(serializers.ModelSerializer):
    category = ServiceCategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()

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

    def get_title(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.title if t else getattr(obj.get_translation("en"), "title", "")

    def get_slug(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.slug if t else ""

    def get_short_description(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.short_description if t else ""

    def get_description(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.description if t else ""

    def get_meta_title(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.meta_title if t else ""

    def get_meta_description(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.meta_description if t else ""


class ServiceWriteSerializer(serializers.ModelSerializer):
    translations = serializers.DictField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = Service
        fields = [
            "translations", "image", "icon", "category", "features",
            "order", "is_featured", "status",
        ]

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", {})
        service = Service.objects.create(**validated_data)
        for lang_code, fields in translations_data.items():
            ServiceTranslation.objects.create(service=service, language=lang_code, **fields)
        return service

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for lang_code, fields in translations_data.items():
            ServiceTranslation.objects.update_or_create(
                service=instance, language=lang_code, defaults=fields,
            )
        return instance
