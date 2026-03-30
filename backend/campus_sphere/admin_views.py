from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from resources.models import Resource
from posts.models import Post
from spheres.models import Sphere
from users.models import User
from resources.models import ResourceReport

from .admin_serializers import (
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
)


def _display_name(user):
    if not user:
        return 'Utilisateur inconnu'
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _avatar_url(user):
    if user and user.avatar:
        try:
            return user.avatar.url
        except Exception:
            return None
    return None


def _human_readable_size(bytes_size):
    if not bytes_size:
        return '0 B'

    size = float(bytes_size)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != 'B' else f"{int(size)} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_moderation_queue(request):
    resources = Resource.objects.select_related('author').order_by('-created_at')[:50]
    payload = [
        {
            'id': str(resource.id),
            'title': resource.title,
            'type': resource.type,
            'subject': resource.subject,
            'size': _human_readable_size(resource.file_size),
            'uploadDate': resource.created_at,
            'uploader': {
                'name': _display_name(resource.author),
                'avatar': _avatar_url(resource.author),
            },
        }
        for resource in resources
    ]

    serializer = AdminModerationQueueItemSerializer(payload, many=True)
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_reported_content(request):
    posts = Post.objects.select_related('author').order_by('-created_at')[:50]
    resource_reports = ResourceReport.objects.select_related('resource', 'reporter').order_by('-created_at')[:50]

    payload = [
        {
            'id': str(post.id),
            'type': 'post',
            'content': post.content[:180],
            'reason': 'Pending moderation review',
            'date': post.created_at,
            'status': 'pending',
            'reporter': {
                'name': _display_name(post.author),
                'avatar': _avatar_url(post.author),
            },
        }
        for post in posts
    ]
    payload.extend([
        {
            'id': str(report.id),
            'type': 'resource',
            'content': report.resource.title[:180],
            'reason': report.reason,
            'date': report.created_at,
            'status': report.status,
            'reporter': {
                'name': _display_name(report.reporter),
                'avatar': _avatar_url(report.reporter),
            },
        }
        for report in resource_reports
    ])
    payload = sorted(payload, key=lambda item: item['date'] or timezone.now(), reverse=True)[:50]

    serializer = AdminReportedContentItemSerializer(payload, many=True)
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_user_management_summary(request):
    today = timezone.localdate()
    summary = {
        'totalUsers': User.objects.count(),
        'newUsersToday': User.objects.filter(date_joined__date=today).count(),
        'pendingResources': Resource.objects.count(),
        'reportedContent': Post.objects.count() + ResourceReport.objects.filter(status='pending').count(),
        'activeGroups': Sphere.objects.count(),
        'totalResources': Resource.objects.count(),
    }

    serializer = AdminSummarySerializer(summary)
    return Response({'success': True, 'data': serializer.data})
