from django.contrib import admin
from apps.calculator.models import CalculationHistory


@admin.register(CalculationHistory)
class CalculationHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "user", "city", "system_type", "battery_type",
        "daily_consumption", "panel_count", "estimated_cost",
        "roi_years", "created_at",
    ]
    list_filter = ["system_type", "battery_type"]
    search_fields = ["city", "user__email"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "user", "session_id", "daily_consumption", "city",
        "irradiation", "battery_type", "system_type",
        "panel_capacity", "panel_count", "battery_capacity",
        "inverter_power", "estimated_cost", "roi_years", "created_at",
    ]
    list_per_page = 25
