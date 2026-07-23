import uuid
from django.db import models


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
    schema_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project_type", "status"]),
        ]

    def __str__(self):
        t = self.get_translation("en") or self.translations.first()
        return t.title if t else str(self.id)

    def get_translation(self, language):
        return self.translations.filter(language=language).first()


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
        t = self.project.get_translation("en") or self.project.translations.first()
        return f"Image for {t.title if t else self.project.id}"


from apps.projects.translation_models import ProjectTranslation
