from django.urls import path
from apps.projects.api.v1.views import project

app_name = "projects"

urlpatterns = [
    path("", project.ProjectListView.as_view(), name="project-list"),
    path("featured/", project.ProjectFeaturedView.as_view(), name="project-featured"),
    path("by-type/<str:type>/", project.ProjectByTypeView.as_view(), name="project-by-type"),
    path("<slug:slug>/", project.ProjectDetailView.as_view(), name="project-detail"),
]
