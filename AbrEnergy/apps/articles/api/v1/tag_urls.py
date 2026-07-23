from django.urls import path
from apps.articles.api.v1.views import article

app_name = "tags"

urlpatterns = [
    path("", article.TagListCreateView.as_view(), name="tag-list"),
    path("<uuid:pk>/", article.TagDetailView.as_view(), name="tag-detail"),
]
