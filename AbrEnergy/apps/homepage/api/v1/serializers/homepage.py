"""Phase 7 — Homepage CMS serializers.

Public: ``build_homepage_payload(language)`` composes the whole homepage in
a fixed shape. Every nested entity is serialized with its OWN existing
list serializer (products, categories, services, projects, articles) so no
field, price state, or visibility rule is duplicated here.

Admin: ``HomepageAdminSerializer`` (read) + ``HomepageWriteSerializer``
(write with replace-on-update nested relations, Phase 4 semantics).
"""
from django.db import transaction
from django.db.models import Prefetch
from rest_framework import serializers

from apps.articles.api.v1.serializers.article import ArticleListSerializer
from apps.articles.models import Article
from apps.homepage.models import (
    SECTION_KEYS,
    HomepageArticle,
    HomepageCategory,
    HomepageConfig,
    HomepageFeaturedProduct,
    HomepageProject,
    HomepageSection,
    HomepageService,
    HomepageVisual,
    validate_cta_url,
)
from apps.homepage.services import ensure_default_sections, get_homepage_config
from apps.media_manager.models import MediaFile
from apps.products.api.v1.serializers.products import (
    CategoryTreeSerializer,
    ProductListSerializer,
)
from apps.products.api.v1.views.products import public_product_qs
from apps.products.models import ProductCategory
from apps.projects.api.v1.serializers.project import ProjectListSerializer
from apps.projects.models import Project, ProjectImage
from apps.services.api.v1.serializers.service import ServiceListSerializer
from apps.services.models import Service


SECTION_KEY_SET = {key for key, _ in SECTION_KEYS}


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
class HomepageSectionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageSection
        fields = ["key", "enabled", "order", "title", "subtitle", "content"]


class HomepageVisualPublicSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomepageVisual
        fields = ["id", "image_url", "alt", "order", "link_url"]

    def get_image_url(self, obj):
        try:
            return obj.image.file.url if obj.image_id else ""
        except Exception:
            return ""


def _ordered_by_relation(objects, id_to_order, id_attr="id"):
    order = {str(k): v for k, v in id_to_order.items()}
    return sorted(objects, key=lambda o: (order.get(str(getattr(o, id_attr)), 10**9), str(getattr(o, id_attr))))


