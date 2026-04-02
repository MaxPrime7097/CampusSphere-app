from django.utils import timezone
from django.db.models import Q
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from resources.models import Resource
from posts.models import Post
from spheres.models import Sphere
from tasks.models import Task
from notifications.models import Notification
from users.models import User
from resources.models import ResourceReport

from .admin_serializers import (
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
    AdminKpiStatsSerializer,
    AdminQuickActionSerializer,
)


def _parse_time_window(request):
    range_key = request.query_params.get('range', '24h')
    now = timezone.now()

    if range_key == '24h':
        start = now - timezone.timedelta(hours=24)
        end = now
    elif range_key == '7j':
        start = now - timezone.timedelta(days=7)
        end = now
    elif range_key == '30j':
        start = now - timezone.timedelta(days=30)
        end = now
    elif range_key == 'custom':
        start_raw = request.query_params.get('startDate')
        end_raw = request.query_params.get('endDate')
        start = timezone.datetime.fromisoformat(start_raw) if start_raw else None
        end = timezone.datetime.fromisoformat(end_raw) if end_raw else now
        if start and timezone.is_naive(start):
            start = timezone.make_aware(start, timezone.get_current_timezone())
        if end and timezone.is_naive(end):
            end = timezone.make_aware(end, timezone.get_current_timezone())
    else:
        start = now - timezone.timedelta(hours=24)
        end = now
        range_key = '24h'

    return range_key, start, end


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


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_kpi_stats(request):
    range_key, start, end = _parse_time_window(request)
    now = timezone.now()

    date_filters = {}
    if start:
        date_filters['gte'] = start
    if end:
        date_filters['lte'] = end

    def _window(field):
        return {f'{field}__{operator}': value for operator, value in date_filters.items()}

    active_spheres_query = Sphere.objects.all()
    if start or end:
        active_spheres_query = active_spheres_query.filter(Q(**_window('updated_at')) | Q(**_window('created_at')))

    payload = {
        'newUsers': User.objects.filter(**_window('date_joined')).count() if (start or end) else User.objects.count(),
        'activeSpheres': active_spheres_query.count(),
        'pendingReports': ResourceReport.objects.filter(status='pending', **_window('created_at')).count() if (start or end) else ResourceReport.objects.filter(status='pending').count(),
        'overdueTasks': Task.objects.filter(is_completed=False, due_date__lt=now, **_window('due_date')).count() if (start or end) else Task.objects.filter(is_completed=False, due_date__lt=now).count(),
        'failedNotifications': Notification.objects.filter(
            Q(data__delivery_status='failed') | Q(data__email_failed=True),
            **(_window('created_at') if (start or end) else {}),
        ).count(),
        'range': range_key,
        'startDate': start,
        'endDate': end,
    }

    serializer = AdminKpiStatsSerializer(payload)
    return Response({'success': True, 'data': serializer.data})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_suspend_user(request):
    user_id = request.data.get('userId')
    user = User.objects.filter(id=user_id).first()
    if not user:
        serializer = AdminQuickActionSerializer({'action': 'suspendUser', 'success': False, 'message': 'Utilisateur introuvable.'})
        return Response({'success': False, 'data': serializer.data}, status=404)

    user.is_active = False
    user.save(update_fields=['is_active'])
    serializer = AdminQuickActionSerializer({'action': 'suspendUser', 'success': True, 'message': 'Utilisateur suspendu.'})
    return Response({'success': True, 'data': serializer.data})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_close_report(request):
    report_id = request.data.get('reportId')
    report = ResourceReport.objects.filter(id=report_id).first()
    if not report:
        serializer = AdminQuickActionSerializer({'action': 'closeReport', 'success': False, 'message': 'Signalement introuvable.'})
        return Response({'success': False, 'data': serializer.data}, status=404)

    report.status = 'reviewed'
    report.save(update_fields=['status', 'updated_at'])
    serializer = AdminQuickActionSerializer({'action': 'closeReport', 'success': True, 'message': 'Signalement clôturé.'})
    return Response({'success': True, 'data': serializer.data})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_archive_expired_sphere(request):
    sphere_id = request.data.get('sphereId')
    sphere = Sphere.objects.filter(id=sphere_id).first()
    if not sphere:
        serializer = AdminQuickActionSerializer({'action': 'archiveSphere', 'success': False, 'message': 'Sphère introuvable.'})
        return Response({'success': False, 'data': serializer.data}, status=404)

    collab_types = list(sphere.collaboration_types or [])
    if 'archived' not in collab_types:
        collab_types.append('archived')
    sphere.collaboration_types = collab_types
    sphere.save(update_fields=['collaboration_types', 'updated_at'])

    serializer = AdminQuickActionSerializer({'action': 'archiveSphere', 'success': True, 'message': 'Sphère marquée comme archivée.'})
    return Response({'success': True, 'data': serializer.data})
