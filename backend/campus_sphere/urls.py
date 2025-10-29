from django.contrib import admin
from django.urls import path, include
from . import views
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/spheres/', include('spheres.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/resources/', include('resources.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/', include('messaging.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('upload.urls')),

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
