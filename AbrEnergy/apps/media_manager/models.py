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
    ]

    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024
    ALLOWED_DOC_EXTENSIONS = {"pdf"}
    ALLOWED_DOC_MIME_TYPES = {"application/pdf"}
    MAX_DOC_SIZE = 25 * 1024 * 1024

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(
        upload_to=media_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp", "pdf"])],
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
            name = getattr(self.file, "name", "") or ""
            ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
            self.file_type = "document" if ext in self.ALLOWED_DOC_EXTENSIONS else "image"
        super().save(*args, **kwargs)
