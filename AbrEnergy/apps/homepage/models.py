"""Phase 7 — Homepage CMS models.

Design (see docs/reports/phase-07-preflight.md §9):
- ``HomepageConfig``: code-enforced singleton (pk=1, same pattern as
  ``SiteSettings``) holding hero CTAs, calculator/contact CTA copy, the
  articles display count, and the 7 homepage SEO fields.
- ``HomepageSection``: one row per section key owning copy (title /
  subtitle / content), visibility (``enabled``) and ordering (``order``).
- Relation tables (``HomepageFeaturedProduct``, ``HomepageCategory``,
  ``HomepageService``, ``HomepageProject``, ``HomepageArticle``): relation
  + order + visibility ONLY. Titles, images, prices and descriptions are
  always read from the source-of-truth models at serve time.
- ``HomepageVisual``: floating hero visuals (MediaFile FK + alt + order +
  enabled + optional link). No pixel-position editor (Phase 7 scope).

Persian-first: copy fields are plain fa ``CharField``/``TextField``
(SiteSettings pattern). No translation tables in this phase; ar/en
translation infrastructure elsewhere is untouched.
"""
import uuid

from django.core.exceptions import ValidationError
from django.db import models


HERO_SLOGAN_DEFAULT = "طلوع آفتاب، از خانه شماست"

SECTION_KEYS = [
    ("hero", "Hero"),
    ("featured_products", "Featured Products"),
    ("categories", "Categories"),
    ("services", "Services"),
    ("calculator", "Calculator"),
    ("projects", "Projects"),
    ("articles", "Articles"),
    ("contact", "Contact"),
]

# Idempotent seed rows: (key, order, title, subtitle, content). Copy mirrors
# the live fa.json `home.*` strings so the first render is byte-identical
# to the pre-CMS homepage.
DEFAULT_SECTIONS = [
    ("hero", 10, HERO_SLOGAN_DEFAULT, "", ""),
    ("featured_products", 20, "محصولات ویژه", "منتخبی از راهکارهای خورشیدی ابر انرژی", ""),
    ("categories", 30, "راهکارها، متناسب با نیاز شما", "دسته‌بندی محصولات را مرور کنید و وارد کاتالوگ شوید", ""),
    ("services", 40, "خدمات ما", "راهکارهای جامع انرژی خورشیدی از طراحی تا بهره‌برداری", ""),
    ("calculator", 50, "سیستم خورشیدی خود را طراحی کنید", "", "اندازه سیستم، ظرفیت باتری، توان اینورتر و بازگشت سرمایه خود را در چند دقیقه تخمین بزنید."),
    ("projects", 60, "پروژه‌های برگزیده", "آخرین و بزرگترین پروژه‌های نصب شده", ""),
    ("articles", 70, "آخرین مقالات", "آخرین مطالب و راهنماهای انرژی خورشیدی", ""),
    ("contact", 80, "آماده شروع پروژه خورشیدی خود هستید؟", "", "برای مشاوره رایگان و راهکار شخصی‌سازی شده با تیم ما تماس بگیرید."),
]

ROBOT_CHOICES = [
    ("index_follow", "Index, Follow"),
    ("noindex_follow", "Noindex, Follow"),
    ("index_nofollow", "Index, Nofollow"),
    ("noindex_nofollow", "Noindex, Nofollow"),
]


def validate_cta_url(value):
    """Allow blank, site-relative paths (``/products``) or http(s) URLs."""
    if not value:
        return
    if value.startswith("/"):
        if value.startswith("//"):
            raise ValidationError("URL must not start with '//'.")
        return
    if value.startswith("http://") or value.startswith("https://"):
        return
    raise ValidationError("URL must be a site-relative path starting with '/' or an http(s) URL.")


class HomepageConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hero CTAs (hero copy itself lives on the `hero` HomepageSection row).
    hero_eyebrow = models.CharField(max_length=255, blank=True, default="")
    hero_primary_cta_label = models.CharField(max_length=255, blank=True, default="مشاهده محصولات")
    hero_primary_cta_url = models.CharField(max_length=500, blank=True, default="/products", validators=[validate_cta_url])
    hero_primary_cta_enabled = models.BooleanField(default=True)
    hero_secondary_cta_label = models.CharField(max_length=255, blank=True, default="محاسبه سیستم خورشیدی")
    hero_secondary_cta_url = models.CharField(max_length=500, blank=True, default="/calculator", validators=[validate_cta_url])
    hero_secondary_cta_enabled = models.BooleanField(default=True)

    # Calculator teaser CTA (calculator copy lives on its section row).
    calculator_cta_label = models.CharField(max_length=255, blank=True, default="شروع محاسبه")
    calculator_cta_url = models.CharField(max_length=500, blank=True, default="/calculator", validators=[validate_cta_url])

    # Contact CTA (contact copy lives on its section row; contact DETAILS
    # such as phone/email/address stay in SiteSettings — never duplicated).
    contact_cta_label = models.CharField(max_length=255, blank=True, default="تماس با ما")
    contact_cta_url = models.CharField(max_length=500, blank=True, default="/contact", validators=[validate_cta_url])
    contact_secondary_cta_label = models.CharField(max_length=255, blank=True, default="درخواست قیمت")
    contact_secondary_cta_url = models.CharField(max_length=500, blank=True, default="/contact", validators=[validate_cta_url])

    # Articles section behaviour: pinned rows first, latest published fills
    # up to this count when pins are absent/short.
    articles_count = models.PositiveIntegerField(default=3)

    # Homepage SEO (same 7-field shape as Product/ProductCategory).
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    canonical_url = models.URLField(blank=True, default="")
    robots = models.CharField(max_length=20, choices=ROBOT_CHOICES, default="index_follow")
    og_title = models.CharField(max_length=255, blank=True, default="")
    og_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="homepage_as_og",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Homepage Config"
        verbose_name_plural = "Homepage Config"

    def __str__(self):
        return "Homepage"

    def save(self, *args, **kwargs):
        # Code-enforced singleton, mirroring SiteSettings.
        self.pk = 1
        self.full_clean(exclude=["og_image"])
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class HomepageSection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=32, choices=SECTION_KEYS, unique=True, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    title = models.CharField(max_length=500, blank=True, default="")
    subtitle = models.CharField(max_length=500, blank=True, default="")
    content = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Homepage Section"
        verbose_name_plural = "Homepage Sections"
        ordering = ["order", "key"]

    def __str__(self):
        return self.key


class HomepageFeaturedProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.OneToOneField(
        "products.Product", on_delete=models.CASCADE, related_name="homepage_feature",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Homepage Featured Product"
        verbose_name_plural = "Homepage Featured Products"
        ordering = ["order", "id"]

    def __str__(self):
        return f"featured:{self.product_id} order={self.order}"


class HomepageCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.OneToOneField(
        "products.ProductCategory", on_delete=models.CASCADE, related_name="homepage_entry",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Homepage Category"
        verbose_name_plural = "Homepage Categories"
        ordering = ["order", "id"]


class HomepageService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.OneToOneField(
        "services.Service", on_delete=models.CASCADE, related_name="homepage_entry",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Homepage Service"
        verbose_name_plural = "Homepage Services"
        ordering = ["order", "id"]


class HomepageProject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(
        "projects.Project", on_delete=models.CASCADE, related_name="homepage_entry",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Homepage Project"
        verbose_name_plural = "Homepage Projects"
        ordering = ["order", "id"]


class HomepageArticle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.OneToOneField(
        "articles.Article", on_delete=models.CASCADE, related_name="homepage_entry",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Homepage Article"
        verbose_name_plural = "Homepage Articles"
        ordering = ["order", "id"]


class HomepageVisual(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE, related_name="homepage_visuals",
    )
    alt = models.CharField(max_length=500, blank=True, default="")
    order = models.PositiveIntegerField(default=0, db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)
    link_url = models.CharField(max_length=500, blank=True, default="", validators=[validate_cta_url])

    class Meta:
        verbose_name = "Homepage Visual"
        verbose_name_plural = "Homepage Visuals"
        ordering = ["order", "id"]

    def __str__(self):
        return f"visual order={self.order}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
