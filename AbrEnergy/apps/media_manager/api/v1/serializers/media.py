from rest_framework import serializers
from apps.media_manager.models import MediaFile


class MediaFileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = [
            "id", "file", "original_name", "file_type", "mime_type",
            "file_size", "width", "height", "alt_text", "subfolder",
            "uploaded_at",
        ]
        read_only_fields = [
            "id", "original_name", "file_type", "mime_type",
            "file_size", "width", "height", "uploaded_at",
        ]

    def create(self, validated_data):
        uploaded_file = validated_data.pop("file")
        user = self.context["request"].user
        obj = MediaFile(
            file=uploaded_file,
            original_name=getattr(uploaded_file, "name", "unknown"),
            mime_type=getattr(uploaded_file, "content_type", ""),
            file_size=getattr(uploaded_file, "size", 0),
            uploaded_by=user if user.is_authenticated else None,
            **validated_data,
        )
        if hasattr(uploaded_file, "image") and callable(getattr(uploaded_file, "image", None)):
            try:
                obj.width, obj.height = uploaded_file.image.size
            except Exception:
                pass
        obj.save()
        return obj


class MediaFileListSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = [
            "id", "url", "thumbnail_url", "original_name", "file_type",
            "file_size", "width", "height", "alt_text", "subfolder",
            "uploaded_at",
        ]

    def get_url(self, obj):
        return obj.file.url if obj.file else ""

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        if obj.file_type == "image":
            try:
                return obj.file.url
            except Exception:
                return ""
        return ""
