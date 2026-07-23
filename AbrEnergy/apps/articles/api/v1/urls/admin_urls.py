from django.urls import path
from apps.articles.api.v1.views import article

app_name = "admin-articles"

urlpatterns = [
    path("", article.ArticleListView.as_view(), name="admin-article-list"),
    path("<uuid:pk>/", article.ArticleDetailView.as_view(), name="admin-article-detail"),
    path("<uuid:pk>/publish/", article.publish_article, name="admin-article-publish"),
    path("<uuid:pk>/archive/", article.archive_article, name="admin-article-archive"),
]
