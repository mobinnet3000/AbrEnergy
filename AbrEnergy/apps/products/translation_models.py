from django.db import models
from django.utils.text import slugify


class ProductCategoryTranslation(models.Model):
    category = models.ForeignKey("ProductCategory", on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=5, choices=[("fa", "Persian"), ("ar", "Arabic"), ("en", "English")], db_index=True)
    title = models.CharField(max_length=500)
    slug = models.SlugField(allow_unicode=True, max_length=500, blank=True, default="")
    description = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["category", "language"]]
        verbose_name_plural = "Product Category Translations"

    def __str__(self):
        return f"{self.category_id} - {self.language}: {self.title[:50]}"

    def save(self, *args, **kwargs):
        from apps.core.sanitizer import clean_html
        if self.content:
            self.content = clean_html(self.content)
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class ProductTranslation(models.Model):
    product = models.ForeignKey("Product", on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=5, choices=[("fa", "Persian"), ("ar", "Arabic"), ("en", "English")], db_index=True)
    title = models.CharField(max_length=500)
    slug = models.SlugField(allow_unicode=True, max_length=500, blank=True, default="")
    short_description = models.TextField(max_length=1000, blank=True, default="")
    description = models.TextField(blank=True, default="")
    features = models.TextField(blank=True, default="")
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["product", "language"]]
        verbose_name_plural = "Product Translations"

    def __str__(self):
        return f"{self.product_id} - {self.language}: {self.title[:50]}"

    def save(self, *args, **kwargs):
        from apps.core.sanitizer import clean_html
        if self.description:
            self.description = clean_html(self.description)
        if self.features:
            self.features = clean_html(self.features)
        # Phase 5.2: remember the previous translated slug so old product
        # URLs can permanently redirect. Lazy import: models.py imports this
        # module at its bottom, so a top-level import would be circular.
        old_slug = ""
        if self.pk:
            old_slug = (
                ProductTranslation.objects.filter(pk=self.pk)
                .values_list("slug", flat=True)
                .first()
                or ""
            )
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)
        if old_slug and old_slug != (self.slug or ""):
            from apps.products.models import record_slug_history
            record_slug_history("product", self.product_id, self.language, old_slug, self.slug)