def build_homepage_payload(language="fa"):
    """Compose the public homepage. Only publicly visible rows are exposed:

    - products: ``public_product_qs()`` (published + public + active)
    - categories: ``is_active=True``
    - services: ``status=active``
    - projects: everything except ``cancelled`` (the model has no
      draft/hidden/inactive state; the existing public endpoints expose the
      same set)
    - articles: ``status=published``
    """
    config = get_homepage_config()
    ensure_default_sections()
    sections = list(HomepageSection.objects.order_by("order", "key"))
    by_key = {s.key: s for s in sections}

    def section(key):
        return by_key.get(key)

    def copy(key):
        s = section(key)
        return {
            "title": s.title if s else "",
            "subtitle": s.subtitle if s else "",
            "description": s.content if s else "",
            "enabled": s.enabled if s else True,
        }

    ctx = {"language": language or "fa"}

    # -- featured products (CMS order, public-only) -------------------------
    fp_rows = list(
        HomepageFeaturedProduct.objects.filter(enabled=True)
        .select_related("product").order_by("order", "id")
    )
    fp_order = {str(r.product_id): r.order for r in fp_rows}
    fp_ids = list(fp_order.keys())
    products = []
    if fp_ids:
        qs = public_product_qs().filter(id__in=fp_ids)
        products = _ordered_by_relation(list(qs), fp_order)
    featured_products = ProductListSerializer(products, many=True, context=ctx).data

    # -- categories (CMS order, active-only) --------------------------------
    cat_rows = list(
        HomepageCategory.objects.filter(enabled=True)
        .select_related("category").order_by("order", "id")
    )
    cat_order = {str(r.category_id): r.order for r in cat_rows}
    categories = []
    if cat_order:
        qs = (
            ProductCategory.objects.filter(is_active=True, id__in=list(cat_order.keys()))
            .select_related("parent")
            .prefetch_related("translations", "children__translations")
        )
        categories = _ordered_by_relation(list(qs), cat_order)
    categories_data = CategoryTreeSerializer(categories, many=True, context=ctx).data

    # -- services (CMS order, active-only) ----------------------------------
    svc_rows = list(
        HomepageService.objects.filter(enabled=True)
        .select_related("service").order_by("order", "id")
    )
    svc_order = {str(r.service_id): r.order for r in svc_rows}
    services = []
    if svc_order:
        qs = (
            Service.objects.filter(status="active", id__in=list(svc_order.keys()))
            .select_related("category", "image")
            .prefetch_related("translations")
        )
        services = _ordered_by_relation(list(qs), svc_order)
    services_data = ServiceListSerializer(services, many=True, context=ctx).data

    # -- projects (CMS order, cancelled excluded) ---------------------------
    prj_rows = list(
        HomepageProject.objects.filter(enabled=True)
        .select_related("project").order_by("order", "id")
    )
    prj_order = {str(r.project_id): r.order for r in prj_rows}
    projects = []
    if prj_order:
        qs = (
            Project.objects.exclude(status="cancelled")
            .filter(id__in=list(prj_order.keys()))
            .select_related("service_category")
            .prefetch_related(
                "translations",
                Prefetch("images", queryset=ProjectImage.objects.select_related("media_file")),
            )
        )
        projects = _ordered_by_relation(list(qs), prj_order)
    projects_data = ProjectListSerializer(projects, many=True, context=ctx).data

    # -- articles: pinned first, latest published fills up to count --------
    art_rows = list(
        HomepageArticle.objects.filter(enabled=True)
        .select_related("article").order_by("order", "id")
    )
    art_order = {str(r.article_id): r.order for r in art_rows}
    article_qs_base = (
        Article.objects.filter(status="published")
        .select_related("author", "category", "cover_image")
        .prefetch_related("tags", "translations")
    )
    pinned = []
    if art_order:
        pinned = _ordered_by_relation(list(article_qs_base.filter(id__in=list(art_order.keys()))), art_order)
    count = max(0, config.articles_count or 0)
    articles = list(pinned[:count]) if count else []
    if len(articles) < count:
        pinned_ids = [a.id for a in articles]
        fill = article_qs_base.exclude(id__in=pinned_ids).order_by("-publish_date", "-created_at")[: max(0, count - len(articles))]
        articles = articles + list(fill)
    articles_data = ArticleListSerializer(articles, many=True, context=ctx).data

    # -- visuals -------------------------------------------------------------
    visuals = list(
        HomepageVisual.objects.filter(enabled=True)
        .select_related("image").order_by("order", "id")
    )
    visuals_data = HomepageVisualPublicSerializer(visuals, many=True).data

    hero = copy("hero")
    calculator = copy("calculator")
    contact = copy("contact")

    try:
        og_image_url = config.og_image.file.url if config.og_image_id else ""
    except Exception:
        og_image_url = ""

    return {
        "hero": {
            "eyebrow": config.hero_eyebrow or "",
            "title": hero["title"],
            "subtitle": hero["subtitle"],
            "primary_cta": {
                "label": config.hero_primary_cta_label or "",
                "url": config.hero_primary_cta_url or "",
                "enabled": config.hero_primary_cta_enabled,
            },
            "secondary_cta": {
                "label": config.hero_secondary_cta_label or "",
                "url": config.hero_secondary_cta_url or "",
                "enabled": config.hero_secondary_cta_enabled,
            },
            "enabled": hero["enabled"],
        },
        "sections": HomepageSectionPublicSerializer(sections, many=True).data,
        "featured_products": featured_products,
        "categories": categories_data,
        "services": services_data,
        "calculator": {
            "title": calculator["title"],
            "subtitle": calculator["subtitle"],
            "description": calculator["description"],
            "cta_label": config.calculator_cta_label or "",
            "cta_url": config.calculator_cta_url or "",
            "enabled": calculator["enabled"],
        },
        "projects": projects_data,
        "articles": articles_data,
        "contact": {
            "title": contact["title"],
            "subtitle": contact["subtitle"],
            "description": contact["description"],
            "cta_label": config.contact_cta_label or "",
            "cta_url": config.contact_cta_url or "",
            "secondary_cta": {
                "label": config.contact_secondary_cta_label or "",
                "url": config.contact_secondary_cta_url or "",
            },
            "enabled": contact["enabled"],
        },
        "visuals": visuals_data,
        "seo": {
            "title": config.seo_title or "",
            "description": config.seo_description or "",
            "canonical_url": config.canonical_url or "",
            "robots": config.robots or "index_follow",
            "og_title": config.og_title or "",
            "og_description": config.og_description or "",
            "og_image_url": og_image_url,
        },
    }


# ---------------------------------------------------------------------------
# Admin (read)
# ---------------------------------------------------------------------------
class HomepageRelationReadSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    enabled = serializers.BooleanField()


class HomepageAdminSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    featured_products = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    articles = serializers.SerializerMethodField()
    visuals = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomepageConfig
        fields = [
            "hero_eyebrow",
            "hero_primary_cta_label", "hero_primary_cta_url", "hero_primary_cta_enabled",
            "hero_secondary_cta_label", "hero_secondary_cta_url", "hero_secondary_cta_enabled",
            "calculator_cta_label", "calculator_cta_url",
            "contact_cta_label", "contact_cta_url",
            "contact_secondary_cta_label", "contact_secondary_cta_url",
            "articles_count",
            "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image", "og_image_url",
            "updated_at",
            "sections", "featured_products", "categories", "services",
            "projects", "articles", "visuals",
        ]
        read_only_fields = ["updated_at", "og_image_url"]

    def get_sections(self, obj):
        ensure_default_sections()
        rows = HomepageSection.objects.order_by("order", "key")
        return HomepageSectionPublicSerializer(rows, many=True).data

    def _lang(self):
        return (self.context or {}).get("language", "fa")

    def _title_of(self, obj, fk_name):
        target = getattr(obj, fk_name, None)
        if target is None:
            return ""
        try:
            t = target.get_translation(self._lang()) or target.get_translation("fa")
        except Exception:
            return ""
        return t.title if t else str(getattr(target, "id", ""))

    def get_featured_products(self, obj):
        rows = HomepageFeaturedProduct.objects.select_related("product").prefetch_related(
            "product__translations"
        ).order_by("order", "id")
        return [{"product": str(r.product_id), "title": self._title_of(r, "product"), "order": r.order, "enabled": r.enabled} for r in rows]

    def get_categories(self, obj):
        rows = HomepageCategory.objects.select_related("category").prefetch_related(
            "category__translations"
        ).order_by("order", "id")
        return [{"category": str(r.category_id), "title": self._title_of(r, "category"), "order": r.order, "enabled": r.enabled} for r in rows]

    def get_services(self, obj):
        rows = HomepageService.objects.select_related("service").prefetch_related(
            "service__translations"
        ).order_by("order", "id")
        return [{"service": str(r.service_id), "title": self._title_of(r, "service"), "order": r.order, "enabled": r.enabled} for r in rows]

    def get_projects(self, obj):
        rows = HomepageProject.objects.select_related("project").prefetch_related(
            "project__translations"
        ).order_by("order", "id")
        return [{"project": str(r.project_id), "title": self._title_of(r, "project"), "order": r.order, "enabled": r.enabled} for r in rows]

    def get_articles(self, obj):
        rows = HomepageArticle.objects.select_related("article").prefetch_related(
            "article__translations"
        ).order_by("order", "id")
        return [{"article": str(r.article_id), "title": self._title_of(r, "article"), "order": r.order, "enabled": r.enabled} for r in rows]

    def get_visuals(self, obj):
        rows = HomepageVisual.objects.select_related("image").order_by("order", "id")
        out = []
        for r in rows:
            try:
                url = r.image.file.url if r.image_id else ""
            except Exception:
                url = ""
            out.append({
                "id": str(r.id), "image": str(r.image_id) if r.image_id else None,
                "image_url": url, "alt": r.alt, "order": r.order,
                "enabled": r.enabled, "link_url": r.link_url,
            })
        return out

    def get_og_image_url(self, obj):
        try:
            return obj.og_image.file.url if obj.og_image_id else ""
        except Exception:
            return ""


# ---------------------------------------------------------------------------
# Admin (write — replace-on-update for relations, Phase 4 semantics)
# ---------------------------------------------------------------------------
class SectionWriteSerializer(serializers.Serializer):
    key = serializers.ChoiceField(choices=[k for k, _ in SECTION_KEYS])
    enabled = serializers.BooleanField(required=False)
    order = serializers.IntegerField(required=False, min_value=0)
    title = serializers.CharField(required=False, allow_blank=True, max_length=500)
    subtitle = serializers.CharField(required=False, allow_blank=True, max_length=500)
    content = serializers.CharField(required=False, allow_blank=True)


class _OrderEnabledSerializer(serializers.Serializer):
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    enabled = serializers.BooleanField(required=False, default=True)


class FeaturedProductWriteSerializer(_OrderEnabledSerializer):
    product = serializers.UUIDField()


class CategoryWriteSerializer(_OrderEnabledSerializer):
    category = serializers.UUIDField()


class ServiceWriteSerializer(_OrderEnabledSerializer):
    service = serializers.UUIDField()


class ProjectWriteSerializer(_OrderEnabledSerializer):
    project = serializers.UUIDField()


class ArticleWriteSerializer(_OrderEnabledSerializer):
    article = serializers.UUIDField()


