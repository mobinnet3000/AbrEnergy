from django.urls import path
from apps.homepage.api.v1.views import homepage

app_name = "homepage"

urlpatterns = [
    path("", homepage.HomepagePublicView.as_view(), name="homepage-public"),
]
