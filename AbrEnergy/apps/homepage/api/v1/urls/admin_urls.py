from django.urls import path
from apps.homepage.api.v1.views import homepage

app_name = "homepage-admin"

urlpatterns = [
    path("", homepage.HomepageAdminView.as_view(), name="homepage-admin"),
]
