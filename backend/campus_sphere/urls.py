from django.contrib import admin
from django.urls import path, include
from . import views, admin_views
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

    # Search and utility endpoints
    path('api/search/', views.global_search, name='global-search'),
    path('api/search/suggestions/', views.search_suggestions, name='search-suggestions'),
    path('api/filters/', views.filter_options, name='filter-options'),
    path('api/admin/moderation-queue/', views.admin_moderation_queue, name='admin-moderation-queue'),
    path('api/admin/reported-content/', views.admin_reported_content, name='admin-reported-content'),
    path('api/admin/user-management-summary/', views.admin_user_management_summary, name='admin-user-management-summary'),

    # Health and info
    path('api/health/', views.health_check, name='health-check'),
    path('api/info/', views.api_info, name='api-info'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
