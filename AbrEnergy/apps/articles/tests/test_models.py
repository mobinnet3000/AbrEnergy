import pytest
from django.test import TestCase
from apps.articles.models import Article, Category, Tag
from apps.users.models import User


class ArticleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="author@test.com", password="pass",
            full_name="Author",
        )
        self.category = Category.objects.create(title="Test Category")

    def test_create_article(self):
        article = Article.objects.create(
            title="Test Article",
            short_description="Short desc",
            content="Content here",
            author=self.user,
            category=self.category,
            status="published",
        )
        assert article.slug == "test-article"
        assert str(article) == "Test Article"

    def test_article_status_default(self):
        article = Article.objects.create(
            title="Draft Article",
            short_description="Desc",
            content="Content",
        )
        assert article.status == "draft"
