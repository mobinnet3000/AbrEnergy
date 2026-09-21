from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.products.models import ProductCategory
from apps.products.translation_models import ProductCategoryTranslation

TREE = {
    "پکیج‌های خورشیدی": ["آپارتمانی", "ویلایی", "داروخانه", "مطب", "پارکینگ مسقف", "تأمین آب زمین کشاورزی", "کانکس سبز"],
    "پکیج‌های برق اضطراری": ["آپارتمانی", "ویلایی", "داروخانه", "مطب"],
    "سازه‌های خورشیدی": ["سقف مسطح", "سقف شیبدار", "سازه زمینی کوبشی"],
    "سیستم نگهدارنده نصب ماژولار": ["پروفیل", "بست لوله", "سینی کابل", "اتصالات و متعلقات"],
}


class Command(BaseCommand):
    help = "Idempotent seed of the initial product category tree (fa only)."

    def handle(self, *args, **options):
        created_cats = 0
        created_trans = 0
        order = 0
        for parent_title, children in TREE.items():
            order += 1
            parent, cc, ct = self._ensure(None, parent_title, order)
            created_cats += cc
            created_trans += ct
            for i, child_title in enumerate(children, start=1):
                _, cc, ct = self._ensure(parent, child_title, i)
                created_cats += cc
                created_trans += ct
        self.stdout.write(self.style.SUCCESS(f"categories created: {created_cats}, translations created: {created_trans}"))

    def _ensure(self, parent, title, order):
        slug = slugify(title, allow_unicode=True) or f"cat-{order}"
        base = slug
        cat = ProductCategory.objects.filter(
            parent=parent, translations__language="fa", translations__title=title,
        ).first()
        if cat is None:
            n = 1
            candidate = slug
            while ProductCategory.objects.filter(slug=candidate).exists():
                n += 1
                candidate = f"{base}-{n}"
            cat = ProductCategory.objects.create(
                slug=candidate, parent=parent, sort_order=order,
            )
            created_cat = 1
        else:
            created_cat = 0
            if cat.sort_order != order:
                cat.sort_order = order
                cat.save(update_fields=["sort_order"])
        _, was_t = ProductCategoryTranslation.objects.get_or_create(
            category=cat, language="fa", defaults={"title": title},
        )
        return cat, created_cat, (1 if was_t else 0)
