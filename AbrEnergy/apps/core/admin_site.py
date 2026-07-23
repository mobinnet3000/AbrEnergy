from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _
from django.template.response import TemplateResponse
from apps.core.services import get_site_settings
from apps.users.models import User
from apps.articles.models import Article
from apps.projects.models import Project
from apps.contacts.models import ContactRequest


class AbrEnergyAdminSite(AdminSite):
    site_title = _("AbrEnergy Admin")
    site_header = _("AbrEnergy Admin Panel")
    index_title = _("Dashboard")

    def index(self, request, extra_context=None):
        extra = extra_context or {}
        extra["site_settings"] = get_site_settings()
        extra["total_users"] = User.objects.count()
        extra["total_articles"] = Article.objects.count()
        extra["total_projects"] = Project.objects.count()
        extra["pending_contacts"] = ContactRequest.objects.filter(status="pending").count()
        return super().index(request, extra_context=extra)


admin_site = AbrEnergyAdminSite(name="abrenergy_admin")
