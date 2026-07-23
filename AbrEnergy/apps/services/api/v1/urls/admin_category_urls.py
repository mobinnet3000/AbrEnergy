from django.urls import path
from apps.services.api.v1.views import service

app_name = "admin-service-categories"

urlpatterns = [
    path("", service.ServiceCategoryListView.as_view(), name="admin-service-cat-list"),
    path("<uuid:pk>/", service.ServiceCategoryDetailView.as_view(), name="admin-service-cat-detail"),
]
