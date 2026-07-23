from django.urls import path
from apps.gallery.api.v1.views import gallery

app_name = "gallery"

urlpatterns = [
    path("", gallery.GalleryPublicView.as_view(), name="gallery-list"),
    path("<slug:category_slug>/", gallery.GalleryPublicView.as_view(), name="gallery-by-category"),
]
