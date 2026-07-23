from apps.notifications.models import Notification
from django.utils import timezone


def create_notification(
    recipient, title, message,
    notification_type="general", sender=None, link="",
):
    return Notification.objects.create(
        recipient=recipient,
        sender=sender,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )


def get_unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()


def mark_all_read(user):
    return Notification.objects.filter(recipient=user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
