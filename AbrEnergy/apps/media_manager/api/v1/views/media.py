from django.db import models
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
    """Phase 9.5 — reusable media discovery (reference-based reuse).

    List/retrieve are gated by ``IsContentManager`` (super_admin,
    website_admin, content_manager) so the CMS authors who can upload and
    attach media can also browse it. Delete stays ``IsAdminUser`` (see
    ``MediaDetailView``). Response shape is the existing
    ``MediaFileListSerializer`` — no new fields, no ownership/PII expansion.
    """

    serializer_class = MediaFileListSerializer
    permission_classes = [IsContentManager]
    queryset = MediaFile.objects.all()

    # Phase 9.5 — explicit ordering allow-list. Anything else falls back to
    # the model default ordering (``-uploaded_at``, stable newest-first).
    ORDERING_CHOICES = {"-uploaded_at", "uploaded_at", "original_name", "-original_name"}

    def get_queryset(self):
        qs = super().get_queryset()
        file_type = self.request.query_params.get("file_type")
        subfolder = self.request.query_params.get("subfolder")
        if file_type:
            qs = qs.filter(file_type=file_type)
        if subfolder:
            qs = qs.filter(subfolder=subfolder)
        # Phase 9.5 — bounded search over the same fields Django admin
        # searches (``MediaFileAdmin.search_fields``). Paginated by the
        # global ``StandardPagination`` (20/max-100), so no unbounded scan.
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                models.Q(original_name__icontains=search)
                | models.Q(alt_text__icontains=search)
            )
        ordering = (self.request.query_params.get("ordering") or "").strip()
        if ordering in self.ORDERING_CHOICES:
            qs = qs.order_by(ordering)
        return qs


class MediaDetailView(generics.RetrieveDestroyAPIView):
    """Phase 9.5 — retrieve for stale-selection validation + admin delete.

    ``GET`` (``IsContentManager``) lets the picker validate that a
    previously selected id still exists. ``DELETE`` keeps the pre-9.5
    ``IsAdminUser`` gate and existing cascade/null semantics; the picker UI
    never surfaces delete (Option A — no reference counting, no orphans
    logic, no behavior change).
    """

    queryset = MediaFile.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        return MediaFileListSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAdminUser()]
        return [IsContentManager()]


# Back-compat alias: the ``<uuid:pk>/`` route historically pointed at a
# destroy-only view named ``media-delete``. The route path and name are
# unchanged; only the view class gained an ``IsContentManager``-gated GET.
MediaDeleteView = MediaDetailView


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
