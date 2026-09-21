"""Phase 7 regression tests: Homepage CMS (apps.homepage).

Covers: singleton + bootstrap defaults, section ordering/visibility, hero
CTA validation, relation ordering + duplicate prevention, public-only
filtering per entity, SEO persistence, permissions, public response shape,
and a query-count guard against N+1.
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.test import APIClient

from apps.articles.models import Article
from apps.articles.translation_models import ArticleTranslation
from apps.homepage.models import (
    HERO_SLOGAN_DEFAULT,
    HomepageArticle,
    HomepageCategory,
    HomepageConfig,
    HomepageFeaturedProduct,
    HomepageProject,
    HomepageSection,
    HomepageService,
    HomepageVisual,
)
from apps.homepage.services import ensure_default_sections
from apps.products.tests.test_phase2 import (
    make_category,
    make_cat_tr,
    make_image_file,
    make_product,
    make_tr,
)
from apps.projects.models import Project
from apps.projects.translation_models import ProjectTranslation
from apps.services.models import Service
from apps.services.translation_models import ServiceTranslation
from apps.users.models import User


PUBLIC = "/api/v1/homepage/"
ADMIN = "/api/v1/admin/homepage/"


def make_editor(email="hp-ed@test.com"):
    return User.objects.create_user(email=email, password="p", full_name="E", role="content_manager")


def make_customer(email="hp-cu@test.com"):
    return User.objects.create_user(email=email, password="p", full_name="C")


def make_service(title="خدمت", status="active", order=0):
    svc = Service.objects.create(status=status, order=order)
    ServiceTranslation.objects.create(service=svc, language="fa", title=title, slug=f"svc-{svc.id}")
    return svc


def make_project(title="پروژه", status="completed"):
    prj = Project.objects.create(status=status, location="تهران")
    ProjectTranslation.objects.create(project=prj, language="fa", title=title, slug=f"prj-{prj.id}")
    return prj


def make_article(title="مقاله", status="published"):
    art = Article.objects.create(status=status)
    ArticleTranslation.objects.create(article=art, language="fa", title=title, slug=f"art-{art.id}")
    return art


@pytest.mark.django_db
class SingletonTest(TestCase):
    def test_singleton_pk_and_defaults(self):
        cfg = HomepageConfig.load()
        assert HomepageConfig.objects.count() == 1
        # UUID PK coerces int 1 (same as SiteSettings); singleton = one row.
        second = HomepageConfig.load()
        assert second.pk == cfg.pk
        assert HomepageConfig.objects.count() == 1

    def test_bootstrap_creates_eight_sections_idempotent(self):
        assert ensure_default_sections() == 8
        assert HomepageSection.objects.count() == 8
        assert ensure_default_sections() == 0
        assert HomepageSection.objects.count() == 8

    def test_hero_default_carries_brand_slogan(self):
        ensure_default_sections()
        hero = HomepageSection.objects.get(key="hero")
        assert hero.title == HERO_SLOGAN_DEFAULT == "طلوع آفتاب، از خانه شماست"
        assert hero.enabled is True

    def test_section_ordering(self):
        ensure_default_sections()
        keys = list(HomepageSection.objects.values_list("key", flat=True))
        assert keys[0] == "hero"
        assert keys.index("featured_products") < keys.index("contact")


@pytest.mark.django_db
class HeroValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=make_editor())

    def test_cta_round_trip(self):
        res = self.client.patch(ADMIN, {
            "hero_primary_cta_label": "دیدن محصولات",
            "hero_primary_cta_url": "/products",
            "hero_primary_cta_enabled": True,
        }, format="json")
        assert res.status_code == 200, res.data
        assert res.data["hero_primary_cta_label"] == "دیدن محصولات"

    def test_absolute_https_cta_accepted(self):
        res = self.client.patch(ADMIN, {"hero_primary_cta_url": "https://example.com/x"}, format="json")
        assert res.status_code == 200, res.data

    def test_bad_cta_rejected(self):
        for bad in ["javascript:alert(1)", "ftp://x/y", "//evil.com", "notaurl"]:
            res = self.client.patch(ADMIN, {"hero_primary_cta_url": bad}, format="json")
            assert res.status_code == 400, (bad, res.data)


@pytest.mark.django_db
class FeaturedProductsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_ordering_and_visibility(self):
        p1 = make_product(sku="HP-A"); make_tr(p1, title="الف")
        p2 = make_product(sku="HP-B"); make_tr(p2, title="ب")
        p3 = make_product(sku="HP-C"); make_tr(p3, title="ج")
        HomepageFeaturedProduct.objects.create(product=p2, order=1)
        HomepageFeaturedProduct.objects.create(product=p1, order=0)
        HomepageFeaturedProduct.objects.create(product=p3, order=2, enabled=False)
        res = self.client.get(PUBLIC)
        assert res.status_code == 200, res.data
        assert [p["sku"] for p in res.data["featured_products"]] == ["HP-A", "HP-B"]

    def test_duplicate_prevented(self):
        p = make_product(sku="HP-DUP"); make_tr(p, title="تکراری")
        HomepageFeaturedProduct.objects.create(product=p, order=0)
        with pytest.raises(IntegrityError):
            HomepageFeaturedProduct.objects.create(product=p, order=1)

    def test_unpublished_excluded(self):
        for sku, kwargs in [
            ("HP-DRAFT", {"status": "draft"}),
            ("HP-ARCH", {"status": "archived"}),
            ("HP-HID", {"visibility": "hidden"}),
            ("HP-INACT", {"active": False}),
        ]:
            p = make_product(sku=sku, **kwargs); make_tr(p, title=sku)
            HomepageFeaturedProduct.objects.create(product=p, order=0)
        res = self.client.get(PUBLIC)
        assert res.status_code == 200, res.data
        assert res.data["featured_products"] == []


@pytest.mark.django_db
class CategoryServiceProjectArticleTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_categories_ordering_and_inactive_exclusion(self):
        c1 = make_category(slug="hp-c1", order=5); make_cat_tr(c1, title="یک")
        c2 = make_category(slug="hp-c2", order=1); make_cat_tr(c2, title="دو")
        c3 = make_category(slug="hp-c3", active=False); make_cat_tr(c3, title="غیرفعال")
        HomepageCategory.objects.create(category=c1, order=0)
        HomepageCategory.objects.create(category=c2, order=1)
        HomepageCategory.objects.create(category=c3, order=0)
        res = self.client.get(PUBLIC)
        assert [c["slug"] for c in res.data["categories"]] == ["hp-c1", "hp-c2"]

    def test_services_public_filtering(self):
        s1 = make_service(title="فعال")
        s2 = make_service(title="غیرفعال", status="inactive")
        HomepageService.objects.create(service=s1, order=1)
        HomepageService.objects.create(service=s2, order=0)
        res = self.client.get(PUBLIC)
        titles = [s["title"] for s in res.data["services"]]
        assert titles == ["فعال"]

    def test_projects_cancelled_excluded(self):
        p1 = make_project(title="تکمیل‌شده")
        p2 = make_project(title="لغوشده", status="cancelled")
        HomepageProject.objects.create(project=p2, order=0)
        HomepageProject.objects.create(project=p1, order=1)
        res = self.client.get(PUBLIC)
        assert [p["title"] for p in res.data["projects"]] == ["تکمیل‌شده"]

    def test_articles_pinned_and_draft_excluded(self):
        a1 = make_article(title="منتشر")
        a2 = make_article(title="پیش‌نویس", status="draft")
        HomepageArticle.objects.create(article=a1, order=1)
        HomepageArticle.objects.create(article=a2, order=0)
        res = self.client.get(PUBLIC)
        assert [a["title"] for a in res.data["articles"]] == ["منتشر"]

    def test_articles_fallback_latest_when_no_pins(self):
        make_article(title="قدیمی")
        make_article(title="جدید")
        res = self.client.get(PUBLIC)
        assert len(res.data["articles"]) == 2
        assert {a["title"] for a in res.data["articles"]} == {"قدیمی", "جدید"}


@pytest.mark.django_db
class SeoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=make_editor())

    def test_seo_persistence(self):
        res = self.client.patch(ADMIN, {
            "seo_title": "ابر انرژی | خانه",
            "seo_description": "توضیح سئو",
            "canonical_url": "https://abrenv.com/fa",
            "robots": "noindex_follow",
            "og_title": "OG",
            "og_description": "OG desc",
        }, format="json")
        assert res.status_code == 200, res.data
        pub = self.client.get(PUBLIC)
        assert pub.data["seo"]["title"] == "ابر انرژی | خانه"
        assert pub.data["seo"]["robots"] == "noindex_follow"
        assert pub.data["seo"]["canonical_url"] == "https://abrenv.com/fa"

    def test_bad_robots_rejected(self):
        res = self.client.patch(ADMIN, {"robots": "sometimes"}, format="json")
        assert res.status_code == 400, res.data


@pytest.mark.django_db
class PermissionTest(TestCase):
    def test_admin_read_write(self):
        c = APIClient()
        c.force_authenticate(user=make_editor("hp-adm@test.com"))
        assert c.get(ADMIN).status_code == 200
        assert c.patch(ADMIN, {"hero_eyebrow": "متن"}, format="json").status_code == 200

    def test_customer_forbidden(self):
        c = APIClient()
        c.force_authenticate(user=make_customer())
        assert c.get(ADMIN).status_code == 403
        assert c.patch(ADMIN, {"hero_eyebrow": "x"}, format="json").status_code == 403

    def test_anonymous_forbidden_public_open(self):
        c = APIClient()
        assert c.get(ADMIN).status_code in (401, 403)
        assert c.patch(ADMIN, {"hero_eyebrow": "x"}, format="json").status_code in (401, 403)
        assert c.get(PUBLIC).status_code == 200


@pytest.mark.django_db
class PublicShapeTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_response_shape(self):
        res = self.client.get(PUBLIC)
        assert res.status_code == 200, res.data
        for key in ("hero", "sections", "featured_products", "categories",
                    "services", "calculator", "projects", "articles",
                    "contact", "visuals", "seo"):
            assert key in res.data, key
        assert len(res.data["sections"]) == 8
        hero = res.data["hero"]
        assert hero["title"] == HERO_SLOGAN_DEFAULT
        assert set(hero["primary_cta"]) == {"label", "url", "enabled"}

    def test_disabled_section_flagged(self):
        ensure_default_sections()
        HomepageSection.objects.filter(key="projects").update(enabled=False)
        res = self.client.get(PUBLIC)
        projects = [s for s in res.data["sections"] if s["key"] == "projects"]
        assert projects and projects[0]["enabled"] is False

    def test_no_draft_leakage_in_shape(self):
        p = make_product(sku="HP-LEAK", status="draft"); make_tr(p, title="نشت")
        HomepageFeaturedProduct.objects.create(product=p, order=0)
        res = self.client.get(PUBLIC)
        assert res.status_code == 200
        assert all(p["sku"] != "HP-LEAK" for p in res.data["featured_products"])

    def test_query_count_stays_flat(self):
        prods = []
        for i in range(5):
            p = make_product(sku=f"HP-Q{i}"); make_tr(p, title=f"کیو{i}")
            prods.append(p)
            HomepageFeaturedProduct.objects.create(product=p, order=i)
        cats = []
        for i in range(3):
            c = make_category(slug=f"hp-qc{i}"); make_cat_tr(c, title=f"دسته{i}")
            cats.append(c)
            HomepageCategory.objects.create(category=c, order=i)
        for i in range(3):
            HomepageService.objects.create(service=make_service(title=f"سرو{i}"), order=i)
            HomepageProject.objects.create(project=make_project(title=f"پر{i}"), order=i)
            HomepageArticle.objects.create(article=make_article(title=f"مق{i}"), order=i)
        with CaptureQueriesContext(connection) as ctx:
            res = self.client.get(PUBLIC)
        assert res.status_code == 200
        # 5 products + 3 cats + 3 svc + 3 prj + 3 art + sections/config/visuals:
        # must stay far below one-query-per-field territory (~200 in Phase 0).
        assert len(ctx) < 60, f"{len(ctx)} queries"
