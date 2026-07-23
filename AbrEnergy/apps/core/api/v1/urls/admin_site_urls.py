from django.urls import path
from apps.core.api.v1.views import site

app_name = "admin-site"

urlpatterns = [
    path("", site.SiteSettingsAdminView.as_view(), name="admin-site-settings"),
]
