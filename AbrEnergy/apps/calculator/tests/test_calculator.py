import pytest
from decimal import Decimal
from apps.calculator.calculator import calculate_off_grid


class TestSolarCalculator:
    def test_basic_calculation(self):
        result = calculate_off_grid(
            daily_consumption=Decimal("30"),
            irradiation=Decimal("5.0"),
            battery_type="lithium",
            city="Tehran",
        )
        assert result["panel_count"] > 0
        assert result["panel_capacity"] > 0
        assert result["battery_capacity"] > 0
        assert result["inverter_power"] > 0
        assert result["estimated_cost"] > 0
        assert result["roi_years"] > 0

    def test_higher_consumption_more_panels(self):
        low = calculate_off_grid(
            daily_consumption=Decimal("10"),
            irradiation=Decimal("5.0"),
            battery_type="lithium",
            city="Tehran",
        )
        high = calculate_off_grid(
            daily_consumption=Decimal("50"),
            irradiation=Decimal("5.0"),
            battery_type="lithium",
            city="Tehran",
        )
        assert high["panel_count"] > low["panel_count"]
        assert high["estimated_cost"] > low["estimated_cost"]

    def test_battery_type_lithium_more_efficient(self):
        lithium = calculate_off_grid(
            daily_consumption=Decimal("30"),
            irradiation=Decimal("5.0"),
            battery_type="lithium",
            city="Tehran",
        )
        lead_acid = calculate_off_grid(
            daily_consumption=Decimal("30"),
            irradiation=Decimal("5.0"),
            battery_type="lead_acid",
            city="Tehran",
        )
        assert lithium["battery_capacity"] < lead_acid["battery_capacity"]

    def test_zero_irradiation_raises(self):
        with pytest.raises(ValueError):
            calculate_off_grid(
                daily_consumption=Decimal("30"),
                irradiation=Decimal("0"),
                battery_type="lithium",
            )

    def test_zero_consumption_raises(self):
        with pytest.raises(ValueError):
            calculate_off_grid(
                daily_consumption=Decimal("0"),
                irradiation=Decimal("5.0"),
                battery_type="lithium",
            )
