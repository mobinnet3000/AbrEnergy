from django.urls import path
from apps.core.api.v1.views import site

app_name = "core-site"

urlpatterns = [
    path("", site.SiteSettingsPublicView.as_view(), name="site-settings-public"),
]
