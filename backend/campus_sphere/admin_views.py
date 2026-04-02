from django.core.paginator import EmptyPage, Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from posts.models import Post, PostReport
from resources.models import Resource, ResourceReport
from spheres.models import Sphere
from users.models import User

from .admin_serializers import (
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
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
    return _admin_response(True, serializer.data, message='File de modération chargée.')


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
    return _admin_response(True, serializer.data, message='Contenu signalé chargé.')


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
    return _admin_response(True, serializer.data, message='Résumé admin chargé.')


# New namespaced admin v1 endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_users(request):
    page, page_size, ordering, search = _parse_list_params(request)
    queryset = User.objects.all()

    is_active = request.query_params.get('is_active')
    if is_active in {'true', 'false'}:
        queryset = queryset.filter(is_active=(is_active == 'true'))

    if search:
        queryset = queryset.filter(
            Q(username__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    queryset = queryset.order_by(ordering)
    items, meta = _paginate_queryset(queryset, page, page_size)

    data = [
        {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': _display_name(user),
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined,
        }
        for user in items
    ]
    meta['ordering'] = ordering
    meta['filters'] = {'search': search, 'is_active': is_active}
    return _admin_response(True, data, meta, 'Utilisateurs récupérés.')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_spheres(request):
    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Sphere.objects.select_related('created_by').all()

    category = request.query_params.get('category')
    sphere_type = request.query_params.get('type')
    if category:
        queryset = queryset.filter(category=category)
    if sphere_type:
        queryset = queryset.filter(type=sphere_type)
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))

    queryset = queryset.order_by(ordering)
    items, meta = _paginate_queryset(queryset, page, page_size)
    data = [
        {
            'id': sphere.id,
            'name': sphere.name,
            'category': sphere.category,
            'type': sphere.type,
            'created_by': _display_name(sphere.created_by),
            'created_at': sphere.created_at,
        }
        for sphere in items
    ]
    meta['ordering'] = ordering
    meta['filters'] = {'search': search, 'category': category, 'type': sphere_type}
    return _admin_response(True, data, meta, 'Sphères récupérées.')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_posts(request):
    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Post.objects.select_related('author', 'sphere').all()

    visibility = request.query_params.get('visibility')
    category = request.query_params.get('category')
    if visibility:
        queryset = queryset.filter(visibility=visibility)
    if category:
        queryset = queryset.filter(category=category)
    if search:
        queryset = queryset.filter(Q(content__icontains=search) | Q(author__username__icontains=search))

    queryset = queryset.order_by(ordering)
    items, meta = _paginate_queryset(queryset, page, page_size)
    data = [
        {
            'id': post.id,
            'author': _display_name(post.author),
            'content': post.content,
            'category': post.category,
            'visibility': post.visibility,
            'sphere_id': post.sphere_id,
            'created_at': post.created_at,
        }
        for post in items
    ]
    meta['ordering'] = ordering
    meta['filters'] = {'search': search, 'visibility': visibility, 'category': category}
    return _admin_response(True, data, meta, 'Posts récupérés.')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_resources(request):
    page, page_size, ordering, search = _parse_list_params(request)
    queryset = Resource.objects.select_related('author').all()

    resource_type = request.query_params.get('type')
    subject = request.query_params.get('subject')
    if resource_type:
        queryset = queryset.filter(type=resource_type)
    if subject:
        queryset = queryset.filter(subject=subject)
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

    queryset = queryset.order_by(ordering)
    items, meta = _paginate_queryset(queryset, page, page_size)
    data = [
        {
            'id': resource.id,
            'title': resource.title,
            'type': resource.type,
            'subject': resource.subject,
            'size': _human_readable_size(resource.file_size),
            'author': _display_name(resource.author),
            'created_at': resource.created_at,
        }
        for resource in items
    ]
    meta['ordering'] = ordering
    meta['filters'] = {'search': search, 'type': resource_type, 'subject': subject}
    return _admin_response(True, data, meta, 'Ressources récupérées.')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_reports(request):
    page, page_size, ordering, search = _parse_list_params(request)

    post_reports = PostReport.objects.select_related('post', 'reporter').all()
    resource_reports = ResourceReport.objects.select_related('resource', 'reporter').all()

    report_status = request.query_params.get('status')
    report_type = request.query_params.get('type')

    if report_status:
        post_reports = post_reports.filter(status=report_status)
        resource_reports = resource_reports.filter(status=report_status)

    payload = []
    if report_type in (None, '', 'post'):
        payload.extend([
            {
                'id': f'post-{report.id}',
                'report_id': report.id,
                'type': 'post',
                'status': report.status,
                'reason': report.reason,
                'content': report.post.content[:200],
                'reporter': _display_name(report.reporter),
                'created_at': report.created_at,
            }
            for report in post_reports
        ])

    if report_type in (None, '', 'resource'):
        payload.extend([
            {
                'id': f'resource-{report.id}',
                'report_id': report.id,
                'type': 'resource',
                'status': report.status,
                'reason': report.reason,
                'content': report.resource.title[:200],
                'reporter': _display_name(report.reporter),
                'created_at': report.created_at,
            }
            for report in resource_reports
        ])

    if search:
        lowered = search.lower()
        payload = [
            item for item in payload
            if lowered in item['reason'].lower() or lowered in item['content'].lower() or lowered in item['reporter'].lower()
        ]

    reverse = ordering.startswith('-')
    order_field = ordering.lstrip('-')
    allowed_order_fields = {'created_at', 'status', 'type'}
    if order_field not in allowed_order_fields:
        order_field = 'created_at'
    payload = sorted(payload, key=lambda item: item[order_field], reverse=reverse)

    paginator = Paginator(payload, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages if paginator.num_pages else 1)

    meta = {
        'pagination': {
            'page': page_obj.number,
            'page_size': page_size,
            'total_items': paginator.count,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        },
        'ordering': ordering,
        'filters': {'search': search, 'status': report_status, 'type': report_type},
    }

    return _admin_response(True, list(page_obj.object_list), meta, 'Signalements récupérés.')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_stats(request):
    today = timezone.localdate()
    data = {
        'users': {
            'total': User.objects.count(),
            'new_today': User.objects.filter(date_joined__date=today).count(),
            'inactive': User.objects.filter(is_active=False).count(),
        },
        'spheres': {
            'total': Sphere.objects.count(),
        },
        'posts': {
            'total': Post.objects.count(),
        },
        'resources': {
            'total': Resource.objects.count(),
        },
        'reports': {
            'pending_posts': PostReport.objects.filter(status='pending').count(),
            'pending_resources': ResourceReport.objects.filter(status='pending').count(),
        },
    }
    return _admin_response(True, data, {'generated_at': timezone.now()}, 'Statistiques administrateur récupérées.')


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_users_bulk_ban(request):
    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    updated = User.objects.filter(id__in=ids, is_staff=False).update(is_active=False)
    return _admin_response(True, {'updated': updated}, {'ids': ids}, 'Utilisateurs bannis en masse.')


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_reports_bulk_approve(request):
    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    post_updated = PostReport.objects.filter(id__in=ids).update(status='reviewed')
    resource_updated = ResourceReport.objects.filter(id__in=ids).update(status='reviewed')
    return _admin_response(
        True,
        {'updated': post_updated + resource_updated, 'posts': post_updated, 'resources': resource_updated},
        {'ids': ids},
        'Signalements approuvés en masse.',
    )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_posts_bulk_delete(request):
    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    deleted, _ = Post.objects.filter(id__in=ids).delete()
    return _admin_response(True, {'deleted': deleted}, {'ids': ids}, 'Posts supprimés en masse.')


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_v1_resources_bulk_delete(request):
    ids, error = _parse_bulk_ids(request)
    if error:
        return error

    deleted, _ = Resource.objects.filter(id__in=ids).delete()
    return _admin_response(True, {'deleted': deleted}, {'ids': ids}, 'Ressources supprimées en masse.')
