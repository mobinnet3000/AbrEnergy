from rest_framework import generics, permissions
from apps.gallery.models import GalleryCategory, GalleryImage
from apps.gallery.api.v1.serializers.gallery import (
    GalleryCategorySerializer,
    GalleryImageSerializer,
    GalleryImageWriteSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser


class GalleryPublicView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GalleryImageSerializer

    def get_queryset(self):
        qs = GalleryImage.objects.filter(is_active=True).select_related("category", "media_file")
        category_slug = self.kwargs.get("category_slug")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs


class GalleryAdminListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return GalleryImageWriteSerializer
        return GalleryImageSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAdminUser()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    queryset = GalleryImage.objects.select_related("category", "media_file").all()


class GalleryAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    lookup_field = "pk"


class GalleryCategoryListView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = GalleryCategory.objects.all()
    serializer_class = GalleryCategorySerializer


class GalleryCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = GalleryCategory.objects.all()
    serializer_class = GalleryCategorySerializer
    lookup_field = "pk"
