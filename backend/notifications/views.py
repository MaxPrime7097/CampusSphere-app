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


# Utility functions for creating notifications
def create_notification(notification_type, title, message, recipient, data=None):
    """Helper function to create notifications"""
    return Notification.objects.create(
        type=notification_type,
        title=title,
        message=message,
        recipient=recipient,
        data=data or {}
    )


def create_post_like_notification(post, liker):
    """Create notification when someone likes a post"""
    if post.author != liker:  # Don't notify self-likes
        return create_notification(
            type='post_like',
            title='Nouveau like sur votre post',
            message=f'{liker.full_name} a aimé votre post',
            recipient=post.author,
            data={
                'post_id': str(post.id),
                'user_id': str(liker.id),
                'post_content': post.content[:100]
            }
        )


def create_post_comment_notification(post, commenter, comment):
    """Create notification when someone comments on a post"""
    if post.author != commenter:  # Don't notify self-comments
        return create_notification(
            type='post_comment',
            title='Nouveau commentaire sur votre post',
            message=f'{commenter.full_name} a commenté votre post',
            recipient=post.author,
            data={
                'post_id': str(post.id),
                'comment_id': str(comment.id),
                'user_id': str(commenter.id),
                'comment_content': comment.content[:100]
            }
        )


def create_sphere_invitation_notification(sphere, inviter, invitee):
    """Create notification when someone is invited to a sphere"""
    return create_notification(
        type='sphere_invitation',
        title='Invitation à rejoindre une sphère',
        message=f'{inviter.full_name} vous a invité à rejoindre "{sphere.name}"',
        recipient=invitee,
        data={
            'sphere_id': str(sphere.id),
            'inviter_id': str(inviter.id),
            'sphere_name': sphere.name
        }
    )


def create_task_assigned_notification(task, assigner):
    """Create notification when a task is assigned"""
    if task.assigned_to and task.assigned_to != assigner:
        return create_notification(
            type='task_assigned',
            title='Nouvelle tâche assignée',
            message=f'{assigner.full_name} vous a assigné la tâche "{task.title}"',
            recipient=task.assigned_to,
            data={
                'task_id': str(task.id),
                'assigner_id': str(assigner.id),
                'sphere_id': str(task.sphere.id),
                'task_title': task.title,
                'due_date': task.due_date.isoformat() if task.due_date else None
            }
        )


def create_connection_request_notification(connection):
    """Create notification when someone sends a connection request"""
    return create_notification(
        type='connection_request',
        title='Nouvelle demande de connexion',
        message=f'{connection.requester.full_name} souhaite se connecter avec vous',
        recipient=connection.recipient,
        data={
            'connection_id': str(connection.id),
            'requester_id': str(connection.requester.id)
        }
    )


def create_message_notification(message):
    """Create notification when someone receives a message"""
    conversation = message.conversation
    
    # Notify all participants except the sender
    for participant in conversation.participants.exclude(id=message.author.id):
        # Check user's notification settings
        settings = getattr(participant, 'notification_settings', None)
        if settings and settings.in_app_messages:
            create_notification(
                type='message',
                title='Nouveau message',
                message=f'{message.author.full_name} vous a envoyé un message',
                recipient=participant,
                data={
                    'conversation_id': str(conversation.id),
                    'message_id': str(message.id),
                    'sender_id': str(message.author.id),
                    'conversation_type': conversation.type
                }
            )
