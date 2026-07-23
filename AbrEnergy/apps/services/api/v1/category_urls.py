from django.urls import path
from apps.services.api.v1.views import service

app_name = "service-categories"

urlpatterns = [
    path("", service.ServiceCategoryListView.as_view(), name="service-category-list"),
    path("<uuid:pk>/", service.ServiceCategoryDetailView.as_view(), name="service-category-detail"),
]
