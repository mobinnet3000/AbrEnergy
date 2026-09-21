import pytest
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.test import APIClient
from apps.articles.models import Article, Category
from apps.articles.translation_models import ArticleTranslation
from apps.services.models import Service, ServiceCategory
from apps.services.translation_models import ServiceTranslation
from apps.projects.models import Project
from apps.projects.translation_models import ProjectTranslation
from apps.users.models import User


def make_article(title="Solar Test", lang="fa"):
    article = Article.objects.create(status="published")
    ArticleTranslation.objects.create(
        article=article, language=lang, title=title,
        slug=f"{title.lower().replace(' ', '-')}-{lang}",
        short_description="short", content="<p>body</p>",
    )
    return article


@pytest.mark.django_db
class TranslatedSearchTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_article_search_no_fielderror(self):
        make_article(title="UniqueSolarPanel")
        res = self.client.get("/api/v1/articles/", {"search": "UniqueSolarPanel"})
        assert res.status_code == 200
        results = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
        assert any("UniqueSolarPanel" in (r.get("title") or "") for r in results)

    def test_service_search(self):
        cat = ServiceCategory.objects.create(title="Cat", slug="cat")
        svc = Service.objects.create(category=cat)
        ServiceTranslation.objects.create(
            service=svc, language="fa", title="UniqueServiceX",
            slug="uniqueservicex", short_description="s", description="d",
        )
        res = self.client.get("/api/v1/services/", {"search": "UniqueServiceX"})
        assert res.status_code == 200

    def test_project_search(self):
        proj = Project.objects.create(project_type="on_grid")
        ProjectTranslation.objects.create(
            project=proj, language="fa", title="UniqueProjectY",
            slug="uniqueprojecty", description="d",
        )
        res = self.client.get("/api/v1/projects/", {"search": "UniqueProjectY"})
        assert res.status_code == 200

    def test_article_list_query_count(self):
        for i in range(5):
            make_article(title=f"Bulk {i}")
        with CaptureQueriesContext(connection) as ctx:
            res = self.client.get("/api/v1/articles/")
            assert res.status_code == 200
        assert len(ctx) < 20, f"too many queries: {len(ctx)}"

    def test_rich_text_sanitized_on_save(self):
        article = make_article()
        t = ArticleTranslation.objects.get(article=article, language="fa")
        t.content = '<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)">'
        t.save()
        t.refresh_from_db()
        assert "<script" not in t.content
        assert "javascript:" not in t.content
        assert "onerror" not in t.content
        assert "<p>ok</p>" in t.content

    def test_detail_by_translation_slug(self):
        article = make_article(title="Slug Article")
        t = article.translations.get(language="fa")
        res = self.client.get(f"/api/v1/articles/{t.slug}/")
        assert res.status_code == 200
        assert res.data["title"] == "Slug Article"
