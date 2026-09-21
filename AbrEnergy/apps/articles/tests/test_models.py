from django.test import TestCase
from apps.articles.models import Article, Category, Tag
from apps.articles.translation_models import ArticleTranslation
from apps.users.models import User


class ArticleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="author@test.com", password="pass",
            full_name="Author",
        )
        self.category = Category.objects.create(title="Test Category")

    def _make_article(self, title="Test Article", status="published"):
        article = Article.objects.create(
            author=self.user,
            category=self.category,
            status=status,
        )
        ArticleTranslation.objects.create(
            article=article, language="en", title=title,
        )
        return article

    def test_create_article(self):
        article = self._make_article()
        assert str(article) == "Test Article"

    def test_article_status_default(self):
        article = Article.objects.create()
        assert article.status == "draft"

    def test_translation_fallback_prefetch_safe(self):
        article = self._make_article(title="Prefetch Title")
        list(Article.objects.prefetch_related("translations").all())
        assert article.get_translation("en").title == "Prefetch Title"
