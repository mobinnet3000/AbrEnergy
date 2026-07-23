from django.urls import path
from apps.contacts.api.v1.views import contact

app_name = "admin-contacts"

urlpatterns = [
    path("", contact.ContactAdminListView.as_view(), name="contact-admin-list"),
    path("<uuid:pk>/", contact.ContactAdminDetailView.as_view(), name="contact-admin-detail"),
    path("<uuid:pk>/assign/", contact.assign_contact, name="contact-assign"),
]
