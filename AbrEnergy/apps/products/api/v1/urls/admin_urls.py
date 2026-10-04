from django.urls import path
from apps.products.api.v1.views import products

app_name = "admin-products"

urlpatterns = [
    path("", products.AdminProductListView.as_view(), name="admin-product-list"),
    path("<uuid:pk>/preview/", products.ProductPreviewView.as_view(), name="admin-product-preview"),
    path("<uuid:pk>/duplicate/", products.AdminProductDuplicateView.as_view(), name="admin-product-duplicate"),
    path("<uuid:pk>/", products.AdminProductDetailView.as_view(), name="admin-product-detail"),
]
