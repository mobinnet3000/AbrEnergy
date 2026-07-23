from rest_framework import serializers
from apps.calculator.models import CalculationHistory


class CalculatorInputSerializer(serializers.Serializer):
    daily_consumption = serializers.DecimalField(max_digits=10, decimal_places=2)
    city = serializers.CharField(max_length=100)
    irradiation = serializers.DecimalField(max_digits=5, decimal_places=2)
    battery_type = serializers.ChoiceField(choices=CalculationHistory.BATTERY_TYPE_CHOICES)
    system_type = serializers.ChoiceField(choices=CalculationHistory.SYSTEM_TYPE_CHOICES)


class CalculatorResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculationHistory
        fields = [
            "id", "daily_consumption", "city", "irradiation",
            "battery_type", "system_type",
            "panel_capacity", "panel_count", "battery_capacity",
            "inverter_power", "estimated_cost", "roi_years",
            "created_at",
        ]
        read_only_fields = fields


class CalculationHistoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculationHistory
        fields = [
            "id", "city", "system_type", "daily_consumption",
            "estimated_cost", "roi_years", "created_at",
        ]
