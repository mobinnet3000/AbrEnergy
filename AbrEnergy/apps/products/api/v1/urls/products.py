from django.urls import path
from apps.products.api.v1.views import products

app_name = "products"

urlpatterns = [
    path("", products.ProductListView.as_view(), name="product-list"),
    path("featured/", products.ProductFeaturedView.as_view(), name="product-featured"),
    # Static resolve route MUST precede <str:slug> so "resolve" is never
    # captured as a product slug.
    path("resolve/", products.ProductSlugResolveView.as_view(), name="product-slug-resolve"),
    path("<str:slug>/", products.ProductDetailView.as_view(), name="product-detail"),
]
