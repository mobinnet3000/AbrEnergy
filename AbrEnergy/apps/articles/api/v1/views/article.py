from rest_framework import generics, filters, permissions
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from apps.articles.models import Article, Category, Tag
from apps.articles.api.v1.serializers.article import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleWriteSerializer,
    CategorySerializer,
    CategoryTreeSerializer,
    TagSerializer,
)
from apps.users.api.v1.permissions import IsContentManager, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


class ArticleListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "GET":
            return ArticleListSerializer
        return ArticleWriteSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsContentManager()]

    def get_queryset(self):
        qs = Article.objects.select_related("author", "category", "cover_image").prefetch_related("tags")
        if self.request.method == "GET" and not self.request.user.is_authenticated:
            qs = qs.filter(status="published")
        elif self.request.user.is_authenticated and self.request.query_params.get("status"):
            qs = qs.filter(status=self.request.query_params.get("status"))
        return qs

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "is_featured", "author"]
    search_fields = ["title", "short_description", "content"]
    ordering_fields = ["publish_date", "created_at", "view_count", "title"]


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ArticleWriteSerializer
        return ArticleDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsContentManager()]

    def get_queryset(self):
        return Article.objects.select_related("author", "category", "cover_image").prefetch_related("tags", "images")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_authenticated:
            Article.objects.filter(pk=instance.pk).update(view_count=models.F("view_count") + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsContentManager])
def publish_article(request, pk):
    article = Article.objects.get(pk=pk)
    article.status = "published"
    article.save()
    return Response({"detail": "Article published"})


@api_view(["POST"])
@permission_classes([IsContentManager])
def archive_article(request, pk):
    article = Article.objects.get(pk=pk)
    article.status = "draft"
    article.save()
    return Response({"detail": "Article archived"})


class CategoryListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.query_params.get("tree"):
            return CategoryTreeSerializer
        return CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = Category.objects.all()


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"


class TagListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = "pk"


class CategoryArticlesView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Article.objects.filter(
            category__slug=slug, status="published"
        ).select_related("author", "category")


class TagArticlesView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.request.query_params.get("lang", self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))
        return context

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Article.objects.filter(
            tags__slug=slug, status="published"
        ).select_related("author", "category")
