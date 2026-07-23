from django.urls import path
from apps.core.api.v1.views import site

app_name = "core-activity"

urlpatterns = [
    path("", site.ActivityLogListView.as_view(), name="activity-log-list"),
]
