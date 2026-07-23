from rest_framework import serializers
from apps.core.models import SiteSettings, ActivityLog


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "id", "company_name", "company_name_en", "logo", "favicon",
            "phone_number", "phone_number_2", "email", "address",
            "instagram", "telegram", "linkedin", "whatsapp", "youtube",
            "hero_title", "hero_subtitle", "hero_background_image",
            "about_us", "about_us_en",
            "default_meta_title", "default_meta_description", "default_keywords",
            "site_url", "footer_text", "maintenance_mode", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class SiteSettingsPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "company_name", "company_name_en", "logo", "favicon",
            "phone_number", "phone_number_2", "email", "address",
            "instagram", "telegram", "linkedin", "whatsapp", "youtube",
            "hero_title", "hero_subtitle", "hero_background_image",
            "about_us", "about_us_en", "footer_text", "site_url",
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default="")

    class Meta:
        model = ActivityLog
        fields = [
            "id", "user", "user_email", "action", "model_name",
            "object_id", "object_repr", "changes", "ip_address",
            "user_agent", "timestamp",
        ]
        read_only_fields = fields


class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_articles = serializers.IntegerField()
    total_projects = serializers.IntegerField()
    total_services = serializers.IntegerField()
    total_contacts = serializers.IntegerField()
    total_inquiries = serializers.IntegerField()
    pending_contacts = serializers.IntegerField()
    pending_inquiries = serializers.IntegerField()
