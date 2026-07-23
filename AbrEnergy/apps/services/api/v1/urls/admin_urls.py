from django.urls import path
from apps.services.api.v1.views import service

app_name = "admin-services"

urlpatterns = [
    path("", service.ServiceListView.as_view(), name="admin-service-list"),
    path("<uuid:pk>/", service.ServiceDetailView.as_view(), name="admin-service-detail"),
]
