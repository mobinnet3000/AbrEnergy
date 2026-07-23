import uuid
from django.db import models


class ContactRequest(models.Model):
    REQUEST_TYPE_CHOICES = [
        ("contact", "Contact"),
        ("consultation", "Consultation"),
        ("design_request", "Design Request"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_review", "In Review"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    subject = models.CharField(max_length=500, blank=True, default="")
    message = models.TextField()
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default="contact", db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", db_index=True)
    assigned_to = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_contacts",
    )
    admin_note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} - {self.request_type}"


class ProjectInquiry(models.Model):
    PROJECT_TYPE_CHOICES = [
        ("on_grid", "On Grid"),
        ("off_grid", "Off Grid"),
        ("hybrid", "Hybrid"),
        ("large_scale", "Large Scale"),
    ]
    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("in_design", "In Design"),
        ("quoted", "Quoted"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default="")
    city = models.CharField(max_length=100)
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE_CHOICES, db_index=True)
    estimated_capacity = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text="kW"
    )
    message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new", db_index=True)
    assigned_admin = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_inquiries",
    )
    admin_note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.project_type}"
