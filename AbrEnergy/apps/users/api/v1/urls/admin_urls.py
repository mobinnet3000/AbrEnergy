from django.urls import path
from apps.users.api.v1.views import auth

app_name = "users-admin"

urlpatterns = [
    path("users/", auth.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/", auth.UserDetailView.as_view(), name="user-detail"),
    path("users/<uuid:pk>/change-role/", auth.change_user_role, name="user-change-role"),
]
