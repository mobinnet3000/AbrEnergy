from django.urls import path
from apps.products.api.v1.views import products

app_name = "product-categories"

urlpatterns = [
    path("", products.CategoryListView.as_view(), name="category-list"),
    # Static resolve route MUST precede <str:slug> so "resolve" is never
    # captured as a category slug.
    path("resolve/", products.CategorySlugResolveView.as_view(), name="category-slug-resolve"),
    path("<str:slug>/", products.CategoryDetailView.as_view(), name="category-detail"),
]
