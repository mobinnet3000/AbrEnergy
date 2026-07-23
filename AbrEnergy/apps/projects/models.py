import uuid
from django.db import models
from django.utils.text import slugify
from ckeditor.fields import RichTextField


class Project(models.Model):
    PROJECT_TYPE_CHOICES = [
        ("on_grid", "On Grid"),
        ("off_grid", "Off Grid"),
        ("hybrid", "Hybrid"),
        ("large_scale", "Large Scale"),
    ]
    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("on_hold", "On Hold"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=500)
    description = RichTextField()
    location = models.CharField(max_length=500, blank=True, default="")
    capacity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="kW")
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE_CHOICES, db_index=True)
    service_category = models.ForeignKey(
        "services.ServiceCategory", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="projects",
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planning", db_index=True)
    is_featured = models.BooleanField(default=False)
    completion_percentage = models.PositiveIntegerField(default=0)
    meta_title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    schema_json = models.JSONField(null=True, blank=True)
    canonical_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project_type", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class ProjectImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    media_file = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE,
        related_name="project_images",
    )
    is_cover = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=500, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_cover", "order"]

    def __str__(self):
        return f"Image for {self.project.title}"
