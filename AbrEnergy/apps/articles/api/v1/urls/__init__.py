from django.urls import path
from apps.articles.api.v1.views import article

app_name = "articles"

urlpatterns = [
    path("", article.ArticleListView.as_view(), name="article-list"),
    path("<slug:slug>/", article.ArticleDetailView.as_view(), name="article-detail"),
]

admin_patterns = [
    path("<uuid:pk>/publish/", article.publish_article, name="article-publish"),
    path("<uuid:pk>/archive/", article.archive_article, name="article-archive"),
]
