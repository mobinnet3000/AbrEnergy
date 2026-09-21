from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import TranslatedSlugDetailMixin
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def get_queryset(self):
        return Service.objects.select_related("category", "image").prefetch_related("translations").all()

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "is_featured"]
    search_fields = ["translations__title", "translations__short_description"]
    ordering_fields = ["order", "created_at"]

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        return qs.distinct()


class ServiceDetailView(TranslatedSlugDetailMixin, generics.RetrieveUpdateDestroyAPIView):
    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ServiceWriteSerializer
        return ServiceDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    queryset = Service.objects.select_related("category", "image").prefetch_related("translations").all()
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
