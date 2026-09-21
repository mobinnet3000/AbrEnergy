from django.urls import path
from apps.products.api.v1.views import products

app_name = "admin-product-categories"

urlpatterns = [
    path("", products.AdminCategoryListView.as_view(), name="admin-category-list"),
    path("<uuid:pk>/", products.AdminCategoryDetailView.as_view(), name="admin-category-detail"),
    path("attributes/", products.AdminAttributeDefinitionView.as_view(), name="admin-attribute-list"),
]
