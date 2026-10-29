import re
from rest_framework import serializers
from apps.contacts.models import ContactRequest, ProjectInquiry


_DIGIT_MAP = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)


def normalize_phone_number(val: str) -> str:
    if not val:
        return ""
    # Transliterate Persian / Arabic digits
    cleaned = val.translate(_DIGIT_MAP).strip()
    # Remove interior spaces and hyphens
    cleaned = re.sub(r"[\s\-\(\)]+", "", cleaned)
    return cleaned


class ContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = [
            "id", "full_name", "email", "phone", "subject",
            "message", "request_type", "status",
            "assigned_to", "admin_note",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "assigned_to", "admin_note", "created_at", "updated_at"]


class ContactRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = ["full_name", "email", "phone", "subject", "message", "request_type"]

    def validate_full_name(self, value):
        val = value.strip() if value else ""
        if len(val) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return val

    def validate_email(self, value):
        return value.strip().lower() if value else ""

    def validate_phone(self, value):
        cleaned = normalize_phone_number(value)
        digits_only = re.sub(r"\D", "", cleaned)
        if len(digits_only) < 7 or len(digits_only) > 15:
            raise serializers.ValidationError("Please enter a valid phone number (7-15 digits).")
        return cleaned

    def validate_message(self, value):
        val = value.strip() if value else ""
        if len(val) < 5:
            raise serializers.ValidationError("Message must be at least 5 characters.")
        return val


class ContactRequestAdminUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=ContactRequest.STATUS_CHOICES, required=False)

    class Meta:
        model = ContactRequest
        fields = ["status", "assigned_to", "admin_note"]


class ProjectInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectInquiry
        fields = [
            "id", "name", "phone", "email", "city",
            "project_type", "estimated_capacity", "message",
            "status", "assigned_admin", "admin_note",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "assigned_admin", "admin_note", "created_at", "updated_at"]


class ProjectInquiryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectInquiry
        fields = [
            "name", "phone", "email", "city",
            "project_type", "estimated_capacity", "message",
        ]

    def validate_name(self, value):
        val = value.strip() if value else ""
        if len(val) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters.")
        return val

    def validate_email(self, value):
        if not value:
            return ""
        return value.strip().lower()

    def validate_phone(self, value):
        cleaned = normalize_phone_number(value)
        digits_only = re.sub(r"\D", "", cleaned)
        if len(digits_only) < 7 or len(digits_only) > 15:
            raise serializers.ValidationError("Please enter a valid phone number (7-15 digits).")
        return cleaned

    def validate_city(self, value):
        return value.strip() if value else ""

    def validate_estimated_capacity(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Estimated capacity cannot be negative.")
        return value


class ProjectInquiryAdminUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=ProjectInquiry.STATUS_CHOICES, required=False)

    class Meta:
        model = ProjectInquiry
        fields = ["status", "assigned_admin", "admin_note"]
