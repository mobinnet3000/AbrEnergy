from django.urls import path
from apps.calculator.api.v1.views import calculator

app_name = "calculator"

urlpatterns = [
    path("off-grid/", calculator.off_grid_calculate, name="off-grid-calculate"),
    path("history/", calculator.CalculationHistoryView.as_view(), name="calculation-history"),
]
