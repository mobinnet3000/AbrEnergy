from django.urls import path
from apps.contacts.api.v1.views import contact

app_name = "admin-inquiries"

urlpatterns = [
    path("", contact.ProjectInquiryAdminListView.as_view(), name="inquiry-admin-list"),
    path("<uuid:pk>/", contact.ProjectInquiryAdminDetailView.as_view(), name="inquiry-admin-detail"),
    path("<uuid:pk>/assign/", contact.assign_inquiry, name="inquiry-assign"),
]
