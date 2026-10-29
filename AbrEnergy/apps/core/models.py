import uuid
from django.db import models
from versatileimagefield.fields import VersatileImageField
from apps.users.choices import UserRole


class SiteSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, default="ابر انرژی")
    company_name_en = models.CharField(max_length=255, default="AbarEnergy")
    company_name_ar = models.CharField(max_length=255, blank=True, default="أبر إنيرجي")
    logo = VersatileImageField(upload_to="company/logo/", blank=True, null=True)
    favicon = VersatileImageField(upload_to="company/favicon/", blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    phone_number_2 = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(blank=True, default="")

    # Physical company address fields — localized for FA, EN, AR
    address = models.TextField(blank=True, default="")
    address_en = models.TextField(blank=True, default="")
    address_ar = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    city_en = models.CharField(max_length=100, blank=True, default="")
    city_ar = models.CharField(max_length=100, blank=True, default="")
    province = models.CharField(max_length=100, blank=True, default="")
    province_en = models.CharField(max_length=100, blank=True, default="")
    province_ar = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=30, blank=True, default="")
    map_url = models.URLField(max_length=1000, blank=True, default="")

    instagram = models.URLField(blank=True, default="")
    telegram = models.URLField(blank=True, default="")
    linkedin = models.URLField(blank=True, default="")
    whatsapp = models.CharField(max_length=20, blank=True, default="")
    youtube = models.URLField(blank=True, default="")

    hero_title = models.CharField(max_length=500, blank=True, default="")
    hero_subtitle = models.TextField(blank=True, default="")
    hero_background_image = VersatileImageField(
        upload_to="company/hero/", blank=True, null=True
    )
    about_us = models.TextField(blank=True, default="")
    about_us_en = models.TextField(blank=True, default="")

    default_meta_title = models.CharField(max_length=255, blank=True, default="")
    default_meta_description = models.TextField(blank=True, default="")
    default_keywords = models.TextField(blank=True, default="")

    site_url = models.URLField(blank=True, default="https://abrenv.com")
    footer_text = models.TextField(blank=True, default="")
    maintenance_mode = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return self.company_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("publish", "Publish"),
        ("archive", "Archive"),
        ("status_change", "Status Change"),
        ("role_change", "Role Change"),
        ("password_reset_request", "Password Reset Request"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    object_id = models.CharField(max_length=255)
    object_repr = models.CharField(max_length=500, blank=True, default="")
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "action"]),
            models.Index(fields=["model_name", "object_id"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}"


class SeoKeyword(models.Model):
    INTENT_CHOICES = [
        ("informational", "Informational"),
        ("navigational", "Navigational"),
        ("commercial", "Commercial"),
        ("transactional", "Transactional"),
    ]
    PRIORITY_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    keyword = models.CharField(max_length=255, db_index=True)
    locale = models.CharField(max_length=10, default="fa", db_index=True)
    target_country = models.CharField(max_length=100, default="IR")
    target_page = models.CharField(max_length=255, default="/")
    search_intent = models.CharField(max_length=20, choices=INTENT_CHOICES, default="informational")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    current_rank = models.IntegerField(null=True, blank=True)
    best_rank = models.IntegerField(null=True, blank=True)
    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    average_position = models.FloatField(default=0.0)
    last_measured_at = models.DateTimeField(null=True, blank=True)
    rank_history = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "SEO Keyword"
        verbose_name_plural = "SEO Keywords"
        ordering = ["-priority", "current_rank", "-updated_at"]
        indexes = [
            models.Index(fields=["locale", "priority"]),
            models.Index(fields=["keyword", "locale"]),
        ]

    def __str__(self):
        return f"{self.keyword} ({self.locale})"
