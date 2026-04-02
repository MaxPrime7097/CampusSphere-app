from django.core.paginator import EmptyPage, Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from posts.models import Post, PostReport
from resources.models import Resource, ResourceReport
from spheres.models import Sphere
from tasks.models import Task
from notifications.models import Notification
from users.models import User

from .admin_permissions import build_admin_permissions_for_user, require_admin_permission, resolve_admin_role
from .admin_serializers import (
    AdminAuditLogSerializer,
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
    AdminKpiStatsSerializer,
    AdminQuickActionSerializer,
)


DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


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


def _admin_response(success=True, data=None, meta=None, message=''):
    return Response({
        'success': success,
        'data': data,
        'meta': meta or {},
        'message': message,
    })


def _admin_error(message, http_status=status.HTTP_400_BAD_REQUEST, meta=None):
    return Response({
        'success': False,
        'data': None,
        'meta': meta or {},
        'message': message,
    }, status=http_status)


def _parse_list_params(request):
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(max(int(request.query_params.get('page_size', DEFAULT_PAGE_SIZE)), 1), MAX_PAGE_SIZE)
    ordering = request.query_params.get('ordering', '-created_at')
    search = request.query_params.get('search', '').strip()
    return page, page_size, ordering, search


def _paginate_queryset(queryset, page, page_size):
    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages if paginator.num_pages else 1)

    return page_obj.object_list, {
        'pagination': {
            'page': page_obj.number,
            'page_size': page_size,
            'total_items': paginator.count,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
    }


def _parse_bulk_ids(request):
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return None, _admin_error('Le champ "ids" (liste) est obligatoire.')
    return ids, None


# Legacy endpoints kept for backward compatibility
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_moderation_queue(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

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
    return _admin_response(True, serializer.data, message='File de modération chargée.')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reported_content(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

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
    return _admin_response(True, serializer.data, message='Contenu signalé chargé.')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_management_summary(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

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
@permission_classes([IsAuthenticated])
def admin_permissions(request):
    allowed, denied_response, role, permissions = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    return Response({
        'success': True,
        'data': {
            'role': role or resolve_admin_role(request.user),
            'permissions': permissions or build_admin_permissions_for_user(request.user),
        },
    })
