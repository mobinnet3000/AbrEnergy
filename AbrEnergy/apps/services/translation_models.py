from django.db import models
from django.utils.text import slugify


class ServiceTranslation(models.Model):
    service = models.ForeignKey("Service", on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=5, choices=[("fa","Persian"),("ar","Arabic"),("en","English")], db_index=True)
    title = models.CharField(max_length=500)
    slug = models.SlugField(allow_unicode=True, max_length=500)
    short_description = models.TextField(max_length=500, blank=True, default="")
    description = models.TextField(blank=True, default="")
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["service", "language"]]
        verbose_name_plural = "Service Translations"

    def __str__(self):
        return f"{self.service_id} - {self.language}: {self.title[:50]}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)
