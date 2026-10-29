from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from apps.core.models import SiteSettings, ActivityLog
from apps.core.services import get_site_settings
from apps.core.api.v1.serializers.site import (
    SiteSettingsSerializer,
    SiteSettingsPublicSerializer,
    ActivityLogSerializer,
)
from apps.users.api.v1.permissions import (
    IsContentManager,
    IsSuperAdmin,
    IsAdminUser,
    IsSupportManager,
    IsEngineer,
    IsStaffOrAnalyst,
    IsActivityLogViewer,
)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@throttle_classes([])
def health(request):
    """Phase 12.15 — container readiness probe.

    Deliberately minimal: reports only whether Django can reach the database.
    No version strings, settings, hostnames, credentials, or environment
    details are exposed. Returns 503 when the database is unreachable so an
    orchestrator can distinguish "process started" from "application ready".

    Throttling is disabled for this route only: a container healthcheck polls
    far more often than the anonymous 100/hour limit, and the endpoint is
    read-only and cheap.
    """
    from django.db import connection

    try:
        connection.ensure_connection()
    except Exception:
        return Response({"status": "unavailable"}, status=503)
    return Response({"status": "ok"})


class SiteSettingsPublicView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SiteSettingsPublicSerializer

    def get_object(self):
        return get_site_settings()


class SiteSettingsAdminView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = SiteSettingsSerializer

    def get_object(self):
        return get_site_settings()


class ActivityLogListView(generics.ListAPIView):
    permission_classes = [IsActivityLogViewer]
    serializer_class = ActivityLogSerializer
    queryset = ActivityLog.objects.select_related("user").all()

    def get_queryset(self):
        qs = super().get_queryset()
        action = self.request.query_params.get("action")
        model_name = self.request.query_params.get("model_name")
        user_id = self.request.query_params.get("user_id")
        if action:
            qs = qs.filter(action=action)
        if model_name:
            qs = qs.filter(model_name=model_name)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


@api_view(["GET"])
@permission_classes([IsSuperAdmin])
def dashboard_stats(request):
    from apps.users.models import User
    from apps.articles.models import Article
    from apps.services.models import Service
    from apps.projects.models import Project
    from apps.contacts.models import ContactRequest, ProjectInquiry
    from apps.products.models import Product, ProductCategory

    data = {
        "total_users": User.objects.count(),
        "total_articles": Article.objects.count(),
        "total_projects": Project.objects.count(),
        "total_services": Service.objects.count(),
        "total_contacts": ContactRequest.objects.count(),
        "total_inquiries": ProjectInquiry.objects.count(),
        "pending_contacts": ContactRequest.objects.filter(status="pending").count(),
        "pending_inquiries": ProjectInquiry.objects.filter(status="new").count(),
        # Phase 3: product overview (4 aggregate COUNTs, no N+1).
        "total_product_categories": ProductCategory.objects.count(),
        "total_products": Product.objects.count(),
        "published_products": Product.objects.filter(status="published").count(),
        "draft_products": Product.objects.filter(status="draft").count(),
        "featured_products": Product.objects.filter(is_featured=True).count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsSupportManager])
def recent_contacts(request):
    from apps.contacts.models import ContactRequest
    contacts = ContactRequest.objects.order_by("-created_at")[:10]
    from apps.contacts.api.v1.serializers.contact import ContactRequestSerializer
    return Response(ContactRequestSerializer(contacts, many=True).data)


@api_view(["GET"])
@permission_classes([IsSupportManager | IsEngineer])
def recent_inquiries(request):
    from apps.contacts.models import ProjectInquiry
    inquiries = ProjectInquiry.objects.order_by("-created_at")[:10]
    from apps.contacts.api.v1.serializers.inquiry import ProjectInquirySerializer
    return Response(ProjectInquirySerializer(inquiries, many=True).data)


@api_view(["GET"])
@permission_classes([IsContentManager | IsSupportManager])
def dashboard_overview(request):
    """Phase 12.15 — operationally useful aggregate counts for the CMS
    dashboard.

    Read-only, staff-gated (``IsContentManager``: super_admin, website_admin,
    content_manager). Every value is a real aggregate computed in the
    database (``COUNT`` / ``isnull`` filters) — no full dataset is fetched to
    count it, no value is invented, and no business metric the application
    does not actually track (revenue, orders, traffic, conversions) is
    exposed. Counts reflect the exact queries documented below.

    Definitions:
      products.total            all Product rows
      products.published/draft/archived   by ``status``
      products.hidden           ``visibility="hidden"``
      products.featured         ``is_featured=True``
      products.without_image    no related ProductImage row
      products.without_document no related ProductDocument row
      products.without_seo_title ``seo_title`` is empty
      categories.total/active/inactive    by ``is_active``
      articles.total/published/draft/scheduled  by ``status``
      articles.without_cover    ``cover_image`` is null
      services.total/active/inactive        by ``status``
      projects.total/featured
      gallery.images/images_active/categories
      media.total/images/documents          by ``file_type``
      documents.total           ProductDocument rows
    """
    from apps.articles.models import Article
    from apps.services.models import Service
    from apps.projects.models import Project
    from apps.products.models import (
        Product,
        ProductCategory,
        ProductDocument,
    )
    from apps.gallery.models import GalleryImage, GalleryCategory
    from apps.media_manager.models import MediaFile

    products = Product.objects
    articles = Article.objects
    services = Service.objects
    media = MediaFile.objects

    data = {
        "products": {
            "total": products.count(),
            "published": products.filter(status="published").count(),
            "draft": products.filter(status="draft").count(),
            "archived": products.filter(status="archived").count(),
            "hidden": products.filter(visibility="hidden").count(),
            "featured": products.filter(is_featured=True).count(),
            "without_image": products.filter(images__isnull=True).count(),
            "without_document": products.filter(documents__isnull=True).count(),
            "without_seo_title": products.filter(seo_title="").count(),
        },
        "product_categories": {
            "total": ProductCategory.objects.count(),
            "active": ProductCategory.objects.filter(is_active=True).count(),
            "inactive": ProductCategory.objects.filter(is_active=False).count(),
        },
        "articles": {
            "total": articles.count(),
            "published": articles.filter(status="published").count(),
            "draft": articles.filter(status="draft").count(),
            "scheduled": articles.filter(status="scheduled").count(),
            "without_cover": articles.filter(cover_image__isnull=True).count(),
        },
        "services": {
            "total": services.count(),
            "active": services.filter(status="active").count(),
            "inactive": services.filter(status="inactive").count(),
        },
        "projects": {
            "total": Project.objects.count(),
            "featured": Project.objects.filter(is_featured=True).count(),
        },
        "gallery": {
            "images": GalleryImage.objects.count(),
            "images_active": GalleryImage.objects.filter(is_active=True).count(),
            "categories": GalleryCategory.objects.count(),
        },
        "media": {
            "total": media.count(),
            "images": media.filter(file_type="image").count(),
            "documents": media.filter(file_type="document").count(),
        },
        "documents": {
            "total": ProductDocument.objects.count(),
        },
        # ``users`` is intentionally omitted: admin-user management is a
        # super-admin concern served by the existing endpoints.
        "generated_at": timezone.now().isoformat(),
    }
    return Response(data)
