from django.db.models import Prefetch
from rest_framework import filters, generics, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.mixins import TranslatedSlugDetailMixin
from apps.products.api.v1.serializers.products import (
    AdminProductDetailSerializer,
    AttributeDefinitionSerializer,
    CategorySerializer,
    CategoryTreeSerializer,
    CategoryWriteSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)
from apps.products.models import (
    Product,
    ProductAttributeDefinition,
    ProductAttributeValue,
    ProductCategory,
    ProductImage,
    RelatedProduct,
)
from apps.users.api.v1.permissions import IsContentManager


def _lang(request):
    return request.query_params.get("lang", request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))


class _LangContextMixin:
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["language"] = _lang(self.request)
        return ctx


def public_product_qs():
    return Product.objects.filter(
        status="published", visibility="public", is_active=True,
    ).select_related("category", "og_image").prefetch_related(
        "translations",
        Prefetch("images", queryset=ProductImage.objects.select_related("media_file")),
        "price",
        "specifications",
        Prefetch("attribute_values", queryset=ProductAttributeValue.objects.select_related("definition")),
        "documents",
        Prefetch("related_from", queryset=RelatedProduct.objects.filter(is_active=True).select_related("to_product")),
    )


class CategoryListView(_LangContextMixin, generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategoryTreeSerializer

    def get_queryset(self):
        return ProductCategory.objects.filter(is_active=True).select_related("parent").prefetch_related("translations", "children__translations").order_by("sort_order", "created_at")


class CategoryDetailView(_LangContextMixin, generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_queryset(self):
        return ProductCategory.objects.filter(is_active=True).select_related("cover", "og_image").prefetch_related("translations", "children__translations")


class ProductListView(_LangContextMixin, generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_featured"]
    search_fields = ["translations__title", "translations__short_description", "sku"]
    ordering_fields = ["sort_order", "created_at", "published_at"]
    ordering = ["sort_order", "-created_at"]

    def get_queryset(self):
        qs = public_product_qs()
        if self.request.query_params.get("category"):
            qs = qs.filter(category_id=self.request.query_params["category"])
        return qs.distinct()

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset).distinct()


class ProductDetailView(_LangContextMixin, TranslatedSlugDetailMixin, generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer

    def get_queryset(self):
        return public_product_qs()


class ProductFeaturedView(_LangContextMixin, generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return public_product_qs().filter(is_featured=True).distinct()


def _canonical_product_slug(product, language):
    t = product.get_translation(language) or product.get_translation("fa")
    return t.slug if t and t.slug else product.sku


class ProductSlugResolveView(_LangContextMixin, generics.GenericAPIView):
    """Phase 5.2: resolve a historical public product slug to its current
    canonical slug (``GET /api/v1/products/resolve/?slug=<old>``).

    Public, unauthenticated, translation-aware. Returns
    ``{"canonical_slug": ...}`` when ``slug`` is either the CURRENT slug of a
    publicly visible product (idempotent, no redirect needed) or a REMEMBERED
    previous slug of one; 404 otherwise. Visibility is enforced through
    ``public_product_qs()`` so drafts, archived, hidden, or inactive products
    never leak through history. The frontend server component turns a hit for
    a NON-canonical slug into a permanent (308) redirect; a hit equal to the
    requested slug never redirects (loop-safe by construction).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.products.models import SlugHistory

        slug = (request.query_params.get("slug") or "").strip()
        if not slug:
            return Response({"detail": "slug query parameter is required."}, status=400)
        language = _lang(request) or "fa"
        live = (
            public_product_qs()
            .filter(translations__slug=slug)
            .distinct()
            .first()
        )
        if live is not None:
            return Response({"canonical_slug": _canonical_product_slug(live, language)})
        row = SlugHistory.objects.filter(
            target_type="product", language=language, old_slug=slug
        ).first()
        if row is None and language != "fa":
            row = SlugHistory.objects.filter(
                target_type="product", language="fa", old_slug=slug
            ).first()
        if row is None:
            return Response({"detail": "Not found."}, status=404)
        product = public_product_qs().filter(pk=row.object_id).first()
        if product is None:
            return Response({"detail": "Not found."}, status=404)
        return Response({"canonical_slug": _canonical_product_slug(product, language)})


class CategorySlugResolveView(_LangContextMixin, generics.GenericAPIView):
    """Phase 5.2: category counterpart of ``ProductSlugResolveView``
    (``GET /api/v1/product-categories/resolve/?slug=<old>``).

    Categories resolve the non-translated ``ProductCategory.slug`` model
    field, so history rows carry ``language=""``. Only active categories
    resolve publicly.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.products.models import SlugHistory

        slug = (request.query_params.get("slug") or "").strip()
        if not slug:
            return Response({"detail": "slug query parameter is required."}, status=400)
        live = ProductCategory.objects.filter(is_active=True, slug=slug).first()
        if live is not None:
            return Response({"canonical_slug": live.slug})
        row = SlugHistory.objects.filter(
            target_type="product_category", language="", old_slug=slug
        ).first()
        if row is None:
            return Response({"detail": "Not found."}, status=404)
        category = ProductCategory.objects.filter(is_active=True, pk=row.object_id).first()
        if category is None:
            return Response({"detail": "Not found."}, status=404)
        return Response({"canonical_slug": category.slug})


class AdminCategoryListView(_LangContextMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsContentManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "is_featured", "parent"]
    search_fields = ["translations__title", "slug"]
    ordering_fields = ["sort_order", "created_at"]
    ordering = ["sort_order", "created_at"]

    def get_serializer_class(self):
        return CategoryWriteSerializer if self.request.method == "POST" else CategorySerializer

    def get_queryset(self):
        return ProductCategory.objects.all().select_related("parent").prefetch_related("translations").order_by("sort_order", "created_at")

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset).distinct()


class AdminCategoryDetailView(_LangContextMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsContentManager]

    def get_serializer_class(self):
        return CategoryWriteSerializer if self.request.method in ("PUT", "PATCH") else CategorySerializer

    def get_queryset(self):
        return ProductCategory.objects.all().select_related("parent", "cover", "og_image").prefetch_related("translations")


class AdminProductListView(_LangContextMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsContentManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "visibility", "is_active", "is_featured"]
    search_fields = ["translations__title", "sku"]
    ordering_fields = ["sort_order", "created_at"]

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method == "POST" else ProductListSerializer

    def get_queryset(self):
        return Product.objects.all().select_related("category").prefetch_related("translations", "images__media_file", "price").order_by("sort_order", "-created_at")

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset).distinct()


class AdminProductDetailView(_LangContextMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsContentManager]

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method in ("PUT", "PATCH") else AdminProductDetailSerializer

    def get_queryset(self):
        return Product.objects.all().select_related("category").prefetch_related(
            "translations", "images__media_file", "documents__media_file",
            "specifications", "attribute_values__definition", "price", "related_from__to_product",
        )


class AdminAttributeDefinitionView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsContentManager]
    serializer_class = AttributeDefinitionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_active", "data_type"]
    search_fields = ["code", "name"]
    ordering_fields = ["sort_order", "code"]
    ordering = ["sort_order", "code"]

    def get_queryset(self):
        return ProductAttributeDefinition.objects.all().select_related("category")
