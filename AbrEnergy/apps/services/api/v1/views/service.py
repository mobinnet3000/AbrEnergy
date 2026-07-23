from rest_framework import generics, permissions
from apps.services.models import Service, ServiceCategory
from apps.services.api.v1.serializers.service import (
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServiceWriteSerializer,
    ServiceCategorySerializer,
)
from apps.users.api.v1.permissions import IsAdminUser


class ServiceListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "GET":
            return ServiceListSerializer
        return ServiceWriteSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    queryset = Service.objects.select_related("category", "image").all()
    filterset_fields = ["category", "status", "is_featured"]
    search_fields = ["title", "short_description"]
    ordering_fields = ["order", "created_at"]


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ServiceWriteSerializer
        return ServiceDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    queryset = Service.objects.select_related("category", "image").all()
    lookup_field = "slug"


class ServiceCategoryListView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer


class ServiceCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    lookup_field = "pk"
