from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from apps.notifications.models import Notification
from apps.notifications.api.v1.serializers.notification import NotificationSerializer
from apps.notifications.services import get_unread_count, mark_all_read


class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    count = get_unread_count(request.user)
    return Response({"count": count})


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_read(request, pk):
    notification = Notification.objects.filter(pk=pk, recipient=request.user).first()
    if not notification:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response({"detail": "Marked as read"})


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read_view(request):
    count = mark_all_read(request.user)
    return Response({"marked_read": count})


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_notification(request, pk):
    notification = Notification.objects.filter(pk=pk, recipient=request.user).first()
    if not notification:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    notification.delete()
    return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
