from django.urls import path, include

urlpatterns = [
    # Auth & Users (public)
    path("auth/", include("apps.users.api.v1.urls.auth_urls")),
    path("users/", include("apps.users.api.v1.urls.user_urls")),
    # Articles
    path("articles/", include("apps.articles.api.v1.urls")),
    path("categories/", include("apps.articles.api.v1.category_urls")),
    path("tags/", include("apps.articles.api.v1.tag_urls")),
    # Services
    path("services/", include("apps.services.api.v1.urls")),
    path("service-categories/", include("apps.services.api.v1.category_urls")),
    # Projects
    path("projects/", include("apps.projects.api.v1.urls")),
    # Calculator
    path("calculator/", include("apps.calculator.api.v1.urls")),
    # Contact (public)
    path("contact/", include("apps.contacts.api.v1.urls.contact_urls")),
    path("project-inquiry/", include("apps.contacts.api.v1.urls.inquiry_urls")),
    # Gallery (public)
    path("gallery/", include("apps.gallery.api.v1.urls")),
    # Media
    path("media/", include("apps.media_manager.api.v1.urls")),
    # Notifications
    path("notifications/", include("apps.notifications.api.v1.urls")),
    # Site Config
    path("site-config/", include("apps.core.api.v1.urls.site_urls")),
    # Admin only
    path("admin/dashboard/", include("apps.core.api.v1.urls.dashboard_urls")),
    path("admin/activity-log/", include("apps.core.api.v1.urls.activity_urls")),
    path("admin/contact-requests/", include("apps.contacts.api.v1.urls.admin_contact_urls")),
    path("admin/project-inquiries/", include("apps.contacts.api.v1.urls.admin_inquiry_urls")),
    path("admin/gallery/", include("apps.gallery.api.v1.urls.admin_urls")),
    path("admin/gallery/categories/", include("apps.gallery.api.v1.urls.admin_category_urls")),
    path("admin/articles/", include("apps.articles.api.v1.urls.admin_urls")),
    path("admin/services/", include("apps.services.api.v1.urls.admin_urls")),
    path("admin/service-categories/", include("apps.services.api.v1.urls.admin_category_urls")),
    path("admin/projects/", include("apps.projects.api.v1.urls.admin_urls")),
    path("admin/calculator/history/", include("apps.calculator.api.v1.urls.admin_urls")),
    path("admin/site-config/", include("apps.core.api.v1.urls.admin_site_urls")),
    path("admin/", include("apps.users.api.v1.urls.admin_urls")),
]
