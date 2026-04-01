from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import OrderingFilter
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Notification, NotificationSettings
from .serializers import (
    NotificationSerializer, NotificationUpdateSerializer,
    NotificationSettingsSerializer, NotificationCreateSerializer
)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['type', 'is_read']  # Commented out - django_filters not installed
    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return NotificationUpdateSerializer
        return NotificationSerializer


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            recipient=request.user
        )
        
        notification.mark_as_read()

        return Response({
            'success': True,
            'data': NotificationSerializer(notification).data,
            'message': 'Notification marked as read',
            'timestamp': timezone.now().isoformat()
        })


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        # Mark all unread notifications as read
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        )
        
        count = unread_notifications.count()
        
        for notification in unread_notifications:
            notification.mark_as_read()

        return Response({
            'success': True,
            'data': {
                'marked_count': count
            },
            'message': f'{count} notifications marked as read',
            'timestamp': timezone.now().isoformat()
        })


class NotificationSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings, created = NotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats(request):
    """Get notification statistics for the user"""
    user = request.user
    
    total_count = Notification.objects.filter(recipient=user).count()
    unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
    recent_count = Notification.objects.filter(
        recipient=user,
        created_at__gte=timezone.now() - timezone.timedelta(hours=24)
    ).count()

    # Count by type
    type_counts = {}
    for notification_type, _ in Notification.TYPE_CHOICES:
        count = Notification.objects.filter(
            recipient=user,
            type=notification_type,
            is_read=False
        ).count()
        if count > 0:
            type_counts[notification_type] = count

    return Response({
        'success': True,
        'data': {
            'total': total_count,
            'unread': unread_count,
            'recent': recent_count,
            'by_type': type_counts
        },
        'timestamp': timezone.now().isoformat()
    })
