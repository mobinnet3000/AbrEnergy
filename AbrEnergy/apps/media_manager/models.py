import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from versatileimagefield.fields import VersatileImageField


def media_upload_path(instance, filename):
    ext = filename.split(".")[-1]
    if instance.file_type == "image":
        return f"{instance.subfolder}/{instance.id}.{ext}"
    return f"documents/{instance.id}.{ext}"


class MediaFile(models.Model):
    FILE_TYPE_CHOICES = [
        ("image", "Image"),
        ("document", "Document"),
        ("video", "Video"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(
        upload_to=media_upload_path,
        validators=[FileExtensionValidator(
            allowed_extensions=[
                "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
                "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
                "mp4", "avi", "mov", "mkv",
                "zip", "rar", "txt",
            ]
        )],
    )
    thumbnail = VersatileImageField(
        upload_to="thumbnails/", blank=True, null=True
    )
    original_name = models.CharField(max_length=500)
    file_type = models.CharField(
        max_length=10, choices=FILE_TYPE_CHOICES, db_index=True
    )
    mime_type = models.CharField(max_length=100, blank=True, default="")
    file_size = models.IntegerField(default=0, help_text="Size in bytes")
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    alt_text = models.CharField(max_length=500, blank=True, default="")
    subfolder = models.CharField(max_length=100, default="general")
    uploaded_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="uploaded_media",
    )
    is_temp = models.BooleanField(default=False, db_index=True)
    upload_completed = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Media File"
        verbose_name_plural = "Media Files"
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["file_type", "subfolder"]),
            models.Index(fields=["is_temp", "uploaded_at"]),
        ]

    def __str__(self):
        return self.original_name

    def save(self, *args, **kwargs):
        if not self.file_type:
            ext = self.original_name.split(".")[-1].lower()
            image_exts = {"jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"}
            video_exts = {"mp4", "avi", "mov", "mkv"}
            if ext in image_exts:
                self.file_type = "image"
            elif ext in video_exts:
                self.file_type = "video"
            elif ext in {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"}:
                self.file_type = "document"
            else:
                self.file_type = "other"
        super().save(*args, **kwargs)
