from decimal import Decimal

PANEL_STANDARDC_POWER = Decimal("550")  # Watts
PANEL_EFFICIENCY = Decimal("0.85")
BATTERY_DEPTH_OF_DISCHARGE = {
    "lead_acid": Decimal("0.50"),
    "lithium": Decimal("0.90"),
    "tubular": Decimal("0.70"),
}
COST_PER_KW_PANEL = Decimal("15000000")       # IRR per kW
COST_PER_KWH_BATTERY = Decimal("5000000")     # IRR per kWh
COST_PER_KW_INVERTER = Decimal("8000000")     # IRR per kW
ELECTRICITY_RATE_IRR = Decimal("800")          # IRR per kWh (approx)


def calculate_off_grid(
    daily_consumption: Decimal,
    irradiation: Decimal,
    battery_type: str,
    city: str = "",
) -> dict:
    """
    Off-Grid solar system calculator.
    Returns a dict with all calculated values.
    """
    if irradiation <= 0:
        raise ValueError("Irradiation must be greater than 0")
    if daily_consumption <= 0:
        raise ValueError("Daily consumption must be greater than 0")

    dod = BATTERY_DEPTH_OF_DISCHARGE.get(battery_type, Decimal("0.70"))

    required_panel_power_kw = daily_consumption / (irradiation * PANEL_EFFICIENCY)
    panel_watts = required_panel_power_kw * Decimal("1000")
    panel_count = int(panel_watts // PANEL_STANDARDC_POWER) + (1 if panel_watts % PANEL_STANDARDC_POWER else 0)
    actual_panel_capacity = (Decimal(panel_count) * PANEL_STANDARDC_POWER) / Decimal("1000")

    battery_energy_kwh = daily_consumption / dod
    battery_capacity_ah = (battery_energy_kwh * Decimal("1000")) / Decimal("48")

    safety_factor = Decimal("1.25")
    inverter_power = required_panel_power_kw * safety_factor

    total_cost = (
        actual_panel_capacity * COST_PER_KW_PANEL
        + battery_energy_kwh * COST_PER_KWH_BATTERY
        + inverter_power * COST_PER_KW_INVERTER
    )

    daily_saving = daily_consumption * ELECTRICITY_RATE_IRR
    yearly_saving = daily_saving * Decimal("365")
    roi_years = total_cost / yearly_saving if yearly_saving > 0 else Decimal("99")

    return {
        "panel_capacity": round(actual_panel_capacity, 2),
        "panel_count": panel_count,
        "battery_capacity": round(battery_capacity_ah, 2),
        "inverter_power": round(inverter_power, 2),
        "estimated_cost": round(total_cost, 0),
        "roi_years": round(roi_years, 1),
    }
