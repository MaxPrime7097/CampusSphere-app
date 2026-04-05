from django.core.paginator import EmptyPage, Paginator
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import status
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
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
    AdminKpiStatsSerializer,
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


@cache_page(60 * 15)
@vary_on_headers('Authorization')
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


@cache_page(60 * 15)
@vary_on_headers('Authorization')
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_users(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    page, page_size, ordering, search = _parse_list_params(request)
    queryset = User.objects.all()
    if search:
        queryset = queryset.filter(
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )
    queryset = queryset.order_by(ordering)

    users, meta = _paginate_queryset(queryset, page, page_size)
    payload = [
        {
            'id': str(user.id),
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email,
            'isActive': user.is_active,
            'dateJoined': user.date_joined,
        }
        for user in users
    ]
    return _admin_response(True, payload, meta=meta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_v1_users_bulk_ban(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'update')
    if not allowed:
        return denied_response

    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    updated = User.objects.filter(id__in=ids).exclude(is_superuser=True).update(is_active=False)
    return _admin_response(True, {'updated': updated}, message='Utilisateurs bannis.')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_spheres(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Sphere.objects.all()
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
    queryset = queryset.order_by(ordering)

    spheres, meta = _paginate_queryset(queryset, page, page_size)
    payload = [
        {
            'id': str(sphere.id),
            'name': sphere.name,
            'description': sphere.description,
            'createdAt': sphere.created_at,
            'updatedAt': sphere.updated_at,
        }
        for sphere in spheres
    ]
    return _admin_response(True, payload, meta=meta)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_posts(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Post.objects.select_related('author')
    if search:
        queryset = queryset.filter(Q(content__icontains=search) | Q(author__username__icontains=search))
    queryset = queryset.order_by(ordering)

    posts, meta = _paginate_queryset(queryset, page, page_size)
    payload = [
        {
            'id': str(post.id),
            'content': post.content,
            'author': _display_name(post.author),
            'createdAt': post.created_at,
        }
        for post in posts
    ]
    return _admin_response(True, payload, meta=meta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_v1_posts_bulk_delete(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'delete')
    if not allowed:
        return denied_response

    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    deleted, _ = Post.objects.filter(id__in=ids).delete()
    return _admin_response(True, {'deleted': deleted}, message='Posts supprimés.')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_resources(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Resource.objects.select_related('author')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(subject__icontains=search) |
            Q(author__username__icontains=search)
        )
    queryset = queryset.order_by(ordering)

    resources, meta = _paginate_queryset(queryset, page, page_size)
    payload = [
        {
            'id': str(resource.id),
            'title': resource.title,
            'subject': resource.subject,
            'type': resource.type,
            'author': _display_name(resource.author),
            'createdAt': resource.created_at,
        }
        for resource in resources
    ]
    return _admin_response(True, payload, meta=meta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_v1_resources_bulk_delete(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'delete')
    if not allowed:
        return denied_response

    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    deleted, _ = Resource.objects.filter(id__in=ids).delete()
    return _admin_response(True, {'deleted': deleted}, message='Ressources supprimées.')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_reports(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    page, page_size, _, search = _parse_list_params(request)

    post_reports_qs = PostReport.objects.select_related('post', 'reporter').order_by('-created_at')
    resource_reports_qs = ResourceReport.objects.select_related('resource', 'reporter').order_by('-created_at')

    if search:
        post_reports_qs = post_reports_qs.filter(
            Q(reason__icontains=search) |
            Q(post__content__icontains=search) |
            Q(reporter__username__icontains=search)
        )
        resource_reports_qs = resource_reports_qs.filter(
            Q(reason__icontains=search) |
            Q(resource__title__icontains=search) |
            Q(reporter__username__icontains=search)
        )

    payload = []
    for report in post_reports_qs[:200]:
        payload.append({
            'id': f'post-{report.id}',
            'source': 'post',
            'targetId': str(report.post_id),
            'reason': report.reason,
            'status': report.status,
            'createdAt': report.created_at,
            'reporter': _display_name(report.reporter),
        })
    for report in resource_reports_qs[:200]:
        payload.append({
            'id': f'resource-{report.id}',
            'source': 'resource',
            'targetId': str(report.resource_id),
            'reason': report.reason,
            'status': report.status,
            'createdAt': report.created_at,
            'reporter': _display_name(report.reporter),
        })

    payload = sorted(payload, key=lambda item: item['createdAt'] or timezone.now(), reverse=True)
    total_items = len(payload)
    start = (page - 1) * page_size
    end = start + page_size
    paged = payload[start:end]
    total_pages = (total_items + page_size - 1) // page_size if page_size else 1
    meta = {
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_items': total_items,
            'total_pages': max(total_pages, 1),
            'has_next': end < total_items,
            'has_previous': start > 0,
        }
    }
    return _admin_response(True, paged, meta=meta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_v1_reports_bulk_approve(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'update')
    if not allowed:
        return denied_response

    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    post_ids = []
    resource_ids = []
    for identifier in ids:
        value = str(identifier)
        if value.startswith('post-'):
            post_ids.append(value.replace('post-', '', 1))
        elif value.startswith('resource-'):
            resource_ids.append(value.replace('resource-', '', 1))
        else:
            post_ids.append(value)
            resource_ids.append(value)

    post_updated = PostReport.objects.filter(id__in=post_ids).update(status='reviewed')
    resource_updated = ResourceReport.objects.filter(id__in=resource_ids).update(status='reviewed')
    return _admin_response(
        True,
        {'postReportsUpdated': post_updated, 'resourceReportsUpdated': resource_updated},
        message='Signalements approuvés.',
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_logs(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    from .admin_audit import AdminAuditLog
    page, page_size, ordering, search = _parse_list_params(request)
    queryset = AdminAuditLog.objects.select_related('actor').order_by('-created_at')
    if search:
        queryset = queryset.filter(
            Q(action__icontains=search) |
            Q(target_type__icontains=search) |
            Q(actor__username__icontains=search)
        )
    logs, meta = _paginate_queryset(queryset, page, page_size)
    payload = [
        {
            'id': str(log.id),
            'actor': _display_name(log.actor),
            'action': log.action,
            'targetType': log.target_type,
            'targetId': str(log.target_id) if log.target_id else None,
            'createdAt': log.created_at,
        }
        for log in logs
    ]
    return _admin_response(True, payload, meta=meta)


@cache_page(60 * 15)
@vary_on_headers('Authorization')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_v1_stats(request):
    allowed, denied_response, _, _ = require_admin_permission(request, 'view')
    if not allowed:
        return denied_response

    now = timezone.now()
    today = timezone.localdate()
    summary = {
        'newUsers': User.objects.filter(date_joined__date=today).count(),
        'activeSpheres': Sphere.objects.count(),
        'pendingReports': PostReport.objects.filter(status='pending').count() + ResourceReport.objects.filter(status='pending').count(),
        'overdueTasks': Task.objects.filter(due_date__lt=now, is_completed=False).count(),
        'failedNotifications': Notification.objects.filter(is_read=False).count(),
        'range': request.query_params.get('range', '24h'),
        'startDate': request.query_params.get('startDate'),
        'endDate': request.query_params.get('endDate'),
    }
    serializer = AdminKpiStatsSerializer(summary)
    return _admin_response(True, serializer.data)
