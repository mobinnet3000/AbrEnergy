from django.urls import path
from apps.users.api.v1.views import auth

app_name = "users"

urlpatterns = [
    path("me/", auth.ProfileView.as_view(), name="profile"),
]
