from rest_framework import serializers
from apps.projects.models import Project, ProjectImage, ProjectTranslation


class ProjectImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = ["id", "image_url", "is_cover", "alt_text", "order"]

    def get_image_url(self, obj):
        if obj.media_file:
            try:
                return obj.media_file.file.url
            except Exception:
                pass
        return ""


class ProjectListSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "location", "capacity",
            "project_type", "status", "is_featured",
            "completion_percentage", "cover_image", "created_at",
        ]

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if cover and cover.media_file:
            try:
                return cover.media_file.file.url
            except Exception:
                pass
        first_img = obj.images.filter().first()
        if first_img and first_img.media_file:
            try:
                return first_img.media_file.file.url
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


class ProjectDetailSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "description", "location",
            "capacity", "project_type", "service_category",
            "start_date", "end_date", "status", "is_featured",
            "completion_percentage", "images",
            "meta_title", "meta_description",
            "created_at", "updated_at",
        ]

    def get_title(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.title if t else getattr(obj.get_translation("en"), "title", "")

    def get_slug(self, obj):
        lang = self.context.get("language", "fa")
        t = obj.get_translation(lang)
        return t.slug if t else ""

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


class ProjectWriteSerializer(serializers.ModelSerializer):
    translations = serializers.DictField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = Project
        fields = [
            "translations", "location", "capacity",
            "project_type", "service_category",
            "start_date", "end_date", "status", "is_featured",
            "completion_percentage",
        ]

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", {})
        project = Project.objects.create(**validated_data)
        for lang_code, fields in translations_data.items():
            ProjectTranslation.objects.create(project=project, language=lang_code, **fields)
        return project

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for lang_code, fields in translations_data.items():
            ProjectTranslation.objects.update_or_create(
                project=instance, language=lang_code, defaults=fields,
            )
        return instance
