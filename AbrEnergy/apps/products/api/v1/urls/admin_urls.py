from django.urls import path
from apps.products.api.v1.views import products

app_name = "admin-products"

urlpatterns = [
    path("", products.AdminProductListView.as_view(), name="admin-product-list"),
    path("<uuid:pk>/", products.AdminProductDetailView.as_view(), name="admin-product-detail"),
]
