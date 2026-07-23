from django.urls import path
from apps.gallery.api.v1.views import gallery

app_name = "admin-gallery"

urlpatterns = [
    path("images/", gallery.GalleryAdminListView.as_view(), name="admin-gallery-list"),
    path("images/<uuid:pk>/", gallery.GalleryAdminDetailView.as_view(), name="admin-gallery-detail"),
]
