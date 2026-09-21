from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.media_manager.models import MediaFile
from apps.media_manager.api.v1.serializers.media import (
    MediaFileUploadSerializer,
    MediaFileListSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser, IsContentManager


class MediaUploadView(generics.CreateAPIView):
    serializer_class = MediaFileUploadSerializer
    permission_classes = [IsContentManager]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MediaListView(generics.ListAPIView):
    serializer_class = MediaFileListSerializer
    permission_classes = [IsAdminUser]
    queryset = MediaFile.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        file_type = self.request.query_params.get("file_type")
        subfolder = self.request.query_params.get("subfolder")
        if file_type:
            qs = qs.filter(file_type=file_type)
        if subfolder:
            qs = qs.filter(subfolder=subfolder)
        return qs


class MediaDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = MediaFile.objects.all()
    lookup_field = "pk"


@api_view(["POST"])
@permission_classes([IsAdminUser])
def cleanup_temp_media(request):
    threshold = timezone.now() - timedelta(days=7)
    qs = MediaFile.objects.filter(is_temp=True, uploaded_at__lt=threshold)
    deleted_count = qs.count()
    ids = list(qs.values_list("id", flat=True)[:100])
    if ids:
        MediaFile.objects.filter(id__in=ids).delete()
    return Response({"deleted": deleted_count, "sample_ids": [str(i) for i in ids]})
