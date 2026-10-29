"""Phase 12.8 demo catalog seed."""
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone


class Command(BaseCommand):
    help = "Idempotent dev-only demo catalog seed (DEMO- SKUs, fa titles)."
    def add_arguments(self, parser):
        parser.add_argument("--allow-production", action="store_true")
    def handle(self, *args, **options):
        if not settings.DEBUG and not options["allow_production"]:
            raise CommandError("Refusing: not DEBUG. Use --allow-production on dev DB only.")
        from apps.products.management.commands.seed_product_categories import Command as SeedCats
        SeedCats().handle()
        from apps.products.models import Product, ProductCategory, ProductPrice, ProductSpecification, ProductAttributeDefinition, ProductAttributeValue
        from apps.products.translation_models import ProductTranslation
        from apps.homepage.models import HomepageFeaturedProduct, HomepageCategory, HomepageService, HomepageProject, HomepageArticle
        from apps.homepage.services import ensure_default_sections
        from apps.services.models import Service, ServiceCategory
        from apps.services.translation_models import ServiceTranslation
        from apps.projects.models import Project
        from apps.projects.translation_models import ProjectTranslation
        from apps.articles.models import Article, Category as ArticleCategory
        from apps.articles.translation_models import ArticleTranslation
        ensure_default_sections()
        demo_defs = [
            ("DEMO-001", "پکیج خورشیدی آپارتمانی [نمونه]", "regular", "185000000", None, True, True, 10),
            ("DEMO-002", "پکیج خورشیدی ویلایی [نمونه]", "discounted", "420000000", "365000000", True, True, 20),
            ("DEMO-003", "پکیج برق اضطراری داروخانه [نمونه]", "regular", "98000000", None, True, True, 30),
            ("DEMO-004", "اینورتر ۵ کیلووات [نمونه]", "discounted", "42000000", "36500000", True, True, 40),
            ("DEMO-005", "سازه سقف مسطح [نمونه]", "regular", "74000000", None, True, False, 50),
            ("DEMO-006", "پروفیل C41 گالوانیزه [نمونه]", "regular", "8900000", None, True, False, 60),
            ("DEMO-007", "بست لوله ۲ اینچ [نمونه]", "discounted", "1800000", "1450000", True, False, 70),
            ("DEMO-008", "سینی کابل ۲۰ سانتی [نمونه]", "contact", None, None, True, False, 80),
            ("DEMO-009", "ست اتصالات نصب [نمونه]", "regular", "14500000", None, True, False, 90),
            ("DEMO-010", "پکیج آفگرید باغی [نمونه]", "contact", None, None, True, True, 100),
            ("DEMO-011", "شارژکنترلر ۶۰ آمپر [نمونه]", "discounted", "125000000", "99000000", True, False, 110),
            ("DEMO-012", "پکیج مخفی [نمونه]", "hidden", "50000000", None, False, False, 120),
        ]
        cats = list(ProductCategory.objects.filter(is_active=True).order_by("sort_order", "created_at"))
        def cat_for(i):
            return cats[i % len(cats)] if cats else None
        count = 0
        for idx, (sku, title, mode, reg, sale, pub, feat, order) in enumerate(demo_defs):
            cat = cat_for(idx)
            prod, created = Product.objects.get_or_create(sku=sku, defaults={"status": "published" if pub else "draft", "visibility": "public", "is_active": True, "is_featured": feat, "sort_order": order, "category": cat})
            if not created:
                prod.status = "published" if pub else "draft"
                prod.visibility = "public"
                prod.is_active = True
                prod.is_featured = feat
                prod.sort_order = order
                if cat:
                    prod.category = cat
                prod.save()
            ProductTranslation.objects.update_or_create(product=prod, language="fa", defaults={"title": title, "short_description": "قیمت نمونه نمایشی؛ قیمت رسمی نیست.", "description": "<p>رکورد نمایشی توسعه؛ قیمت نمونه است و قیمت رسمی شرکت محسوب نمی‌شود.</p>"})
            price, _ = ProductPrice.objects.get_or_create(product=prod)
            price.display_mode = mode
            price.currency = "IRR"
            price.regular_price = Decimal(reg) if reg else None
            price.sale_price = Decimal(sale) if sale else None
            price.discount_type = "none"
            price.discount_value = Decimal("0")
            price.is_active = True
            price.full_clean()
            price.save()
            ProductSpecification.objects.get_or_create(product=prod, label="توان نامی", defaults={"value": "۵۵۰", "unit": "W", "sort_order": 1})
            count += 1
        watt, _ = ProductAttributeDefinition.objects.get_or_create(code="demo-watt", defaults={"name": "توان", "data_type": "number", "unit": "W"})
        for p in Product.objects.filter(sku__startswith="DEMO-"):
            if not ProductAttributeValue.objects.filter(product=p, definition=watt).exists():
                v = ProductAttributeValue(product=p, definition=watt, value_number=Decimal("550"))
                v.full_clean()
                v.save()
        featured = list(Product.objects.filter(sku__startswith="DEMO-", status="published", visibility="public", is_active=True).order_by("sort_order")[:6])
        for i, p in enumerate(featured):
            HomepageFeaturedProduct.objects.update_or_create(product=p, defaults={"order": (i + 1) * 10, "enabled": True})
        for i, c in enumerate(cats[:8]):
            HomepageCategory.objects.update_or_create(category=c, defaults={"order": (i + 1) * 10, "enabled": True})
        svc_cat, _ = ServiceCategory.objects.get_or_create(slug="demo-solar", defaults={"title": "خدمات خورشیدی نمایشی", "order": 1, "is_active": True})
        for i, t in enumerate(["طراحی و نصب [نمونه]", "نگهداشت [نمونه]", "مشاوره [نمونه]"]):
            svc = Service.objects.filter(translations__language="fa", translations__title=t).first()
            if not svc:
                svc = Service.objects.create(category=svc_cat, status="active", order=(i + 1) * 10, is_featured=(i == 0))
            ServiceTranslation.objects.update_or_create(service=svc, language="fa", defaults={"title": t, "short_description": "خدمت نمایشی", "description": "<p>خدمت نمایشی توسعه.</p>"})
            HomepageService.objects.update_or_create(service=svc, defaults={"order": (i + 1) * 10, "enabled": True})
        now = timezone.now()
        for i, t in enumerate(["نیروگاه ۱۰ کیلووات [نمونه]", "نیروگاه ۵۰ کیلووات [نمونه]"]):
            prj = Project.objects.filter(translations__language="fa", translations__title=t).first()
            if not prj:
                prj = Project.objects.create(location="تهران", capacity=Decimal("10.00") if i == 0 else Decimal("50.00"), project_type="on_grid", status="completed", is_featured=(i == 0), completion_percentage=100)
            ProjectTranslation.objects.update_or_create(project=prj, language="fa", defaults={"title": t, "description": "<p>پروژه نمایشی توسعه.</p>"})
            HomepageProject.objects.update_or_create(project=prj, defaults={"order": (i + 1) * 10, "enabled": True})
        art_cat, _ = ArticleCategory.objects.get_or_create(slug="demo-solar", defaults={"title": "انرژی خورشیدی نمایشی", "is_active": True})
        for i, t in enumerate(["راهنمای خرید پنل [نمونه]", "هزینه نصب [نمونه]", "نگهداشت نیروگاه [نمونه]"]):
            art = Article.objects.filter(translations__language="fa", translations__title=t).first()
            if not art:
                art = Article.objects.create(category=art_cat, status="published", publish_date=now, is_featured=(i == 0))
            ArticleTranslation.objects.update_or_create(article=art, language="fa", defaults={"title": t, "short_description": "مقاله نمایشی", "content": "<p>مقاله نمایشی توسعه.</p>"})
            HomepageArticle.objects.update_or_create(article=art, defaults={"order": (i + 1) * 10, "enabled": True})
        self.stdout.write(self.style.SUCCESS(f"seed_demo_catalog: products={count} featured={len(featured)} cats={len(cats)}"))
