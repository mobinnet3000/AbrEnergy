from rest_framework import serializers
from apps.contacts.models import ProjectInquiry


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
