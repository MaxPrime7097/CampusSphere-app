from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from .search import SearchService, FilterService


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
        if entity_type == 'all':
            results = SearchService.global_search(query, request.user, limit)
        elif entity_type == 'users':
            results = {'users': SearchService.search_users(query, limit=limit)}
        elif entity_type == 'spheres':
            results = {'spheres': SearchService.search_spheres(query, user=request.user, limit=limit)}
        elif entity_type == 'posts':
            results = {'posts': SearchService.search_posts(query, user=request.user, limit=limit)}
        elif entity_type == 'resources':
            results = {'resources': SearchService.search_resources(query, user=request.user, limit=limit)}
        else:
            return Response({
                'success': False,
                'error': 'Invalid entity type',
                'timestamp': timezone.now().isoformat()
            }, status=400)

        return Response({
            'success': True,
            'data': results,
            'query': query,
            'timestamp': timezone.now().isoformat()
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': 'Search failed',
            'timestamp': timezone.now().isoformat()
        }, status=500)


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
        suggestions = SearchService.get_search_suggestions(query, request.user, limit)

        return Response({
            'success': True,
            'data': suggestions,
            'query': query,
            'timestamp': timezone.now().isoformat()
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to get suggestions',
            'timestamp': timezone.now().isoformat()
        }, status=500)


def ratelimit_error(request, exception):
    """Rate limit error handler"""
    return Response({
        'success': False,
        'error': 'Rate limit exceeded. Please try again later.',
        'timestamp': timezone.now().isoformat()
    }, status=429)


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
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    })


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