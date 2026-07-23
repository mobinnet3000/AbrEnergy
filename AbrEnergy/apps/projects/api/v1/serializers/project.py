from rest_framework import serializers
from apps.projects.models import Project, ProjectImage


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


class ProjectDetailSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)

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


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "title", "description", "location", "capacity",
            "project_type", "service_category",
            "start_date", "end_date", "status", "is_featured",
            "completion_percentage", "meta_title", "meta_description",
        ]
