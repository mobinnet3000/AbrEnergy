"""
Seed data for AbrEnergy backend.
Creates test users, services, projects, articles, gallery, and calculator history.

Usage:
  python manage.py seed_data
  python manage.py seed_data --force  (delete existing data first)
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import User
from apps.users.choices import UserRole
from apps.articles.models import Article, Category, Tag
from apps.services.models import Service, ServiceCategory
from apps.projects.models import Project
from apps.articles.translation_models import ArticleTranslation
from apps.services.translation_models import ServiceTranslation
from apps.projects.translation_models import ProjectTranslation
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
            {
                "features": ["Reduced electricity bills", "Sell excess power to grid", "25 year lifespan"],
                "translations": {
                    "en": {"title": "On Grid System", "short_description": "Grid-tied solar system with net metering", "description": "<p>On-grid solar systems connect directly to the utility grid, allowing you to feed excess power back and draw from the grid when needed. Net metering ensures you get credited for the surplus energy you produce.</p>"},
                    "fa": {"title": "نیروگاه متصل به شبکه", "short_description": "سیستم خورشیدی متصل به شبکه با کنتور دوطرفه", "description": "<p>نیروگاه‌های خورشیدی متصل به شبکه مستقیماً به شبکه سراسری متصل می‌شوند و امکان فروش برق مازاد به شبکه را فراهم می‌کنند.</p>"},
                    "ar": {"title": "محطة متصلة بالشبكة", "short_description": "نظام شمسي مرتبط بالشبكة مع صافي القياس", "description": "<p>ترتبط الأنظمة الشمسية المرتبطة بالشبكة مباشرة بشبكة الكهرباء، مما يسمح بتغذية الطاقة الفائضة إليها.</p>"},
                },
            },
            {
                "features": ["Grid independence", "Perfect for remote areas", "Battery energy storage"],
                "translations": {
                    "en": {"title": "Off Grid System", "short_description": "Standalone system with battery storage", "description": "<p>Off-grid solar systems operate independently from the utility grid. They store energy in batteries for use during nighttime or cloudy days, making them ideal for remote locations.</p>"},
                    "fa": {"title": "نیروگاه مستقل از شبکه", "short_description": "سیستم مستقل از شبکه با ذخیره‌ساز باتری", "description": "<p>نیروگاه‌های خورشیدی مستقل از شبکه بدون اتصال به شبکه سراسری کار می‌کنند و انرژی را در باتری‌ها ذخیره می‌کنند.</p>"},
                    "ar": {"title": "محطة مستقلة عن الشبكة", "short_description": "نظام مستقل عن الشبكة مع تخزين البطارية", "description": "<p>تعمل الأنظمة الشمسية المستقلة عن الشبكة بشكل منفصل تماماً عن شبكة الكهرباء وتخزن الطاقة في البطاريات.</p>"},
                },
            },
            {
                "features": ["Maximum flexibility", "24/7 power backup", "Smart energy management"],
                "translations": {
                    "en": {"title": "Hybrid System", "short_description": "Combined grid-tied and battery system", "description": "<p>Hybrid solar systems combine the best of both worlds: grid connection with battery backup. They intelligently manage energy flow between solar panels, batteries, and the grid.</p>"},
                    "fa": {"title": "نیروگاه هیبریدی", "short_description": "سیستم ترکیبی متصل به شبکه و باتری", "description": "<p>نیروگاه‌های هیبریدی بهترین ویژگی‌های سیستم‌های متصل به شبکه و مستقل را ترکیب می‌کنند و مدیریت هوشمند انرژی را فراهم می‌سازند.</p>"},
                    "ar": {"title": "محطة هجينة", "short_description": "نظام هجين يجمع بين الشبكة والبطارية", "description": "<p>تجمع الأنظمة الشمسية الهجينة بين أفضل ما في العالمين: الاتصال بالشبكة مع احتياطي البطارية.</p>"},
                },
            },
        ]
        for s in services_data:
            if ServiceTranslation.objects.filter(service__category=cat, language="en", title=s["translations"]["en"]["title"]).exists():
                continue
            obj = Service.objects.create(
                features=s["features"],
                category=cat,
                status="active",
            )
            for lang_code, t in s["translations"].items():
                ServiceTranslation.objects.create(
                    service=obj, language=lang_code,
                    title=t["title"],
                    short_description=t["short_description"],
                    description=t["description"],
                )
            self.stdout.write("  Created service: {}".format(s["translations"]["en"]["title"]))

    def _create_projects(self):
        projects_data = [
            {
                "location": "Tehran", "capacity": Decimal("10.00"), "project_type": "on_grid", "status": "completed",
                "translations": {
                    "en": {"title": "10kW Solar Plant - Tehran", "description": "<p>Execution of 10kW Solar Plant in Tehran</p>"},
                    "fa": {"title": "نیروگاه خورشیدی ۱۰ کیلووات - تهران", "description": "<p>اجرای نیروگاه خورشیدی ۱۰ کیلووات در تهران</p>"},
                    "ar": {"title": "محطة شمسية ۱۰ كيلوواط - طهران", "description": "<p>تنفيذ محطة شمسية ١٠ كيلوواط في طهران</p>"},
                },
            },
            {
                "location": "Isfahan", "capacity": Decimal("5.00"), "project_type": "off_grid", "status": "completed",
                "translations": {
                    "en": {"title": "5kW Off Grid Plant - Isfahan", "description": "<p>Execution of 5kW Off Grid Plant in Isfahan</p>"},
                    "fa": {"title": "نیروگاه مستقل از شبکه ۵ کیلووات - اصفهان", "description": "<p>اجرای نیروگاه مستقل از شبکه ۵ کیلووات در اصفهان</p>"},
                    "ar": {"title": "محطة مستقلة عن الشبكة ٥ كيلوواط - أصفهان", "description": "<p>تنفيذ محطة مستقلة عن الشبكة ٥ كيلوواط في أصفهان</p>"},
                },
            },
            {
                "location": "Shiraz", "capacity": Decimal("50.00"), "project_type": "on_grid", "status": "in_progress",
                "translations": {
                    "en": {"title": "50kW Commercial Plant - Shiraz", "description": "<p>Execution of 50kW Commercial Plant in Shiraz</p>"},
                    "fa": {"title": "نیروگاه تجاری ۵۰ کیلووات - شیراز", "description": "<p>اجرای نیروگاه تجاری ۵۰ کیلووات در شیراز</p>"},
                    "ar": {"title": "محطة تجارية ٥٠ كيلوواط - شيراز", "description": "<p>تنفيذ محطة تجارية ٥٠ كيلوواط في شيراز</p>"},
                },
            },
        ]
        for p in projects_data:
            if ProjectTranslation.objects.filter(project__location=p["location"], project__capacity=p["capacity"], language="en").exists():
                continue
            obj = Project.objects.create(
                location=p["location"],
                capacity=p["capacity"],
                project_type=p["project_type"],
                status=p["status"],
                is_featured=True,
            )
            for lang_code, t in p["translations"].items():
                ProjectTranslation.objects.create(
                    project=obj, language=lang_code,
                    title=t["title"],
                    description=t["description"],
                )
            self.stdout.write("  Created project: {}".format(p["translations"]["en"]["title"]))

    def _create_articles(self):
        admin = User.objects.filter(role=UserRole.SUPER_ADMIN).first()
        cat = Category.objects.filter(slug="solar-energy").first()

        articles_data = [
            {
                "title": "Benefits of Solar Energy",
                "short_description": "Solar energy is one of the cleanest and most accessible energy sources available today.",
                "content": "<p>Solar energy is one of the cleanest and most accessible energy sources available today. By harnessing the power of the sun, we can generate electricity without producing greenhouse gas emissions or other pollutants. Solar panels have become increasingly efficient and affordable, making them a viable option for homeowners and businesses alike.</p><p>This article explores the key benefits of solar energy, including reduced electricity bills, energy independence, environmental impact, and long-term financial returns.</p>",
            },
            {
                "title": "How to Choose Solar Panels",
                "short_description": "A comprehensive guide to selecting the right solar panels for your needs.",
                "content": "<p>Choosing the right solar panels for your home or business can be a daunting task given the wide range of options available in the market. This comprehensive guide walks you through the key factors to consider: efficiency, wattage, temperature coefficient, warranty, and manufacturer reputation.</p><p>Whether you are looking for monocrystalline, polycrystalline, or thin-film panels, understanding these metrics will help you make an informed decision that maximizes your return on investment.</p>",
            },
            {
                "title": "Solar Installation Costs",
                "short_description": "Understanding the costs of solar installation and return on investment.",
                "content": "<p>The cost of solar installation has dropped significantly over the past decade, making renewable energy more accessible than ever. However, understanding the full cost breakdown — including equipment, labor, permits, and maintenance — is essential for accurate budgeting.</p><p>This article breaks down the typical costs associated with solar panel installation and provides a framework for calculating your expected return on investment based on your location, energy consumption, and available incentives.</p>",
            },
        ]
        for a in articles_data:
            if ArticleTranslation.objects.filter(article__author=admin, article__category=cat, language="en", title=a["title"]).exists():
                continue
            obj = Article.objects.create(
                author=admin,
                category=cat,
                status="published",
                is_featured=True,
            )
            ArticleTranslation.objects.create(
                article=obj, language="en",
                title=a["title"],
                short_description=a["short_description"],
                content=a["content"],
            )
            self.stdout.write("  Created article: {}".format(a["title"]))

        Tag.objects.get_or_create(title="Solar", defaults={"slug": "solar"})
        Tag.objects.get_or_create(title="Economics", defaults={"slug": "economics"})
        self.stdout.write("  Created tags")
