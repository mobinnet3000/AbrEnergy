from django.urls import path
from apps.core.api.v1.views import site

app_name = "core-dashboard"

urlpatterns = [
    path("stats/", site.dashboard_stats, name="dashboard-stats"),
    path("recent-contacts/", site.recent_contacts, name="recent-contacts"),
    path("recent-inquiries/", site.recent_inquiries, name="recent-inquiries"),
]
