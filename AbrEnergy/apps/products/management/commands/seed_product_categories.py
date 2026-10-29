from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.products.models import ProductCategory
from apps.products.translation_models import ProductCategoryTranslation

TREE = {
    "پکیج‌های خورشیدی": ["آپارتمان", "ویلا", "داروخانه", "مطب پزشکی", "پارکینگ سرپوشیده", "آبرسانی زمین کشاورزی", "کانکس سبز"],
    "پکیج‌های برق اضطراری": ["آپارتمان", "ویلا", "داروخانه", "مطب پزشکی"],
    "سازه خورشیدی": ["سقف مسطح", "سقف شیروانی", "سازه کوبشی در خاک"],
    "ساپورت مدولار تأسیساتی": ["پروفیل", "بست لوله", "سینی کابل", "اتصالات و متعلقات"],
}


class Command(BaseCommand):
    help = "Idempotent seed/sync of the product category tree (fa only)."

    def handle(self, *args, **options):
        created_cats = 0
        created_trans = 0
        renamed = 0
        order = 0
        for parent_title, children in TREE.items():
            order += 1
            _, cc, ct, rc = self._ensure(None, parent_title, order)
            created_cats += cc
            created_trans += ct
            renamed += rc
            for i, child_title in enumerate(children, start=1):
                _, cc, ct, rc = self._ensure(parent_title, child_title, i)
                created_cats += cc
                created_trans += ct
                renamed += rc
        self.stdout.write(
            self.style.SUCCESS(
                f"categories created: {created_cats}, translations created: {created_trans}, renamed: {renamed}"
            )
        )

    def _parent_instance(self, parent_title):
        if parent_title is None:
            return None
        return ProductCategory.objects.filter(
            parent__isnull=True, translations__language="fa", translations__title=parent_title
        ).first()

    def _ensure(self, parent_title, title, order):
        parent = self._parent_instance(parent_title)
        cat = ProductCategory.objects.filter(
            parent=parent, translations__language="fa", translations__title=title,
        ).first()
        if cat is None:
            # Rename-in-place fallback (keeps slug/URL + attached products):
            # match the existing node by position within the same parent.
            cat = ProductCategory.objects.filter(parent=parent, sort_order=order).first()
        renamed = 0
        if cat is None:
            slug = slugify(title, allow_unicode=True) or f"cat-{order}"
            base = slug
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
        tr, was_t = ProductCategoryTranslation.objects.get_or_create(
            category=cat, language="fa",
        )
        new_title = 0
        if tr.title != title:
            tr.title = title
            tr.save(update_fields=["title"])
            renamed = 0 if was_t else 1
        return cat, created_cat, (1 if was_t else 0), renamed
