from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from apps.calculator.models import CalculationHistory
from apps.calculator.calculator import calculate_off_grid
from apps.calculator.api.v1.serializers.calculator import (
    CalculatorInputSerializer,
    CalculatorResultSerializer,
    CalculationHistoryListSerializer,
)
from apps.users.api.v1.permissions import IsAdminUser
import uuid


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def off_grid_calculate(request):
    serializer = CalculatorInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = calculate_off_grid(
        daily_consumption=data["daily_consumption"],
        irradiation=data["irradiation"],
        battery_type=data["battery_type"],
        city=data["city"],
    )

    calculation = CalculationHistory.objects.create(
        user=request.user if request.user.is_authenticated else None,
        session_id=request.headers.get("X-Session-ID", str(uuid.uuid4())),
        city=data["city"],
        daily_consumption=data["daily_consumption"],
        irradiation=data["irradiation"],
        battery_type=data["battery_type"],
        system_type=data["system_type"],
        **result,
    )

    return Response(
        {
            "result": result,
            "history_id": str(calculation.id),
        },
        status=status.HTTP_200_OK,
    )


class CalculationHistoryView(generics.ListAPIView):
    serializer_class = CalculationHistoryListSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return CalculationHistory.objects.filter(user=self.request.user)
        session_id = self.request.headers.get("X-Session-ID", "")
        if session_id:
            return CalculationHistory.objects.filter(session_id=session_id)
        return CalculationHistory.objects.none()


class AdminCalculationHistoryView(generics.ListAPIView):
    serializer_class = CalculationHistoryListSerializer
    permission_classes = [IsAdminUser]
    queryset = CalculationHistory.objects.select_related("user").all()
