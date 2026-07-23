from django.urls import path
from apps.articles.api.v1.views import article

app_name = "categories"

urlpatterns = [
    path("", article.CategoryListCreateView.as_view(), name="category-list"),
    path("<slug:slug>/", article.CategoryDetailView.as_view(), name="category-detail"),
]
