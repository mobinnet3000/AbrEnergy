from django.urls import path
from apps.gallery.api.v1.views import gallery

app_name = "admin-gallery-categories"

urlpatterns = [
    path("", gallery.GalleryCategoryListView.as_view(), name="admin-gallery-cat-list"),
    path("<uuid:pk>/", gallery.GalleryCategoryDetailView.as_view(), name="admin-gallery-cat-detail"),
]
