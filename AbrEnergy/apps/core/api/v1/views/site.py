from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from apps.core.models import SiteSettings, ActivityLog
from apps.core.services import get_site_settings
from apps.core.api.v1.serializers.site import (
    SiteSettingsSerializer,
    SiteSettingsPublicSerializer,
    ActivityLogSerializer,
)
from apps.users.api.v1.permissions import IsSuperAdmin


class SiteSettingsPublicView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SiteSettingsPublicSerializer

    def get_object(self):
        return get_site_settings()


class SiteSettingsAdminView(generics.UpdateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = SiteSettingsSerializer

    def get_object(self):
        return get_site_settings()


class ActivityLogListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
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

    data = {
        "total_users": User.objects.count(),
        "total_articles": Article.objects.count(),
        "total_projects": Project.objects.count(),
        "total_services": Service.objects.count(),
        "total_contacts": ContactRequest.objects.count(),
        "total_inquiries": ProjectInquiry.objects.count(),
        "pending_contacts": ContactRequest.objects.filter(status="pending").count(),
        "pending_inquiries": ProjectInquiry.objects.filter(status="new").count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsSuperAdmin])
def recent_contacts(request):
    from apps.contacts.models import ContactRequest
    contacts = ContactRequest.objects.order_by("-created_at")[:10]
    from apps.contacts.api.v1.serializers.contact import ContactRequestSerializer
    return Response(ContactRequestSerializer(contacts, many=True).data)


@api_view(["GET"])
@permission_classes([IsSuperAdmin])
def recent_inquiries(request):
    from apps.contacts.models import ProjectInquiry
    inquiries = ProjectInquiry.objects.order_by("-created_at")[:10]
    from apps.contacts.api.v1.serializers.inquiry import ProjectInquirySerializer
    return Response(ProjectInquirySerializer(inquiries, many=True).data)
