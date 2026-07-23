from django.urls import path
from apps.notifications.api.v1.views import notification

app_name = "notifications"

urlpatterns = [
    path("", notification.NotificationListView.as_view(), name="notification-list"),
    path("unread-count/", notification.unread_count, name="unread-count"),
    path("<uuid:pk>/read/", notification.mark_read, name="mark-read"),
    path("read-all/", notification.mark_all_read_view, name="mark-all-read"),
    path("<uuid:pk>/", notification.delete_notification, name="delete-notification"),
]
