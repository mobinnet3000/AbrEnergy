import os

from PIL import Image
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

    def validate_file(self, value):
        ext = os.path.splitext(getattr(value, "name", "") or "")[1].lower().lstrip(".")
        content_type = getattr(value, "content_type", "") or ""
        if ext in MediaFile.ALLOWED_DOC_EXTENSIONS:
            if content_type not in MediaFile.ALLOWED_DOC_MIME_TYPES:
                raise serializers.ValidationError("PDF MIME type required for documents.")
            if getattr(value, "size", 0) > MediaFile.MAX_DOC_SIZE:
                raise serializers.ValidationError("Document too large. Maximum 25 MB.")
            try:
                value.seek(0)
                header = value.read(5)
                value.seek(0)
            except Exception:
                raise serializers.ValidationError("Invalid document file.")
            if header != b"%PDF-":
                raise serializers.ValidationError("Invalid PDF file.")
            return value
        if ext not in MediaFile.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: jpg, jpeg, png, webp, pdf."
            )
        if content_type not in MediaFile.ALLOWED_MIME_TYPES:
            raise serializers.ValidationError("File MIME type does not match allowed image types.")
        if getattr(value, "size", 0) > MediaFile.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("File too large. Maximum 10 MB.")
        try:
            value.seek(0)
            with Image.open(value) as img:
                img.verify()
            value.seek(0)
        except Exception:
            raise serializers.ValidationError("Invalid image file.")
        return value

    def create(self, validated_data):
        uploaded_file = validated_data.pop("file")
        user = self.context["request"].user
        ext = os.path.splitext(getattr(uploaded_file, "name", "") or "")[1].lower().lstrip(".")
        file_type = "document" if ext in MediaFile.ALLOWED_DOC_EXTENSIONS else "image"
        obj = MediaFile(
            file=uploaded_file,
            original_name=getattr(uploaded_file, "name", "unknown"),
            mime_type=getattr(uploaded_file, "content_type", ""),
            file_size=getattr(uploaded_file, "size", 0),
            file_type=file_type,
            uploaded_by=user if user.is_authenticated else None,
            **validated_data,
        )
        if hasattr(uploaded_file, "seek"):
            try:
                uploaded_file.seek(0)
            except Exception:
                pass
        if file_type == "image":
            try:
                with Image.open(obj.file) as img:
                    obj.width, obj.height = img.size
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
