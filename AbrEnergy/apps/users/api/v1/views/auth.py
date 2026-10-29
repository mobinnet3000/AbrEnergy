from django.db import transaction
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from apps.users.models import User
from apps.users.choices import UserRole
from apps.users.api.v1.serializers.auth import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
)
from apps.users.api.v1.serializers.user import (
    UserSerializer,
    UserListSerializer,
    AdminUserUpdateSerializer,
    UserCreateSerializer,
)
from apps.users.api.v1.permissions import IsSuperAdmin
from apps.core.services import log_activity
from apps.core.throttles import AuthAnonRateThrottle


def check_last_super_admin_violation(target_user, new_role=None, new_is_active=None, is_deletion=False):
    """
    Enforces that the final active super-admin cannot be deleted, deactivated, or demoted.
    Must be called inside transaction.atomic() to ensure concurrency safety.
    """
    if target_user.role != UserRole.SUPER_ADMIN or not target_user.is_active:
        return False, None

    # Query all active super-admins with row-level locks on PostgreSQL (serializes on SQLite)
    active_super_admins_qs = User.objects.select_for_update().filter(
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    other_active_count = active_super_admins_qs.exclude(pk=target_user.pk).count()
    if other_active_count > 0:
        return False, None

    # Target user is the ONLY active super administrator
    if is_deletion:
        return True, "Cannot delete the final active super administrator."
    if new_is_active is False:
        return True, "Cannot deactivate the final active super administrator."
    if new_role is not None and new_role != UserRole.SUPER_ADMIN:
        return True, "Cannot demote the final active super administrator."

    return False, None


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            full_name=serializer.validated_data["full_name"],
            phone_number=serializer.validated_data.get("phone_number", ""),
            role=UserRole.CUSTOMER,
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get("email")
            if email:
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    return response
                response.data["user"] = UserSerializer(user).data
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.get_object()
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password changed successfully"}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.all().order_by("-created_at")
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "full_name", "phone_number"]
    ordering_fields = ["created_at", "email", "full_name", "role", "is_active"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(
            user=self.request.user,
            action="create",
            model_name="User",
            object_id=str(instance.id),
            object_repr=instance.full_name or instance.email,
            changes={"email": instance.email, "role": instance.role},
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return AdminUserUpdateSerializer
        return UserSerializer

    def perform_update(self, serializer):
        user = self.get_object()
        new_role = serializer.validated_data.get("role")
        new_is_active = serializer.validated_data.get("is_active")

        with transaction.atomic():
            violation, message = check_last_super_admin_violation(
                user, new_role=new_role, new_is_active=new_is_active
            )
            if violation:
                raise drf_serializers.ValidationError({"detail": message})
            instance = serializer.save()

        log_activity(
            user=self.request.user,
            action="update",
            model_name="User",
            object_id=str(instance.id),
            object_repr=instance.full_name or instance.email,
            changes=serializer.validated_data,
        )

    def perform_destroy(self, instance):
        with transaction.atomic():
            violation, message = check_last_super_admin_violation(instance, is_deletion=True)
            if violation:
                raise drf_serializers.ValidationError({"detail": message})
            instance.delete()

        log_activity(
            user=self.request.user,
            action="delete",
            model_name="User",
            object_id=str(instance.id),
            object_repr=instance.full_name or instance.email,
        )


@extend_schema(request=None, responses={200: None})
@api_view(["PATCH"])
@permission_classes([IsSuperAdmin])
def change_user_role(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    role = request.data.get("role")
    if role not in dict(UserRole.choices):
        return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        violation, message = check_last_super_admin_violation(user, new_role=role)
        if violation:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        user.role = role
        user.save(update_fields=["role", "updated_at"])

    log_activity(
        user=request.user,
        action="update_role",
        model_name="User",
        object_id=str(user.id),
        object_repr=user.full_name or user.email,
        changes={"role": role},
    )
    return Response({"detail": f"Role changed to {role}", "role": role}, status=status.HTTP_200_OK)


@extend_schema(request=None, responses={200: None})
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    log_activity(
        user=None, action="password_reset_request",
        model_name="User", object_id=email, changes={"email": email},
    )
    return Response({"detail": "If account exists, reset link sent"}, status=status.HTTP_200_OK)
