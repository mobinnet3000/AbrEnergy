import uuid
from django.db import models
from django.utils.text import slugify


class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=255)
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=100, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    schema_json = models.JSONField(null=True, blank=True)
    canonical_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Service Categories"
        ordering = ["order", "title"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class Service(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="services",
    )
    icon = models.CharField(max_length=100, blank=True, default="")
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="services",
    )
    features = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active", db_index=True)
    schema_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self):
        t = self.get_translation("en") or self.translations.first()
        return t.title if t else str(self.id)

    def get_translation(self, language):
        return self.translations.filter(language=language).first()


from apps.services.translation_models import ServiceTranslation
