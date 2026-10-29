from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from apps.contacts.models import ContactRequest, ProjectInquiry
from apps.contacts.api.v1.serializers.contact import (
    ContactRequestCreateSerializer,
    ContactRequestSerializer,
    ContactRequestAdminUpdateSerializer,
    ProjectInquiryCreateSerializer,
    ProjectInquirySerializer,
    ProjectInquiryAdminUpdateSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser, IsEngineer, IsSupportManager
from apps.notifications.services import create_notification
from apps.core.services import log_activity
from apps.core.throttles import InquiryAnonRateThrottle


class ContactCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [InquiryAnonRateThrottle]
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
    permission_classes = [IsSupportManager]
    serializer_class = ContactRequestSerializer
    queryset = ContactRequest.objects.select_related("assigned_to").all()
    filterset_fields = ["status", "request_type"]
    search_fields = ["full_name", "email", "phone", "subject", "message"]
    ordering_fields = ["created_at", "status", "request_type"]
    ordering = ["-created_at"]


class ContactAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSupportManager]
    queryset = ContactRequest.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ContactRequestAdminUpdateSerializer
        return ContactRequestSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            model_name="ContactRequest",
            object_id=str(instance.id),
            object_repr=instance.full_name,
            changes=serializer.validated_data,
        )


@api_view(["PATCH"])
@permission_classes([IsSupportManager])
def assign_contact(request, pk):
    try:
        contact = ContactRequest.objects.get(pk=pk)
    except ContactRequest.DoesNotExist:
        return Response({"detail": "Contact request not found"}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get("assigned_to")
    if user_id:
        from apps.users.models import User
        try:
            user = User.objects.get(pk=user_id)
            contact.assigned_to = user
            contact.save(update_fields=["assigned_to", "updated_at"])
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        contact.assigned_to = None
        contact.save(update_fields=["assigned_to", "updated_at"])

    return Response({"assigned_to": str(contact.assigned_to_id)} if contact.assigned_to else {"assigned_to": None})


class ProjectInquiryCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [InquiryAnonRateThrottle]
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
                link=f"/admin/inquiries/{instance.id}",
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
    permission_classes = [IsSupportManager | IsEngineer]
    serializer_class = ProjectInquirySerializer
    queryset = ProjectInquiry.objects.select_related("assigned_admin").all()
    filterset_fields = ["status", "project_type"]
    search_fields = ["name", "phone", "email", "city", "message"]
    ordering_fields = ["created_at", "status", "project_type", "estimated_capacity"]
    ordering = ["-created_at"]


class ProjectInquiryAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSupportManager | IsEngineer]
    queryset = ProjectInquiry.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProjectInquiryAdminUpdateSerializer
        return ProjectInquirySerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            model_name="ProjectInquiry",
            object_id=str(instance.id),
            object_repr=instance.name,
            changes=serializer.validated_data,
        )


@api_view(["PATCH"])
@permission_classes([IsSupportManager])
def assign_inquiry(request, pk):
    try:
        inquiry = ProjectInquiry.objects.get(pk=pk)
    except ProjectInquiry.DoesNotExist:
        return Response({"detail": "Inquiry not found"}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get("assigned_admin")
    if user_id:
        from apps.users.models import User
        try:
            user = User.objects.get(pk=user_id)
            inquiry.assigned_admin = user
            inquiry.save(update_fields=["assigned_admin", "updated_at"])
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        inquiry.assigned_admin = None
        inquiry.save(update_fields=["assigned_admin", "updated_at"])

    return Response({"assigned_admin": str(inquiry.assigned_admin_id)} if inquiry.assigned_admin else {"assigned_admin": None})
