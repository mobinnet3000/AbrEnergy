from django.urls import path
from apps.services.api.v1.views import service

app_name = "services"

urlpatterns = [
    path("", service.ServiceListView.as_view(), name="service-list"),
    path("<slug:slug>/", service.ServiceDetailView.as_view(), name="service-detail"),
]
