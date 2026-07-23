from rest_framework import serializers
from apps.contacts.models import ContactRequest, ProjectInquiry


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


class ContactRequestAdminUpdateSerializer(serializers.ModelSerializer):
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


class ProjectInquiryAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectInquiry
        fields = ["status", "assigned_admin", "admin_note"]
