from django.urls import path
from apps.homepage.api.v1.views import homepage

app_name = "homepage-admin"

urlpatterns = [
    path("", homepage.HomepageAdminView.as_view(), name="homepage-admin"),
    path(
        "preview-tokens/",
        homepage.PreviewTokenIssueView.as_view(),
        name="homepage-preview-tokens",
    ),
    path(
        "preview/",
        homepage.HomepagePreviewView.as_view(),
        name="homepage-preview",
    ),
]
