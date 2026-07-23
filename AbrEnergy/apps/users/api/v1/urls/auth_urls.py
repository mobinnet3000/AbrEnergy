from django.urls import path
from apps.users.api.v1.views import auth

app_name = "users-auth"

urlpatterns = [
    path("register/", auth.RegisterView.as_view(), name="register"),
    path("login/", auth.CustomTokenObtainPairView.as_view(), name="login"),
    path("logout/", auth.LogoutView.as_view(), name="logout"),
    path("refresh/", auth.CustomTokenObtainPairView.as_view(), name="refresh"),
    path("password-change/", auth.ChangePasswordView.as_view(), name="password-change"),
    path("password-reset/", auth.password_reset_request, name="password-reset"),
]
