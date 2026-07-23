from django.urls import path
from apps.media_manager.api.v1.views import media

app_name = "media"

urlpatterns = [
    path("upload/", media.MediaUploadView.as_view(), name="media-upload"),
    path("", media.MediaListView.as_view(), name="media-list"),
    path("<uuid:pk>/", media.MediaDeleteView.as_view(), name="media-delete"),
    path("cleanup/", media.cleanup_temp_media, name="media-cleanup"),
]

admin_urlpatterns = [
    path("upload/", media.MediaUploadView.as_view(), name="admin-media-upload"),
    path("", media.MediaListView.as_view(), name="admin-media-list"),
    path("<uuid:pk>/", media.MediaDeleteView.as_view(), name="admin-media-delete"),
    path("cleanup/", media.cleanup_temp_media, name="admin-media-cleanup"),
]
