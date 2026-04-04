from django.contrib import admin
from django.urls import path, include
from . import views, admin_views
from .supabase_views import SupabaseTokenExchangeView, SupabaseCompleteProfileView, SupabaseDebugView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Bienvenue sur l'API CampusSphere", "status": "running"})

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/auth/refresh/', TokenRefreshView.as_view(permission_classes=[AllowAny]), name='token_refresh'),
    path('api/auth/supabase/exchange/', SupabaseTokenExchangeView.as_view(), name='supabase-exchange'),
    path('api/auth/supabase/complete-profile/', SupabaseCompleteProfileView.as_view(), name='supabase-complete-profile'),
    path('api/auth/supabase/debug/', SupabaseDebugView.as_view(), name='supabase-debug'),
    path('api/users/', include('users.urls')),
    path('api/spheres/', include('spheres.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/resources/', include('resources.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/', include('messaging.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('upload.urls')),

    path('api/admin/moderation-queue/', admin_views.admin_moderation_queue, name='admin-moderation-queue'),
    path('api/admin/reported-content/', admin_views.admin_reported_content, name='admin-reported-content'),
    path('api/admin/user-management-summary/', admin_views.admin_user_management_summary, name='admin-user-management-summary'),
    path('api/admin/permissions/', admin_views.admin_permissions, name='admin-permissions'),

    # Admin API v1 namespace
    path('api/admin/v1/users/', admin_views.admin_v1_users, name='admin-v1-users'),
    path('api/admin/v1/users/bulk-ban/', admin_views.admin_v1_users_bulk_ban, name='admin-v1-users-bulk-ban'),
    path('api/admin/v1/spheres/', admin_views.admin_v1_spheres, name='admin-v1-spheres'),
    path('api/admin/v1/posts/', admin_views.admin_v1_posts, name='admin-v1-posts'),
    path('api/admin/v1/posts/bulk-delete/', admin_views.admin_v1_posts_bulk_delete, name='admin-v1-posts-bulk-delete'),
    path('api/admin/v1/resources/', admin_views.admin_v1_resources, name='admin-v1-resources'),
    path('api/admin/v1/resources/bulk-delete/', admin_views.admin_v1_resources_bulk_delete, name='admin-v1-resources-bulk-delete'),
    path('api/admin/v1/reports/', admin_views.admin_v1_reports, name='admin-v1-reports'),
    path('api/admin/v1/reports/bulk-approve/', admin_views.admin_v1_reports_bulk_approve, name='admin-v1-reports-bulk-approve'),
    path('api/admin/v1/stats/', admin_views.admin_v1_stats, name='admin-v1-stats'),

    # Search and utility endpoints
    path('api/search/', views.global_search, name='global-search'),
    path('api/search/suggestions/', views.search_suggestions, name='search-suggestions'),
    path('api/filters/', views.filter_options, name='filter-options'),

    # Health and info
    path('api/health/', views.health_check, name='health-check'),
    path('api/info/', views.api_info, name='api-info'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
