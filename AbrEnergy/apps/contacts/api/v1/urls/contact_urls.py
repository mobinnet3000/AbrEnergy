from django.urls import path
from apps.contacts.api.v1.views import contact

app_name = "contacts"

urlpatterns = [
    path("", contact.ContactCreateView.as_view(), name="contact-create"),
    path("consultation/", contact.ContactCreateView.as_view(), name="consultation"),
    path("design-request/", contact.ContactCreateView.as_view(), name="design-request"),
]
