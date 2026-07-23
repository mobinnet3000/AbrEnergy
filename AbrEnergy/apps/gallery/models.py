import uuid
from django.db import models


class GalleryCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=255)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Gallery Categories"
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        GalleryCategory, on_delete=models.CASCADE,
        related_name="images",
    )
    media_file = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE,
        related_name="gallery_images",
    )
    title = models.CharField(max_length=500, blank=True, default="")
    alt_text = models.CharField(max_length=500, blank=True, default="")
    caption = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="uploaded_gallery",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name_plural = "Gallery Images"

    def __str__(self):
        return self.title or f"Gallery Image {self.id}"
