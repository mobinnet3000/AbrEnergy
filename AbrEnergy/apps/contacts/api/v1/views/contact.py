from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from apps.contacts.models import ContactRequest, ProjectInquiry
from apps.contacts.api.v1.serializers.contact import (
    ContactRequestCreateSerializer,
    ContactRequestSerializer,
    ContactRequestAdminUpdateSerializer,
)
from apps.contacts.api.v1.serializers.inquiry import (
    ProjectInquiryCreateSerializer,
    ProjectInquirySerializer,
    ProjectInquiryAdminUpdateSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser, IsEngineer
from apps.notifications.services import create_notification
from apps.core.services import log_activity
import json


class ContactCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ContactRequestCreateSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        admin_users = self._get_admins()
        for admin in admin_users:
            create_notification(
                recipient=admin,
                title="New Contact Request",
                message=f"New contact request from {instance.full_name}",
                notification_type="new_contact",
                link=f"/admin/contacts/{instance.id}",
            )
        log_activity(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            model_name="ContactRequest",
            object_id=str(instance.id),
            object_repr=instance.full_name,
            changes={"email": instance.email, "request_type": instance.request_type},
        )

    @staticmethod
    def _get_admins():
        from apps.users.models import User
        from apps.users.choices import UserRole
        return User.objects.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.WEBSITE_ADMIN]
        )


class ContactAdminListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = ContactRequestSerializer
    queryset = ContactRequest.objects.select_related("assigned_to").all()
    filterset_fields = ["status", "request_type"]


class ContactAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    queryset = ContactRequest.objects.all()
    serializer_class = ContactRequestAdminUpdateSerializer
    lookup_field = "pk"


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def assign_contact(request, pk):
    contact = ContactRequest.objects.get(pk=pk)
    user_id = request.data.get("assigned_to")
    if user_id:
        from apps.users.models import User
        try:
            user = User.objects.get(pk=user_id)
            contact.assigned_to = user
            contact.save()
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"assigned_to": str(contact.assigned_to_id)} if contact.assigned_to else {})


class ProjectInquiryCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProjectInquiryCreateSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        admin_users = self._get_admins()
        for admin in admin_users:
            create_notification(
                recipient=admin,
                title="New Project Inquiry",
                message=f"New inquiry from {instance.name} in {instance.city}",
                notification_type="new_project_inquiry",
                link=f"/admin/project-inquiries/{instance.id}",
            )
        log_activity(
            user=None,
            action="create",
            model_name="ProjectInquiry",
            object_id=str(instance.id),
            object_repr=instance.name,
            changes={"city": instance.city, "project_type": instance.project_type},
        )

    @staticmethod
    def _get_admins():
        from apps.users.models import User
        from apps.users.choices import UserRole
        return User.objects.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.WEBSITE_ADMIN, UserRole.ENGINEER]
        )


class ProjectInquiryAdminListView(generics.ListAPIView):
    permission_classes = [IsEngineer]
    serializer_class = ProjectInquirySerializer
    queryset = ProjectInquiry.objects.select_related("assigned_admin").all()
    filterset_fields = ["status", "project_type"]


class ProjectInquiryAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsEngineer]
    queryset = ProjectInquiry.objects.all()
    serializer_class = ProjectInquiryAdminUpdateSerializer
    lookup_field = "pk"


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def assign_inquiry(request, pk):
    inquiry = ProjectInquiry.objects.get(pk=pk)
    user_id = request.data.get("assigned_admin")
    if user_id:
        from apps.users.models import User
        try:
            user = User.objects.get(pk=user_id)
            inquiry.assigned_admin = user
            inquiry.save()
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"assigned_admin": str(inquiry.assigned_admin_id)} if inquiry.assigned_admin else {})
