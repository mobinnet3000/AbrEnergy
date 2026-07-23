import uuid
from django.db import models
from django.utils.text import slugify
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=255)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True,
        related_name="children",
    )
    description = models.TextField(blank=True, default="")
    image = VersatileImageField(upload_to="articles/categories/", blank=True, null=True)
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    schema_json = models.JSONField(null=True, blank=True)
    canonical_url = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["title"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=100)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class Article(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("scheduled", "Scheduled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=500)
    short_description = models.TextField(max_length=1000)
    content = RichTextField()
    cover_image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="articles_as_cover",
    )
    author = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True,
        related_name="articles",
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True,
        related_name="articles",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft", db_index=True)
    publish_date = models.DateTimeField(null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    keywords = models.TextField(blank=True, default="")
    schema_json = models.JSONField(null=True, blank=True)
    canonical_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Articles"
        ordering = ["-publish_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "publish_date"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class ArticleImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="images")
    media_file = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE,
        related_name="article_images",
    )
    alt_text = models.CharField(max_length=500, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Image for {self.article.title}"
