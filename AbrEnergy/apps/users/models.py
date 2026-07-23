import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from versatileimagefield.fields import VersatileImageField
from apps.users.managers import UserManager
from apps.users.choices import UserRole


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), unique=True, db_index=True)
    phone_number = models.CharField(
        _("phone number"),
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r"^09\d{9}$")],
    )
    full_name = models.CharField(_("full name"), max_length=255)
    role = models.CharField(
        _("role"),
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )
    avatar = VersatileImageField(
        _("avatar"),
        upload_to="users/avatars/",
        blank=True,
        null=True,
    )
    bio = models.TextField(_("biography"), blank=True, default="")

    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)
    is_superuser = models.BooleanField(_("superuser status"), default=False)

    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "role"]),
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def is_admin(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.WEBSITE_ADMIN]
