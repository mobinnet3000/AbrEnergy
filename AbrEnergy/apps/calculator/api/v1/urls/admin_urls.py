from django.urls import path
from apps.calculator.api.v1.views import calculator

app_name = "admin-calculator"

urlpatterns = [
    path("", calculator.AdminCalculationHistoryView.as_view(), name="admin-calc-history"),
]
