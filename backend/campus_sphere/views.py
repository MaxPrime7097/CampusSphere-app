import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.views.decorators.cache import cache_page
from .search import SearchService, FilterService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """Global search across all entities"""
    query = request.query_params.get('q', '').strip()
    entity_type = request.query_params.get('type', 'all')
    limit = int(request.query_params.get('limit', 10))

    if not query:
        return Response({
            'success': False,
            'error': 'Search query is required',
            'timestamp': timezone.now().isoformat()
        }, status=400)

    try:
        errors = {}
        if entity_type == 'all':
            raw_results, errors = SearchService.global_search(query, request.user, limit)
        elif entity_type == 'users':
            raw_results = {'users': SearchService.search_users(query, limit=limit)}
        elif entity_type == 'spheres':
            raw_results = {'spheres': SearchService.search_spheres(query, user=request.user, limit=limit)}
        elif entity_type == 'posts':
            raw_results = {'posts': SearchService.search_posts(query, user=request.user, limit=limit)}
        elif entity_type == 'resources':
            raw_results = {'resources': SearchService.search_resources(query, user=request.user, limit=limit)}
        else:
            return Response({
                'success': False,
                'error': 'Invalid entity type',
                'timestamp': timezone.now().isoformat()
            }, status=400)

        results = SearchService.serialize_results(raw_results, request)
        if entity_type != 'all':
            expected_types = ['users', 'spheres', 'posts', 'resources']
            for expected_type in expected_types:
                results.setdefault(expected_type, [])

        return Response({
            'success': True,
            'data': results,
            'errors': errors,
            'query': query,
            'timestamp': timezone.now().isoformat()
        })

    except Exception:
        logger.exception("Global search endpoint failed for entity_type=%s", entity_type)
        return Response({
            'success': False,
            'error': f'Search failed for entity type: {entity_type}',
            'errors': {entity_type: f'Failed to search {entity_type}'},
            'timestamp': timezone.now().isoformat()
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_suggestions(request):
    """Get search suggestions"""
    query = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 5))

    if not query or len(query) < 2:
        return Response({
            'success': True,
            'data': [],
            'timestamp': timezone.now().isoformat()
        })

    try:
        suggestions, errors = SearchService.get_search_suggestions(query, request.user, limit)

        return Response({
            'success': True,
            'data': suggestions,
            'errors': errors,
            'query': query,
            'timestamp': timezone.now().isoformat()
        })

    except Exception:
        logger.exception("Search suggestions endpoint failed")
        return Response({
            'success': False,
            'error': 'Failed to get suggestions by entity type',
            'errors': {
                'users': 'Failed to build user suggestions',
                'spheres': 'Failed to build sphere suggestions',
                'posts': 'Failed to build post suggestions',
                'resources': 'Failed to build resource suggestions',
            },
            'timestamp': timezone.now().isoformat()
        }, status=200)


def ratelimit_error(request, exception):
    """Rate limit error handler"""
    return Response({
        'success': False,
        'error': 'Rate limit exceeded. Please try again later.',
        'timestamp': timezone.now().isoformat()
    }, status=429)


@cache_page(60 * 15)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def filter_options(request):
    """Get filter options for search"""
    try:
        options = {
            'universities': FilterService.get_universities(),
            'faculties': FilterService.get_faculties(),
            'study_years': FilterService.get_study_years(),
            'towns': FilterService.get_towns(),
            'sphere_categories': FilterService.get_sphere_categories(),
            'sphere_types': FilterService.get_sphere_types(),
            'subjects': FilterService.get_subjects(),
            'resource_types': FilterService.get_resource_types(),
        }

        return Response({
            'success': True,
            'data': options,
            'timestamp': timezone.now().isoformat()
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to get filter options',
            'timestamp': timezone.now().isoformat()
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reported_content(request):
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    from posts.models import PostReport
    from resources.models import ResourceReport
    post_reports = PostReport.objects.select_related('post', 'reporter').order_by('-created_at')
    resource_reports = ResourceReport.objects.select_related('resource', 'reporter').order_by('-created_at')

    def reporter_avatar_url(user):
        avatar_field = getattr(user, 'avatar', None)
        try:
            return avatar_field.url if avatar_field else None
        except Exception:
            return None

    data = [
        {
            'id': f"post-{report.id}",
            'type': 'Post',
            'content': report.post.content[:280],
            'reason': report.reason,
            'date': report.created_at.isoformat(),
            'status': report.status,
            'reporter': {
                'name': f"{getattr(report.reporter, 'first_name', '')} {getattr(report.reporter, 'last_name', '')}".strip() or report.reporter.username,
                'avatar': reporter_avatar_url(report.reporter),
            }
        }
        for report in post_reports
    ]
    data.extend([
        {
            'id': f"resource-{report.id}",
            'type': 'Resource',
            'content': report.resource.title[:280],
            'reason': report.reason,
            'date': report.created_at.isoformat(),
            'status': report.status,
            'reporter': {
                'name': f"{getattr(report.reporter, 'first_name', '')} {getattr(report.reporter, 'last_name', '')}".strip() or report.reporter.username,
                'avatar': reporter_avatar_url(report.reporter),
            }
        }
        for report in resource_reports
    ])
    data.sort(key=lambda item: item.get('date') or '', reverse=True)
    return Response({'success': True, 'data': data, 'timestamp': timezone.now().isoformat()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_moderation_queue(request):
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    return Response({'success': True, 'data': [], 'timestamp': timezone.now().isoformat()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_management_summary(request):
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    from posts.models import PostReport
    from resources.models import ResourceReport, Resource
    User = get_user_model()
    today = timezone.now().date()

    data = {
        'total_users': User.objects.count(),
        'new_users_today': User.objects.filter(date_joined__date=today).count(),
        'pending_resources': Resource.objects.count(),
        'reported_content': PostReport.objects.filter(status='pending').count() + ResourceReport.objects.filter(status='pending').count(),
        'active_groups': 0,
        'total_resources': Resource.objects.count(),
    }
    return Response({'success': True, 'data': data, 'timestamp': timezone.now().isoformat()})


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    })


@cache_page(60 * 15)
@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """API information endpoint"""
    return Response({
        'name': 'CampusSphere API',
        'version': '1.0.0',
        'description': 'API for CampusSphere platform',
        'endpoints': {
            'auth': '/api/auth/',
            'users': '/api/users/',
            'spheres': '/api/spheres/',
            'posts': '/api/posts/',
            'resources': '/api/resources/',
            'tasks': '/api/tasks/',
            'conversations': '/api/conversations/',
            'notifications': '/api/notifications/',
            'upload': '/api/upload/',
            'search': '/api/search/',
        },
        'timestamp': timezone.now().isoformat()
    })
