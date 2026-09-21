from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import TranslatedSlugDetailMixin
from apps.projects.models import Project
from apps.projects.api.v1.serializers.project import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectWriteSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser


class ProjectListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "GET":
            return ProjectListSerializer
        return ProjectWriteSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def get_queryset(self):
        qs = Project.objects.prefetch_related(
            "translations", "images__media_file"
        ).select_related("service_category").all()
        project_type = self.request.query_params.get("project_type")
        status = self.request.query_params.get("status")
        if project_type:
            qs = qs.filter(project_type=project_type)
        if status:
            qs = qs.filter(status=status)
        return qs

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["translations__title", "location"]
    filterset_fields = ["project_type", "status", "is_featured"]

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        return qs.distinct()


class ProjectDetailView(TranslatedSlugDetailMixin, generics.RetrieveUpdateDestroyAPIView):
    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProjectWriteSerializer
        return ProjectDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUser()]

    queryset = Project.objects.prefetch_related(
        "translations", "images__media_file"
    ).select_related("service_category").all()
    lookup_field = "slug"


class ProjectFeaturedView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProjectListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_queryset(self):
        return Project.objects.filter(is_featured=True).prefetch_related(
            "translations", "images__media_file"
        ).select_related("service_category")


class ProjectByTypeView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProjectListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_queryset(self):
        return Project.objects.filter(
            project_type=self.kwargs["type"]
        ).prefetch_related("translations", "images__media_file").select_related("service_category")
