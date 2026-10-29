import re
from urllib.parse import urlparse
from rest_framework import serializers
from apps.core.models import SiteSettings, ActivityLog


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "id", "company_name", "company_name_en", "company_name_ar",
            "logo", "favicon",
            "phone_number", "phone_number_2", "email",
            "address", "address_en", "address_ar",
            "city", "city_en", "city_ar",
            "province", "province_en", "province_ar",
            "postal_code", "map_url",
            "instagram", "telegram", "linkedin", "whatsapp", "youtube",
            "hero_title", "hero_subtitle", "hero_background_image",
            "about_us", "about_us_en",
            "default_meta_title", "default_meta_description", "default_keywords",
            "site_url", "footer_text", "maintenance_mode", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def validate_map_url(self, value):
        if not value:
            return ""
        val = value.strip()
        parsed = urlparse(val)
        if parsed.scheme.lower() != "https":
            raise serializers.ValidationError("Map URL must use the secure https:// protocol.")
        if parsed.scheme.lower() in ("javascript", "data", "file", "ftp", "vbscript"):
            raise serializers.ValidationError("Invalid map URL scheme.")
        return val

    def validate_postal_code(self, value):
        if not value:
            return ""
        val = value.strip()
        if not re.match(r"^[0-9\-\s]{1,30}$", val):
            raise serializers.ValidationError("Postal code may only contain numbers, spaces, and hyphens.")
        return val

    def _sanitize_text(self, value):
        if not value:
            return ""
        return re.sub(r"<[^>]*>", "", value).strip()

    def validate_address(self, value):
        return self._sanitize_text(value)

    def validate_address_en(self, value):
        return self._sanitize_text(value)

    def validate_address_ar(self, value):
        return self._sanitize_text(value)


class SiteSettingsPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "company_name", "company_name_en", "company_name_ar",
            "logo", "favicon",
            "phone_number", "phone_number_2", "email",
            "address", "address_en", "address_ar",
            "city", "city_en", "city_ar",
            "province", "province_en", "province_ar",
            "postal_code", "map_url",
            "instagram", "telegram", "linkedin", "whatsapp", "youtube",
            "hero_title", "hero_subtitle", "hero_background_image",
            "about_us", "about_us_en", "footer_text", "site_url",
            "default_meta_title", "default_meta_description", "default_keywords",
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
