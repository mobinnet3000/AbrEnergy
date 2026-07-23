"""
Seed data for AbrEnergy backend.
Creates test users, services, projects, articles, gallery, and calculator history.

Usage:
  python manage.py seed_data
  python manage.py seed_data --force  (delete existing data first)
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.conf import settings
from apps.users.models import User
from apps.users.choices import UserRole
from apps.articles.models import Article, Category, Tag
from apps.services.models import Service, ServiceCategory
from apps.projects.models import Project
from decimal import Decimal


class Command(BaseCommand):
    help = "Seed development data for AbrEnergy"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Delete existing data first")
        parser.add_argument("--noinput", "--no-input", action="store_true", help="Skip confirmation")

    def handle(self, *args, **options):
        if options["force"]:
            self.stdout.write("Clearing existing data...")
            from apps.calculator.models import CalculationHistory
            from apps.gallery.models import GalleryImage, GalleryCategory
            from apps.articles.models import ArticleImage
            from apps.notifications.models import Notification
            CalculationHistory.objects.all().delete()
            GalleryImage.objects.all().delete()
            GalleryCategory.objects.all().delete()
            Project.objects.get_queryset().delete()
            from apps.projects.models import ProjectImage
            ProjectImage.objects.all().delete()
            ArticleImage.objects.all().delete()
            Service.objects.all().delete()
            ServiceCategory.objects.all().delete()
            Article.objects.all().delete()
            Tag.objects.all().delete()
            Category.objects.all().delete()
            Notification.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self._create_users()
        self._create_categories()
        self._create_services()
        self._create_projects()
        self._create_articles()

        self.stdout.write(self.style.SUCCESS("Seed data created successfully"))

    def _create_users(self):
        if not User.objects.filter(email="admin@abrenv.com").exists():
            User.objects.create_superuser(
                email="admin@abrenv.com", password="admin123456",
                full_name="System Admin", role=UserRole.SUPER_ADMIN,
            )
            self.stdout.write("  Created super admin")

        if not User.objects.filter(email="content@abrenv.com").exists():
            User.objects.create_user(
                email="content@abrenv.com", password="content123456",
                full_name="Content Manager", role=UserRole.CONTENT_MANAGER,
            )
            self.stdout.write("  Created content manager")

        if not User.objects.filter(email="customer@abrenv.com").exists():
            User.objects.create_user(
                email="customer@abrenv.com", password="customer123456",
                full_name="Test Customer", role=UserRole.CUSTOMER,
            )
            self.stdout.write("  Created customer")

    def _create_categories(self):
        Category.objects.get_or_create(title="Solar Energy", defaults={"slug": "solar-energy"})
        Category.objects.get_or_create(title="Company News", defaults={"slug": "company-news"})
        Category.objects.get_or_create(title="Technical", defaults={"slug": "technical"})
        self.stdout.write("  Created article categories")

        ServiceCategory.objects.get_or_create(title="Design & EPC", defaults={"slug": "design-epc", "order": 1})
        ServiceCategory.objects.get_or_create(title="Studies", defaults={"slug": "studies", "order": 2})
        self.stdout.write("  Created service categories")

    def _create_services(self):
        cat = ServiceCategory.objects.filter(slug="design-epc").first()

        services_data = [
            {"title": "On Grid System", "short_description": "Grid-tied solar system with net metering", "features": ["Reduced electricity bills", "Sell excess power to grid", "25 year lifespan"]},
            {"title": "Off Grid System", "short_description": "Standalone system with battery storage", "features": ["Grid independence", "Perfect for remote areas", "Battery energy storage"]},
            {"title": "Hybrid System", "short_description": "Combined grid-tied and battery system", "features": ["Maximum flexibility", "24/7 power backup", "Smart energy management"]},
        ]
        for s in services_data:
            obj, created = Service.objects.get_or_create(
                title=s["title"],
                defaults={
                    "slug": slugify(s["title"]),
                    "short_description": s["short_description"],
                    "description": "<p>{}</p>".format(s["short_description"]),
                    "features": s["features"],
                    "category": cat,
                    "status": "active",
                },
            )
            if created:
                self.stdout.write("  Created service: {}".format(s["title"]))

    def _create_projects(self):
        projects_data = [
            {"title": "10kW Solar Plant - Tehran", "location": "Tehran", "capacity": 10, "project_type": "on_grid", "status": "completed"},
            {"title": "5kW Off Grid Plant - Isfahan", "location": "Isfahan", "capacity": 5, "project_type": "off_grid", "status": "completed"},
            {"title": "50kW Commercial Plant - Shiraz", "location": "Shiraz", "capacity": 50, "project_type": "on_grid", "status": "in_progress"},
        ]
        for p in projects_data:
            obj, created = Project.objects.get_or_create(
                title=p["title"],
                defaults={
                    "slug": slugify(p["title"]),
                    "description": "<p>Execution of {} in {}</p>".format(p["title"], p["location"]),
                    "location": p["location"],
                    "capacity": p["capacity"],
                    "project_type": p["project_type"],
                    "status": p["status"],
                    "is_featured": True,
                },
            )
            if created:
                self.stdout.write("  Created project: {}".format(p["title"]))

    def _create_articles(self):
        admin = User.objects.filter(role=UserRole.SUPER_ADMIN).first()
        cat = Category.objects.filter(slug="solar-energy").first()

        articles_data = [
            {"title": "Benefits of Solar Energy", "short_description": "Solar energy is one of the cleanest and most accessible energy sources available today."},
            {"title": "How to Choose Solar Panels", "short_description": "A comprehensive guide to selecting the right solar panels for your needs."},
            {"title": "Solar Installation Costs", "short_description": "Understanding the costs of solar installation and return on investment."},
        ]
        for a in articles_data:
            obj, created = Article.objects.get_or_create(
                title=a["title"],
                defaults={
                    "slug": slugify(a["title"]),
                    "short_description": a["short_description"],
                    "content": "<p>{}</p><p>This is a sample article for testing purposes.</p>".format(a["short_description"]),
                    "author": admin,
                    "category": cat,
                    "status": "published",
                    "is_featured": True,
                },
            )
            if created:
                self.stdout.write("  Created article: {}".format(a["title"]))

        Tag.objects.get_or_create(title="Solar", defaults={"slug": "solar"})
        Tag.objects.get_or_create(title="Economics", defaults={"slug": "economics"})
        self.stdout.write("  Created tags")
