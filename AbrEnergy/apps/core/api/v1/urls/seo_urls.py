from django.urls import path
from apps.core.api.v1.views import seo

app_name = "core-seo"

urlpatterns = [
    path("overview/", seo.SeoOverviewView.as_view(), name="seo-overview"),
    path("keywords/", seo.SeoKeywordListCreateView.as_view(), name="seo-keywords-list"),
    path("keywords/<uuid:pk>/", seo.SeoKeywordDetailView.as_view(), name="seo-keywords-detail"),
    path("keywords/export/", seo.SeoKeywordExportView.as_view(), name="seo-keywords-export"),
]
