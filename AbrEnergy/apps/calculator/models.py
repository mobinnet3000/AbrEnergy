import uuid
from django.db import models


class CalculationHistory(models.Model):
    BATTERY_TYPE_CHOICES = [
        ("lead_acid", "Lead Acid"),
        ("lithium", "Lithium"),
        ("tubular", "Tubular"),
    ]
    SYSTEM_TYPE_CHOICES = [
        ("on_grid", "On Grid"),
        ("off_grid", "Off Grid"),
        ("hybrid", "Hybrid"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="calculations",
    )
    session_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    daily_consumption = models.DecimalField(max_digits=10, decimal_places=2, help_text="kWh/day")
    city = models.CharField(max_length=100)
    irradiation = models.DecimalField(max_digits=5, decimal_places=2, help_text="kWh/m²/day")
    battery_type = models.CharField(max_length=20, choices=BATTERY_TYPE_CHOICES)
    system_type = models.CharField(max_length=20, choices=SYSTEM_TYPE_CHOICES)

    panel_capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="kW")
    panel_count = models.IntegerField()
    battery_capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Ah")
    inverter_power = models.DecimalField(max_digits=10, decimal_places=2, help_text="kW")
    estimated_cost = models.DecimalField(max_digits=15, decimal_places=0, help_text="IRR")
    roi_years = models.DecimalField(max_digits=5, decimal_places=1)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Calc: {self.city} - {self.system_type} ({self.created_at})"
