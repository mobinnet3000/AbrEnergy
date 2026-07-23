from django.db import models


class GalleryCategoryTranslation(models.Model):
    category = models.ForeignKey("GalleryCategory", on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=5, choices=[("fa", "Persian"), ("ar", "Arabic"), ("en", "English")], db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(allow_unicode=True, max_length=255)
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = [["category", "language"]]
