from django.urls import path
from apps.projects.api.v1.views import project

app_name = "admin-projects"

urlpatterns = [
    path("", project.ProjectListView.as_view(), name="admin-project-list"),
    path("<uuid:pk>/", project.ProjectDetailView.as_view(), name="admin-project-detail"),
]
