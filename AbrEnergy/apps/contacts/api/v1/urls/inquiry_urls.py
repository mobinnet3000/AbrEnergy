from django.urls import path
from apps.contacts.api.v1.views import contact

app_name = "inquiries"

urlpatterns = [
    path("", contact.ProjectInquiryCreateView.as_view(), name="inquiry-create"),
]
