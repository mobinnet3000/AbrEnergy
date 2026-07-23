from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    WEBSITE_ADMIN = "website_admin", "Website Admin"
    CONTENT_MANAGER = "content_manager", "Content Manager"
    ENGINEER = "engineer", "Engineer"
    CUSTOMER = "customer", "Customer"
