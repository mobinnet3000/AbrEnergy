import uuid
from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("new_contact", "New Contact"),
        ("contact_status_change", "Contact Status Change"),
        ("new_project_inquiry", "New Project Inquiry"),
        ("project_inquiry_status_change", "Project Inquiry Status Change"),
        ("system", "System"),
        ("general", "General"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        "users.User", on_delete=models.CASCADE,
        related_name="notifications",
    )
    sender = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="sent_notifications",
    )
    title = models.CharField(max_length=500)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30, choices=NOTIFICATION_TYPES, default="general", db_index=True
    )
    link = models.CharField(max_length=500, blank=True, default="")
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "notification_type"]),
        ]

    def __str__(self):
        return f"Notification for {self.recipient}: {self.title[:50]}"
