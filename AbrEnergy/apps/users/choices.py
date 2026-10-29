from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    WEBSITE_ADMIN = "website_admin", "Website Admin"
    CONTENT_MANAGER = "content_manager", "Content Manager"
    PRODUCT_MANAGER = "product_manager", "Product Manager"
    SUPPORT_MANAGER = "support_manager", "Support Manager"
    SEO_MANAGER = "seo_manager", "SEO Manager"
    ANALYST = "analyst", "Analyst"
    ENGINEER = "engineer", "Engineer"
    CUSTOMER = "customer", "Customer"
