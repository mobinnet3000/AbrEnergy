from django.contrib import admin
from apps.contacts.models import ContactRequest, ProjectInquiry


@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "phone", "request_type", "status", "assigned_to", "created_at"]
    list_filter = ["status", "request_type"]
    search_fields = ["full_name", "email", "phone", "message"]
    date_hierarchy = "created_at"
    list_editable = ["status"]
    readonly_fields = ["full_name", "email", "phone", "subject", "message", "request_type", "created_at", "updated_at"]
    list_per_page = 25

    actions = ["mark_as_completed", "mark_as_rejected"]

    @admin.action(description="Mark selected as Completed")
    def mark_as_completed(self, request, queryset):
        queryset.update(status="completed")

    @admin.action(description="Mark selected as Rejected")
    def mark_as_rejected(self, request, queryset):
        queryset.update(status="rejected")


@admin.register(ProjectInquiry)
class ProjectInquiryAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "city", "project_type", "status", "assigned_admin", "created_at"]
    list_filter = ["status", "project_type"]
    search_fields = ["name", "phone", "email", "city", "message"]
    date_hierarchy = "created_at"
    list_editable = ["status"]
    readonly_fields = ["name", "phone", "email", "city", "project_type", "estimated_capacity", "message", "created_at", "updated_at"]
    list_per_page = 25

    actions = ["mark_contacted", "mark_completed"]

    @admin.action(description="Mark selected as Contacted")
    def mark_contacted(self, request, queryset):
        queryset.update(status="contacted")

    @admin.action(description="Mark selected as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(status="completed")
