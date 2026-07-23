from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "recipient", "title", "message",
            "notification_type", "link", "is_read",
            "read_at", "created_at",
        ]
        read_only_fields = ["id", "recipient", "created_at"]
