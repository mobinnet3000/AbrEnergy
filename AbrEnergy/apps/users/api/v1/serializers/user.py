from rest_framework import serializers
from apps.users.models import User
from apps.users.choices import UserRole


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "phone_number", "full_name", "role",
            "avatar", "bio", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "role", "is_active", "created_at", "updated_at"]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    is_active = serializers.BooleanField(required=False)

    class Meta:
        model = User
        fields = [
            "id", "email", "phone_number", "full_name", "role",
            "bio", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "email", "created_at", "updated_at"]


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "role", "is_active", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "email", "password", "password_confirm", "full_name",
            "phone_number", "role", "bio",
        ]

    def validate(self, attrs):
        confirm = attrs.pop("password_confirm", None)
        if confirm is not None and attrs["password"] != confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)

    def validate_role(self, value):
        request_user = self.context["request"].user
        if value == UserRole.SUPER_ADMIN and not request_user.is_superuser:
            raise serializers.ValidationError("Only super admins can assign super admin role")
        return value