class VisualWriteSerializer(_OrderEnabledSerializer):
    image = serializers.PrimaryKeyRelatedField(queryset=MediaFile.objects.all())
    alt = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")
    link_url = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")

    def validate_link_url(self, value):
        validate_cta_url(value)
        return value


class HomepageWriteSerializer(serializers.ModelSerializer):
    og_image = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.all(), allow_null=True, required=False,
    )
    sections_data = SectionWriteSerializer(many=True, required=False)
    featured_products_data = FeaturedProductWriteSerializer(many=True, required=False)
    categories_data = CategoryWriteSerializer(many=True, required=False)
    services_data = ServiceWriteSerializer(many=True, required=False)
    projects_data = ProjectWriteSerializer(many=True, required=False)
    articles_data = ArticleWriteSerializer(many=True, required=False)
    visuals_data = VisualWriteSerializer(many=True, required=False)

    class Meta:
        model = HomepageConfig
        fields = [
            "hero_eyebrow",
            "hero_primary_cta_label", "hero_primary_cta_url", "hero_primary_cta_enabled",
            "hero_secondary_cta_label", "hero_secondary_cta_url", "hero_secondary_cta_enabled",
            "calculator_cta_label", "calculator_cta_url",
            "contact_cta_label", "contact_cta_url",
            "contact_secondary_cta_label", "contact_secondary_cta_url",
            "articles_count", "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image",
            "sections_data", "featured_products_data", "categories_data",
            "services_data", "projects_data", "articles_data", "visuals_data",
        ]

    def _validate_cta(self, name, value):
        validate_cta_url(value)
        return value

    def validate_hero_primary_cta_url(self, value):
        return self._validate_cta("hero_primary_cta_url", value)

    def validate_hero_secondary_cta_url(self, value):
        return self._validate_cta("hero_secondary_cta_url", value)

    def validate_calculator_cta_url(self, value):
        return self._validate_cta("calculator_cta_url", value)

    def validate_contact_cta_url(self, value):
        return self._validate_cta("contact_cta_url", value)

    def validate_contact_secondary_cta_url(self, value):
        return self._validate_cta("contact_secondary_cta_url", value)

    def validate_articles_count(self, value):
        if value < 0 or value > 12:
            raise serializers.ValidationError("articles_count must be between 0 and 12.")
        return value

    def _replace(self, model, fk_name, rows, extra=()):
        model.objects.all().delete()
        objs = []
        for row in rows:
            kwargs = {
                fk_name: row[fk_name],
                "order": row.get("order", 0),
                "enabled": row.get("enabled", True),
            }
            for field in extra:
                if field in row:
                    kwargs[field] = row[field]
            objs.append(model(**kwargs))
        if objs:
            model.objects.bulk_create(objs)

    @transaction.atomic
    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections_data", None)
        featured = validated_data.pop("featured_products_data", None)
        categories = validated_data.pop("categories_data", None)
        services = validated_data.pop("services_data", None)
        projects = validated_data.pop("projects_data", None)
        articles = validated_data.pop("articles_data", None)
        visuals = validated_data.pop("visuals_data", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if sections_data is not None:
            ensure_default_sections()
            for row in sections_data:
                update = {k: v for k, v in row.items() if k != "key"}
                if update:
                    HomepageSection.objects.filter(key=row["key"]).update(**update)

        if featured is not None:
            self._replace(HomepageFeaturedProduct, "product_id", [
                {"product_id": r["product"], "order": r.get("order", 0), "enabled": r.get("enabled", True)}
                for r in featured
            ])
        if categories is not None:
            self._replace(HomepageCategory, "category_id", [
                {"category_id": r["category"], "order": r.get("order", 0), "enabled": r.get("enabled", True)}
                for r in categories
            ])
        if services is not None:
            self._replace(HomepageService, "service_id", [
                {"service_id": r["service"], "order": r.get("order", 0), "enabled": r.get("enabled", True)}
                for r in services
            ])
        if projects is not None:
            self._replace(HomepageProject, "project_id", [
                {"project_id": r["project"], "order": r.get("order", 0), "enabled": r.get("enabled", True)}
                for r in projects
            ])
        if articles is not None:
            self._replace(HomepageArticle, "article_id", [
                {"article_id": r["article"], "order": r.get("order", 0), "enabled": r.get("enabled", True)}
                for r in articles
            ])
        if visuals is not None:
            HomepageVisual.objects.all().delete()
            objs = [
                HomepageVisual(
                    image=r["image"], alt=r.get("alt", ""),
                    order=r.get("order", 0), enabled=r.get("enabled", True),
                    link_url=r.get("link_url", ""),
                )
                for r in visuals
            ]
            if objs:
                HomepageVisual.objects.bulk_create(objs)

        return instance
