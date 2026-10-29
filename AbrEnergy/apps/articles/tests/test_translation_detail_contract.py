import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.articles.models import Article
from apps.articles.translation_models import ArticleTranslation
from apps.projects.models import Project
from apps.projects.translation_models import ProjectTranslation
from apps.services.models import Service, ServiceCategory
from apps.services.translation_models import ServiceTranslation
from apps.users.models import User


@pytest.mark.django_db
class ContentTranslationDetailContractTest(TestCase):
    def setUp(self):
        self.anonymous = APIClient()
        self.admin = APIClient()
        self.admin.force_authenticate(
            user=User.objects.create_user(
                email="content-admin@example.com", password="p", role="super_admin"
            )
        )

    def test_article_detail_exposes_translations_only_to_authenticated_admin(self):
        article = Article.objects.create(status="published")
        ArticleTranslation.objects.create(
            article=article,
            language="fa",
            title="مقاله",
            slug="article-fa",
            short_description="خلاصه",
            content="<p>متن</p>",
        )
        ArticleTranslation.objects.create(
            article=article,
            language="en",
            title="Article",
            slug="article-en",
            short_description="Summary",
            content="<p>Body</p>",
        )

        public_res = self.anonymous.get("/api/v1/articles/article-fa/")
        assert public_res.status_code == 200
        assert public_res.data["translations"] == {}

        admin_res = self.admin.get(f"/api/v1/admin/articles/{article.pk}/")
        assert admin_res.status_code == 200
        translations = admin_res.data["translations"]
        assert set(translations) == {"fa", "en"}
        assert translations["fa"]["title"] == "مقاله"
        assert translations["en"]["slug"] == "article-en"
        assert translations["fa"]["content"] == "<p>متن</p>"

    def test_service_detail_exposes_translations_only_to_authenticated_admin(self):
        category = ServiceCategory.objects.create(title="Cat", slug="cat")
        service = Service.objects.create(category=category)
        ServiceTranslation.objects.create(
            service=service,
            language="fa",
            title="خدمت",
            slug="service-fa",
            short_description="خلاصه",
            description="توضیح",
        )

        public_res = self.anonymous.get("/api/v1/services/service-fa/")
        assert public_res.status_code == 200
        assert public_res.data["translations"] == {}

        admin_res = self.admin.get(f"/api/v1/admin/services/{service.pk}/")
        assert admin_res.status_code == 200
        assert admin_res.data["translations"]["fa"]["title"] == "خدمت"
        assert admin_res.data["translations"]["fa"]["description"] == "توضیح"

    def test_project_detail_exposes_translations_only_to_authenticated_admin(self):
        project = Project.objects.create(project_type="on_grid")
        ProjectTranslation.objects.create(
            project=project,
            language="fa",
            title="پروژه",
            slug="project-fa",
            description="توضیح",
        )

        public_res = self.anonymous.get("/api/v1/projects/project-fa/")
        assert public_res.status_code == 200
        assert public_res.data["translations"] == {}

        admin_res = self.admin.get(f"/api/v1/admin/projects/{project.pk}/")
        assert admin_res.status_code == 200
        assert admin_res.data["translations"]["fa"]["title"] == "پروژه"
        assert admin_res.data["translations"]["fa"]["description"] == "توضیح"
